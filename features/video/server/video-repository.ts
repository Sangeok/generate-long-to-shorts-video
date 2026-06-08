import "server-only";

import type { VideoStatus } from "@/generated/prisma/client";
import { prisma } from "@/lib/db";

interface CreateVideoInput {
  id: string;
  userId: string;
  title: string;
  originalFilename: string;
  s3Key: string;
  contentType: string;
  sizeBytes: bigint;
  durationSeconds?: number | null;
  width?: number | null;
  height?: number | null;
}

export function createVideo(input: CreateVideoInput) {
  return prisma.video.create({
    data: {
      id: input.id,
      userId: input.userId,
      title: input.title,
      originalFilename: input.originalFilename,
      s3Key: input.s3Key,
      contentType: input.contentType,
      sizeBytes: input.sizeBytes,
      durationSeconds: input.durationSeconds ?? null,
      width: input.width ?? null,
      height: input.height ?? null,
      status: "PENDING",
    },
  });
}

export function getVideoForUser(videoId: string, userId: string) {
  return prisma.video.findFirst({ where: { id: videoId, userId } });
}

export function getVideoKey(videoId: string) {
  return prisma.video.findUniqueOrThrow({
    where: { id: videoId },
    select: { s3Key: true },
  });
}

export function updateVideoStatus(videoId: string, status: VideoStatus) {
  return prisma.video.update({ where: { id: videoId }, data: { status } });
}

export function markReady(
  videoId: string,
  viewUrl: string,
  viewUrlExpiresAt: Date,
) {
  return prisma.video.update({
    where: { id: videoId },
    data: { status: "READY", viewUrl, viewUrlExpiresAt, error: null },
  });
}

export function markFailed(videoId: string, error: string) {
  return prisma.video.update({
    where: { id: videoId },
    data: { status: "FAILED", error },
  });
}

export function saveViewUrl(
  videoId: string,
  viewUrl: string,
  viewUrlExpiresAt: Date,
) {
  return prisma.video.update({
    where: { id: videoId },
    data: { viewUrl, viewUrlExpiresAt },
  });
}
