import { Inngest, eventType, staticSchema } from "inngest";

export const videoUploadedEvent = eventType("video/uploaded", {
  schema: staticSchema<{ videoId: string; userId: string }>(),
});

export const inngest = new Inngest({ id: "longformshorts" });
