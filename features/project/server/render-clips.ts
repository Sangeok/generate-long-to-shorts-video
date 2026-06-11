import "server-only";

import { spawn } from "node:child_process";
import { createWriteStream } from "node:fs";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { Readable } from "node:stream";
import { pipeline } from "node:stream/promises";
import type { ReadableStream as WebReadableStream } from "node:stream/web";

import { inngest } from "@/lib/inngest";

import type { CaptionSegment } from "../types";
import { buildVtt, splitSegmentsForCaptions } from "./captions";
import {
  getProjectVideoKey,
  getShortsForRender,
  markPendingShortsFailed,
  setShortClipKey,
  setShortRenderError,
} from "./project-repository";
import { presignGetUrl } from "./s3-presign";
import { uploadObject } from "./s3-upload";

// Center-crop to 9:16, then normalize to 1080x1920.
const VERTICAL_FILTER = "crop=min(iw\\,ih*9/16):ih,scale=1080:1920";

// libass force_style in ASS PlayRes units (288 high): bold white text with a
// black outline, bottom-centered above the player UI.
const SUBTITLE_STYLE = [
  "Fontname=Malgun Gothic",
  "Fontsize=13",
  "Bold=1",
  "PrimaryColour=&H00FFFFFF",
  "OutlineColour=&H00000000",
  "BorderStyle=1",
  "Outline=2",
  "Shadow=0",
  "Alignment=2",
  "MarginV=28",
].join(",");

// The dev IAM user only allows s3:PutObject under uploads/*, so rendered
// clips live there as well.
const CLIP_KEY_PREFIX = "uploads/clips";

interface RenderTarget {
  id: string;
  startSec: number;
  endSec: number;
  segments: CaptionSegment[];
}

// cwd is the temp dir so the subtitles filter can take a bare filename —
// absolute Windows paths need fragile escaping inside filter graphs.
function runFfmpeg(args: string[], cwd: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const child = spawn("ffmpeg", args, {
      cwd,
      stdio: ["ignore", "ignore", "pipe"],
    });
    let stderr = "";
    child.stderr.on("data", (chunk: Buffer) => {
      stderr += chunk.toString();
    });
    child.on("error", reject);
    child.on("close", (code) => {
      if (code === 0) {
        resolve();
        return;
      }
      reject(new Error(`ffmpeg exited with code ${code}: ${stderr.slice(-500)}`));
    });
  });
}

// ffmpeg reads HTTPS inputs at ~0.01x because every demuxer seek becomes an
// HTTP range round trip, so the source is downloaded once and cut locally.
async function downloadSource(url: string, destPath: string): Promise<void> {
  const res = await fetch(url);
  if (!res.ok || !res.body) {
    throw new Error(`Source download failed with status ${res.status}`);
  }
  await pipeline(
    Readable.fromWeb(res.body as WebReadableStream<Uint8Array>),
    createWriteStream(destPath),
  );
}

async function renderClipFile(
  tempDir: string,
  sourceName: string,
  target: RenderTarget,
  outputName: string,
): Promise<void> {
  const vttName = `${target.id}.vtt`;
  const cues = splitSegmentsForCaptions(target.segments);
  await writeFile(path.join(tempDir, vttName), buildVtt(cues), "utf8");

  await runFfmpeg(
    [
      "-y",
      "-ss",
      String(target.startSec),
      "-i",
      sourceName,
      "-t",
      String(target.endSec - target.startSec),
      "-vf",
      `${VERTICAL_FILTER},subtitles=${vttName}:force_style='${SUBTITLE_STYLE}'`,
      "-c:v",
      "libx264",
      "-preset",
      "veryfast",
      "-crf",
      "23",
      "-c:a",
      "aac",
      "-movflags",
      "+faststart",
      outputName,
    ],
    tempDir,
  );
}

export const renderClips = inngest.createFunction(
  {
    id: "render-clips",
    retries: 1,
    triggers: [{ event: "project/shorts.detected" }],
    // Run-level failures (e.g. source download) never reach the per-short
    // handling below, so pending shorts are settled here to stop the UI from
    // polling a clip that will never arrive.
    onFailure: async ({ event, error }) => {
      const { projectId } = event.data.event.data as { projectId: string };
      await markPendingShortsFailed(projectId, error.message);
    },
  },
  async ({ event, step }) => {
    const { projectId } = event.data as { projectId: string };

    const shorts = await step.run("load-shorts", async () => {
      const rows = await getShortsForRender(projectId);
      return rows.map((row) => ({
        ...row,
        segments: row.segments as unknown as CaptionSegment[],
      }));
    });
    if (shorts.length === 0) {
      return { projectId, rendered: 0 };
    }

    // Single step: the downloaded source lives in a temp dir that would not
    // survive across separate step invocations.
    const results = await step.run("render-clips", async () => {
      const { videoKey } = await getProjectVideoKey(projectId);
      const sourceUrl = await presignGetUrl(videoKey);
      const tempDir = await mkdtemp(path.join(os.tmpdir(), "clips-"));
      const sourceName = "source.mp4";

      try {
        await downloadSource(sourceUrl, path.join(tempDir, sourceName));

        const outcomes: { shortId: string; clipKey?: string; error?: string }[] =
          [];
        for (const short of shorts) {
          // Failures are recorded per short so one bad clip never blocks the rest.
          const outputName = `${short.id}.mp4`;
          try {
            await renderClipFile(tempDir, sourceName, short, outputName);
            const clipKey = `${CLIP_KEY_PREFIX}/${projectId}/${short.id}.mp4`;
            await uploadObject(
              clipKey,
              await readFile(path.join(tempDir, outputName)),
              "video/mp4",
            );
            await setShortClipKey(short.id, clipKey);
            outcomes.push({ shortId: short.id, clipKey });
          } catch (error) {
            const message =
              error instanceof Error ? error.message : String(error);
            await setShortRenderError(short.id, message);
            outcomes.push({ shortId: short.id, error: message });
          }
        }
        return outcomes;
      } finally {
        await rm(tempDir, { recursive: true, force: true });
      }
    });

    return { projectId, rendered: results.filter((r) => r.clipKey).length };
  },
);
