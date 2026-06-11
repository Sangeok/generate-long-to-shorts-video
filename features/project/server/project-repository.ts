import "server-only";

import type { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/db";

import type {
  CaptionSegment,
  ProjectStatus,
  ShortClip,
  ShortRecord,
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

export async function getShortsForProject(
  projectId: string,
): Promise<ShortRecord[]> {
  const shorts = await prisma.short.findMany({
    where: { projectId },
    orderBy: { seoScore: "desc" },
  });
  return shorts.map((short) => ({
    id: short.id,
    title: short.title,
    startSec: short.startSec,
    endSec: short.endSec,
    durationSec: short.durationSec,
    reason: short.reason,
    seoScore: short.seoScore,
    segments: short.segments as unknown as CaptionSegment[],
    clipKey: short.clipKey,
    renderError: short.renderError,
  }));
}

export function getShortForUser(shortId: string, userId: string) {
  return prisma.short.findFirst({
    where: { id: shortId, project: { userId } },
    select: { id: true, title: true, clipKey: true },
  });
}

export function getShortsForRender(projectId: string) {
  return prisma.short.findMany({
    where: { projectId, clipKey: null },
    select: { id: true, startSec: true, endSec: true, segments: true },
    orderBy: { seoScore: "desc" },
  });
}

export function setShortClipKey(shortId: string, clipKey: string) {
  return prisma.short.update({
    where: { id: shortId },
    data: { clipKey, renderError: null },
  });
}

export function setShortRenderError(shortId: string, error: string) {
  return prisma.short.update({
    where: { id: shortId },
    data: { renderError: error },
  });
}

export function markPendingShortsFailed(projectId: string, error: string) {
  return prisma.short.updateMany({
    where: { projectId, clipKey: null, renderError: null },
    data: { renderError: error },
  });
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

export function saveShorts(projectId: string, shorts: ShortClip[]) {
  return prisma.$transaction([
    prisma.short.deleteMany({ where: { projectId } }),
    prisma.short.createMany({
      data: shorts.map((short) => ({
        projectId,
        title: short.title,
        startSec: short.startSec,
        endSec: short.endSec,
        durationSec: short.durationSec,
        reason: short.reason,
        seoScore: short.seoScore,
        captionsVtt: short.captionsVtt,
        segments: short.segments as unknown as Prisma.InputJsonValue,
      })),
    }),
    prisma.project.update({
      where: { id: projectId },
      data: { status: "completed", error: null },
    }),
  ]);
}

export function markProjectFailed(projectId: string, error: string) {
  return prisma.project.update({
    where: { id: projectId },
    data: { status: "failed", error },
  });
}
