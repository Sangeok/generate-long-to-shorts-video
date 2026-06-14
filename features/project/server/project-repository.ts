import "server-only";

import type { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/db";

import { parseCaptionStyle } from "../caption-style";
import type {
  CaptionSegment,
  CaptionStyle,
  ProjectContentType,
  ProjectLanguage,
  ProjectStatus,
  ProjectSummary,
  ShortClip,
  ShortRecord,
  TranscriptData,
} from "../types";

interface CreateProjectInput {
  userId: string;
  title: string;
  videoKey: string;
  contentType: ProjectContentType;
  language: ProjectLanguage;
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
      contentType: input.contentType,
      language: input.language,
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

// Library listing: newest first, with per-project shorts counts. Selecting only
// each short's clipKey keeps the aggregate cheap (a handful of shorts each).
export async function getProjectsForUser(
  userId: string,
): Promise<ProjectSummary[]> {
  const projects = await prisma.project.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      title: true,
      contentType: true,
      status: true,
      durationSec: true,
      createdAt: true,
      shorts: { select: { clipKey: true } },
    },
  });

  return projects.map((project) => ({
    id: project.id,
    title: project.title,
    contentType: project.contentType as ProjectContentType,
    status: project.status as ProjectStatus,
    durationSec: project.durationSec,
    totalShorts: project.shorts.length,
    readyShorts: project.shorts.filter((short) => short.clipKey).length,
    createdAt: project.createdAt.toISOString(),
  }));
}

// Ownership-guarded shorts fetch for the inline library shelf.
export async function getProjectShortsForUser(
  projectId: string,
  userId: string,
): Promise<ShortRecord[] | null> {
  const owned = await prisma.project.findFirst({
    where: { id: projectId, userId },
    select: { id: true },
  });
  if (!owned) return null;
  return getShortsForProject(projectId);
}

export function deleteProjectForUser(projectId: string, userId: string) {
  return prisma.project.deleteMany({ where: { id: projectId, userId } });
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
    captionStyle: parseCaptionStyle(short.captionStyle),
    clipKey: short.clipKey,
    renderError: short.renderError,
    exportKey: short.exportKey,
    exportError: short.exportError,
  }));
}

export function getShortForUser(shortId: string, userId: string) {
  return prisma.short.findFirst({
    where: { id: shortId, project: { userId } },
    select: {
      id: true,
      title: true,
      clipKey: true,
      exportKey: true,
      exportError: true,
    },
  });
}

export function getShortDetailForUser(shortId: string, userId: string) {
  return prisma.short.findFirst({
    where: { id: shortId, project: { userId } },
    select: {
      id: true,
      projectId: true,
      title: true,
      durationSec: true,
      segments: true,
      captionStyle: true,
      clipKey: true,
    },
  });
}

export function getShortsForRender(projectId: string) {
  return prisma.short.findMany({
    where: { projectId, clipKey: null },
    select: { id: true, startSec: true, endSec: true },
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

export function getShortForExport(shortId: string) {
  return prisma.short.findUniqueOrThrow({
    where: { id: shortId },
    select: {
      id: true,
      projectId: true,
      clipKey: true,
      exportKey: true,
      segments: true,
      captionStyle: true,
    },
  });
}

export function setShortExportKey(shortId: string, exportKey: string) {
  return prisma.short.update({
    where: { id: shortId },
    data: { exportKey, exportError: null },
  });
}

export function setShortExportError(shortId: string, error: string) {
  return prisma.short.update({
    where: { id: shortId },
    data: { exportError: error },
  });
}

export function clearShortExportError(shortId: string) {
  return prisma.short.update({
    where: { id: shortId },
    data: { exportError: null },
  });
}

// Editing captions invalidates any previously burned export.
export function updateShortCaptionData(
  shortId: string,
  segments: CaptionSegment[],
  captionStyle: CaptionStyle,
) {
  return prisma.short.update({
    where: { id: shortId },
    data: {
      segments: segments as unknown as Prisma.InputJsonValue,
      captionStyle: captionStyle as unknown as Prisma.InputJsonValue,
      exportKey: null,
      exportError: null,
    },
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
    select: { videoKey: true, contentType: true, language: true },
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
