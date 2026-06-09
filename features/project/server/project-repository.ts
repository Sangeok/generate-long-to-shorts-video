import "server-only";

import type { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/db";

import type {
  CaptionSegment,
  ProjectStatus,
  TranscriptData,
} from "../types";

interface CreateProjectInput {
  userId: string;
  title: string;
  videoKey: string;
  durationSec?: number | null;
  width?: number | null;
  height?: number | null;
}

export function createProject(input: CreateProjectInput) {
  return prisma.project.create({
    data: {
      userId: input.userId,
      title: input.title,
      videoKey: input.videoKey,
      status: "uploaded",
      durationSec: input.durationSec ?? null,
      width: input.width ?? null,
      height: input.height ?? null,
    },
  });
}

export function getProjectForUser(projectId: string, userId: string) {
  return prisma.project.findFirst({ where: { id: projectId, userId } });
}

export function getProjectVideoKey(projectId: string) {
  return prisma.project.findUniqueOrThrow({
    where: { id: projectId },
    select: { videoKey: true },
  });
}

export function updateProjectStatus(projectId: string, status: ProjectStatus) {
  return prisma.project.update({
    where: { id: projectId },
    data: { status },
  });
}

export function saveTranscription(
  projectId: string,
  transcript: TranscriptData,
  captionsVtt: string,
  segments: CaptionSegment[],
) {
  return prisma.project.update({
    where: { id: projectId },
    data: {
      status: "transcribed",
      transcript: transcript as unknown as Prisma.InputJsonValue,
      captionsVtt,
      segments: segments as unknown as Prisma.InputJsonValue,
      error: null,
    },
  });
}

export function markProjectFailed(projectId: string, error: string) {
  return prisma.project.update({
    where: { id: projectId },
    data: { status: "failed", error },
  });
}
