import type { Video } from "@/generated/prisma/client";

import type { VideoDTO } from "./types";

export function serializeVideo(video: Video): VideoDTO {
  return {
    id: video.id,
    title: video.title,
    originalFilename: video.originalFilename,
    status: video.status,
    sizeBytes: video.sizeBytes.toString(),
    contentType: video.contentType,
    durationSeconds: video.durationSeconds,
    width: video.width,
    height: video.height,
    viewUrl: video.viewUrl,
    error: video.error,
    createdAt: video.createdAt.toISOString(),
    updatedAt: video.updatedAt.toISOString(),
  };
}
