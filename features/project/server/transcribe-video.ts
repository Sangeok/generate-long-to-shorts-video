import "server-only";

import { getDeepgramClient } from "@/lib/deepgram";
import { inngest } from "@/lib/inngest";

import type { ProjectLanguage } from "../types";
import { buildSegments, buildVtt } from "./captions";
import { detectShorts } from "./detect-shorts";
import {
  deleteGeminiFilesForProject,
  detectShortsFromUploadedVideo,
  prepareVideoForDetection,
} from "./detect-shorts-video";
import {
  getProjectVideoKey,
  markProjectFailed,
  saveShorts,
  saveTranscription,
  updateProjectStatus,
} from "./project-repository";
import { presignGetUrl } from "./s3-presign";

// Deepgram SDK defaults to a 60s request timeout, which long videos exceed.
const TRANSCRIBE_TIMEOUT_SEC = 600;

interface DeepgramResult {
  results?: {
    channels?: { alternatives?: { transcript?: string }[] }[];
    utterances?: { start: number; end: number; transcript: string }[];
  };
  metadata?: { detected_language?: string };
}

export const transcribeVideo = inngest.createFunction(
  {
    id: "transcribe-video",
    retries: 3,
    triggers: [{ event: "project/video.uploaded" }],
    onFailure: async ({ event, error }) => {
      const { projectId } = event.data.event.data as { projectId: string };
      await markProjectFailed(projectId, error.message);
      // A cinematic run may have uploaded a proxy to Gemini before failing.
      await deleteGeminiFilesForProject(projectId).catch(() => {});
    },
  },
  async ({ event, step }) => {
    const { projectId } = event.data as { projectId: string };

    await step.run("mark-transcribing", () =>
      updateProjectStatus(projectId, "transcribing"),
    );

    const { videoKey, contentType, language } = await step.run(
      "load-project",
      () => getProjectVideoKey(projectId),
    );
    const projectLanguage = language as ProjectLanguage;

    // Transcription and cinematic video prep are independent until the Gemini
    // call, so they run in parallel; prep usually dominates, hiding the
    // transcription time entirely.
    const [captions, preparedVideo] = await Promise.all([
      (async () => {
        const transcription = await step.run("transcribe", async () => {
          const url = await presignGetUrl(videoKey);
          const result =
            await getDeepgramClient().listen.v1.media.transcribeUrl(
              {
                url,
                model: "nova-3",
                language: projectLanguage,
                smart_format: true,
                punctuate: true,
                utterances: true,
              },
              { timeoutInSeconds: TRANSCRIBE_TIMEOUT_SEC },
            );
          return result as unknown as DeepgramResult;
        });

        const built = await step.run("build-captions", () => {
          const utterances = transcription.results?.utterances ?? [];
          const segments = buildSegments(utterances);
          const vtt = buildVtt(segments);
          const text =
            transcription.results?.channels?.[0]?.alternatives?.[0]
              ?.transcript ?? "";
          return {
            text,
            language: transcription.metadata?.detected_language ?? projectLanguage,
            segments,
            vtt,
          };
        });

        // Persist stays inside this branch so captions reach the UI as soon
        // as they exist — do not move it after the parallel join.
        await step.run("persist", () =>
          saveTranscription(
            projectId,
            { text: built.text, language: built.language },
            built.vtt,
            built.segments,
          ),
        );

        return built;
      })(),
      contentType === "cinematic"
        ? step.run("prepare-video", async () => {
            const sourceUrl = await presignGetUrl(videoKey);
            return prepareVideoForDetection(sourceUrl, projectId);
          })
        : Promise.resolve(null),
    ]);

    await step.run("mark-generating-shorts", () =>
      updateProjectStatus(projectId, "generating_shorts"),
    );

    // Talk content is judged from captions alone; cinematic content needs the
    // video itself so visual and audio-only moments are not missed.
    const shorts = await step.run("detect-shorts", () =>
      preparedVideo
        ? detectShortsFromUploadedVideo(
            preparedVideo,
            captions.segments,
            projectLanguage,
          )
        : detectShorts(captions.text, captions.segments, projectLanguage),
    );

    await step.run("persist-shorts", () => saveShorts(projectId, shorts));

    await step.sendEvent("emit-shorts-detected", {
      name: "project/shorts.detected",
      data: { projectId },
    });

    return { projectId };
  },
);
