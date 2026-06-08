import "server-only";

import { videoUploadedEvent, inngest } from "@/lib/inngest";

import {
  VIEW_URL_TTL_SECONDS,
  createViewUrl,
  objectExists,
} from "./s3-presign";
import {
  getVideoKey,
  markFailed,
  markReady,
  updateVideoStatus,
} from "./video-repository";

export const processUploadedVideo = inngest.createFunction(
  {
    id: "process-uploaded-video",
    retries: 3,
    triggers: [{ event: videoUploadedEvent }],
    onFailure: async ({ event, error }) => {
      const { videoId } = event.data.event.data;
      await markFailed(videoId, error.message);
    },
  },
  async ({ event, step }) => {
    const { videoId } = event.data;

    await step.run("mark-processing", async () => {
      await updateVideoStatus(videoId, "PROCESSING");
    });

    const key = await step.run("load-key", async () => {
      const video = await getVideoKey(videoId);
      return video.s3Key;
    });

    await step.run("verify-s3-object", async () => {
      const exists = await objectExists(key);
      if (!exists) {
        throw new Error(`S3 object not found for key: ${key}`);
      }
    });

    const viewUrl = await step.run("sign-view-url", async () => {
      return createViewUrl(key);
    });

    await step.run("finalize", async () => {
      const expiresAt = new Date(Date.now() + VIEW_URL_TTL_SECONDS * 1000);
      await markReady(videoId, viewUrl, expiresAt);
    });

    return { videoId, viewUrl };
  },
);
