import "server-only";

import { mkdtemp, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { setTimeout as sleep } from "node:timers/promises";

import {
  FileState,
  MediaResolution,
  type File as GeminiFile,
} from "@google/genai";

import { getGeminiClient } from "@/lib/gemini";

import { SHORTS_CONFIG, type ShortsConfig } from "../config";
import type {
  CaptionSegment,
  ProjectLanguage,
  ShortClip,
} from "../types";
import {
  clampMoments,
  languageInstruction,
  momentsSchema,
  toShortClips,
} from "./detect-shorts";
import { downloadSource, runFfmpeg } from "./ffmpeg";

export interface PreparedVideo {
  uri: string;
  mimeType: string;
  name: string;
}

const FILE_POLL_INTERVAL_MS = 10_000;
// Long sources can take well over 10 minutes to process; failing early would
// rerun the whole download + transcode on retry.
const FILE_POLL_TIMEOUT_MS = 30 * 60 * 1000;

// Gemini Files API caps uploads at 2GB. Tokens are billed by duration, not
// resolution, so a 240p ultrafast proxy shrinks the upload and transcode time
// without changing cost. Frames beyond Gemini's sampling rate are dropped —
// the proxy fps must stay >= config.videoFps or sampling silently caps.
function buildProxy(
  tempDir: string,
  sourceName: string,
  proxyName: string,
  proxyFps: number,
): Promise<void> {
  return runFfmpeg(
    [
      "-y",
      "-i",
      sourceName,
      "-vf",
      `fps=${proxyFps},scale=-2:240`,
      "-c:v",
      "libx264",
      "-preset",
      "ultrafast",
      "-crf",
      "32",
      "-c:a",
      "aac",
      "-b:a",
      "64k",
      "-ac",
      "1",
      "-movflags",
      "+faststart",
      proxyName,
    ],
    tempDir,
  );
}

// displayName carries the project id so failure-path cleanup can find the
// file without access to step results.
async function uploadProxy(
  proxyPath: string,
  displayName: string,
): Promise<GeminiFile> {
  const client = getGeminiClient();
  let file = await client.files.upload({
    file: proxyPath,
    config: { mimeType: "video/mp4", displayName },
  });

  const deadline = Date.now() + FILE_POLL_TIMEOUT_MS;
  while (file.state === FileState.PROCESSING) {
    if (Date.now() > deadline) {
      throw new Error("Gemini file processing timed out");
    }
    await sleep(FILE_POLL_INTERVAL_MS);
    file = await client.files.get({ name: file.name ?? "" });
  }
  if (file.state !== FileState.ACTIVE) {
    throw new Error(`Gemini file is not active: ${file.state}`);
  }
  return file;
}

function buildVideoPrompt(
  segments: CaptionSegment[],
  language: ProjectLanguage,
  config: ShortsConfig,
): string {
  const timeline = segments
    .map(
      (segment) =>
        `[${segment.start.toFixed(1)}-${segment.end.toFixed(1)}] ${segment.text}`,
    )
    .join("\n");

  return [
    "You are an expert short-form video editor.",
    "Watch and listen to the attached long-form video and find the most",
    "engaging, self-contained moments to cut into vertical short videos.",
    "Judge visuals (action, expressions, reveals) and audio (music, sound",
    "design, delivery) as well as dialogue - the best moment may contain",
    "no dialogue at all.",
    "",
    "Requirements:",
    `- Return exactly ${config.count} moments (or as many as the content allows).`,
    `- Each clip must be between ${config.minDurationSec} and ${config.maxDurationSec} seconds long.`,
    "- startSec and endSec are seconds from the start of the video and must not overlap.",
    "- Prefer moments with a strong hook, payoff, emotion, or standalone insight.",
    "- seoScore (0-100) reflects how likely the clip ranks and goes viral.",
    `- ${languageInstruction(language)}`,
    "",
    "Dialogue timeline (seconds) for reference:",
    timeline,
  ].join("\n");
}

// Download → proxy → Gemini upload. Independent of transcription, so it runs
// in parallel with it; the returned identifiers can cross Inngest step
// boundaries because the file lives on Gemini's side (48h), not in temp.
export async function prepareVideoForDetection(
  videoUrl: string,
  projectId: string,
  config: ShortsConfig = SHORTS_CONFIG,
): Promise<PreparedVideo> {
  const tempDir = await mkdtemp(path.join(os.tmpdir(), "shorts-"));
  const sourceName = "source.mp4";
  const proxyName = "proxy.mp4";

  try {
    await downloadSource(videoUrl, path.join(tempDir, sourceName));
    await buildProxy(
      tempDir,
      sourceName,
      proxyName,
      Math.max(1, config.videoFps),
    );
    const uploaded = await uploadProxy(
      path.join(tempDir, proxyName),
      projectId,
    );
    if (!uploaded.uri || !uploaded.mimeType || !uploaded.name) {
      throw new Error("Gemini file is missing identifiers");
    }
    return {
      uri: uploaded.uri,
      mimeType: uploaded.mimeType,
      name: uploaded.name,
    };
  } finally {
    await rm(tempDir, { recursive: true, force: true });
  }
}

export async function detectShortsFromUploadedVideo(
  video: PreparedVideo,
  segments: CaptionSegment[],
  language: ProjectLanguage,
  config: ShortsConfig = SHORTS_CONFIG,
): Promise<ShortClip[]> {
  const response = await getGeminiClient().models.generateContent({
    model: config.geminiModel,
    contents: [
      {
        role: "user",
        parts: [
          {
            fileData: { fileUri: video.uri, mimeType: video.mimeType },
            videoMetadata: { fps: config.videoFps },
          },
          { text: buildVideoPrompt(segments, language, config) },
        ],
      },
    ],
    config: {
      responseMimeType: "application/json",
      responseSchema: momentsSchema,
      mediaResolution: MediaResolution.MEDIA_RESOLUTION_LOW,
    },
  });

  const raw = response.text;
  if (!raw) {
    throw new Error("Gemini returned an empty shorts response");
  }

  const moments = clampMoments(JSON.parse(raw), config);
  const clips = toShortClips(moments, segments);

  // Delete only after success — a retried step must still find the file.
  // Permanent failures are cleaned up by deleteGeminiFilesForProject, and
  // files auto-expire after 48h anyway.
  await getGeminiClient()
    .files.delete({ name: video.name })
    .catch(() => {});

  return clips;
}

// Failure-path cleanup, matched by the displayName tag set at upload.
// Best-effort: files auto-expire after 48h.
export async function deleteGeminiFilesForProject(
  projectId: string,
): Promise<void> {
  const client = getGeminiClient();
  const pager = await client.files.list({ config: { pageSize: 100 } });
  for await (const file of pager) {
    if (file.displayName === projectId && file.name) {
      await client.files.delete({ name: file.name }).catch(() => {});
    }
  }
}
