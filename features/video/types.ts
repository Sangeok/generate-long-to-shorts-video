import type { VideoStatus } from "@/generated/prisma/client";

export type UploadPhase =
  | "idle"
  | "selected"
  | "uploading"
  | "processing"
  | "ready"
  | "failed";

export interface VideoDTO {
  id: string;
  title: string;
  originalFilename: string;
  status: VideoStatus;
  sizeBytes: string;
  contentType: string;
  durationSeconds: number | null;
  width: number | null;
  height: number | null;
  viewUrl: string | null;
  error: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateVideoResponse {
  videoId: string;
  uploadUrl: string;
  key: string;
}
