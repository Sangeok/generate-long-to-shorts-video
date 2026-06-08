import type { ProjectStatus } from "@/generated/prisma/client";

export type UploadPhase =
  | "idle"
  | "selected"
  | "uploading"
  | "processing"
  | "ready"
  | "failed";

export interface ProjectDTO {
  id: string;
  title: string;
  originalFilename: string;
  status: ProjectStatus;
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

export interface CreateProjectResponse {
  projectId: string;
  uploadUrl: string;
  key: string;
}
