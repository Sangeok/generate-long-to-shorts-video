import "server-only";

import { videoUploadedEvent, inngest } from "@/lib/inngest";

import { buildPendingS3Key } from "../s3-key";
import { createViewUrl, objectExists } from "./s3-presign";
import { uploadPendingVideoToS3 } from "./s3-upload";
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

    await step.run("verify-pending-s3-object", async () => {
      const pendingKey = buildPendingS3Key(key);
      const exists = await objectExists(pendingKey);
      if (!exists) {
        throw new Error(`S3 object not found for key: ${pendingKey}`);
      }
    });

    const uploaded = await step.run("upload-to-s3", async () => {
      return uploadPendingVideoToS3(key);
    });

    const signed = await step.run("sign-view-url", async () => {
      return createViewUrl(uploaded.key);
    });

    await step.run("finalize", async () => {
      await markReady(videoId, signed.url, new Date(signed.expiresAtMs));
    });

    return { videoId, videoUrl: uploaded.url, viewUrl: signed.url };
  },
);
