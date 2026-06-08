import type { VideoStatus } from "@/generated/prisma/client";

import type { UploadPhase } from "./types";

export function mapStatusToPhase(status: VideoStatus): UploadPhase {
  switch (status) {
    case "PENDING":
    case "UPLOADING":
      return "uploading";
    case "UPLOADED":
    case "PROCESSING":
      return "processing";
    case "READY":
      return "ready";
    case "FAILED":
      return "failed";
    default:
      return "idle";
  }
}

export function isViewUrlExpired(expiresAt: Date | null, now: Date): boolean {
  if (!expiresAt) return true;
  return expiresAt.getTime() <= now.getTime();
}
