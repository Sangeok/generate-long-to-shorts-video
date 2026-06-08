import "server-only";

import { videoUploadedEvent, inngest } from "@/lib/inngest";

import {
  getProjectKey,
  markFailed,
  markReady,
  updateProjectStatus,
} from "./project-repository";
import {
  createViewUrl,
  getViewUrlTtlSeconds,
  objectExists,
} from "./s3-presign";

export const processUploadedVideo = inngest.createFunction(
  {
    id: "process-uploaded-video",
    retries: 3,
    triggers: [{ event: videoUploadedEvent }],
    onFailure: async ({ event, error }) => {
      const { projectId } = event.data.event.data;
      await markFailed(projectId, error.message);
    },
  },
  async ({ event, step }) => {
    const { projectId } = event.data;

    await step.run("mark-processing", async () => {
      await updateProjectStatus(projectId, "PROCESSING");
    });

    const key = await step.run("load-key", async () => {
      const project = await getProjectKey(projectId);
      return project.s3Key;
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
      const expiresAt = new Date(Date.now() + getViewUrlTtlSeconds() * 1000);
      await markReady(projectId, viewUrl, expiresAt);
    });

    return { projectId, viewUrl };
  },
);
