import "server-only";

import { getDeepgramClient } from "@/lib/deepgram";
import { inngest } from "@/lib/inngest";

import { buildSegments, buildVtt } from "./captions";
import {
  getProjectVideoKey,
  markProjectFailed,
  saveTranscription,
  updateProjectStatus,
} from "./project-repository";
import { presignGetUrl } from "./s3-presign";

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
    },
  },
  async ({ event, step }) => {
    const { projectId } = event.data as { projectId: string };

    await step.run("mark-transcribing", () =>
      updateProjectStatus(projectId, "transcribing"),
    );

    const transcription = await step.run("transcribe", async () => {
      const { videoKey } = await getProjectVideoKey(projectId);
      const url = await presignGetUrl(videoKey);
      const result = await getDeepgramClient().listen.v1.media.transcribeUrl({
        url,
        model: "nova-3",
        smart_format: true,
        punctuate: true,
        utterances: true,
      });
      return result as unknown as DeepgramResult;
    });

    const captions = await step.run("build-captions", () => {
      const utterances = transcription.results?.utterances ?? [];
      const segments = buildSegments(utterances);
      const vtt = buildVtt(segments);
      const text =
        transcription.results?.channels?.[0]?.alternatives?.[0]?.transcript ??
        "";
      return {
        text,
        language: transcription.metadata?.detected_language ?? null,
        segments,
        vtt,
      };
    });

    await step.run("persist", () =>
      saveTranscription(
        projectId,
        { text: captions.text, language: captions.language },
        captions.vtt,
        captions.segments,
      ),
    );

    return {
      projectId,
      transcript: { text: captions.text, language: captions.language },
      captions: { vtt: captions.vtt, segments: captions.segments },
    };
  },
);
