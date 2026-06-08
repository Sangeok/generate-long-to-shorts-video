import { Inngest, eventType, staticSchema } from "inngest";

export const videoUploadedEvent = eventType(
  "project/video.uploaded",
  {
    schema: staticSchema<{ projectId: string; userId: string }>(),
  },
);

export const inngest = new Inngest({ id: "longformshorts" });
