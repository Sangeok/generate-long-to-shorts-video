"use server";

import { revalidatePath } from "next/cache";

import { getCurrentSession } from "@/lib/auth-server";
import { inngest } from "@/lib/inngest";

import { parseCaptionStyle } from "../caption-style";
import {
  clearShortExportError,
  createProject,
  deleteProjectForUser,
  getProjectShortsForUser,
  getShortDetailForUser,
  getShortForUser,
  presignDownloadUrl,
  presignPutUrl,
  updateShortCaptionData,
} from "../server";
import type {
  CaptionSegment,
  CaptionStyle,
  ProjectContentType,
  ProjectLanguage,
  ShortExportStatus,
  ShortRecord,
} from "../types";

interface CreateUploadUrlInput {
  filename: string;
  contentType: string;
}

interface CreateUploadUrlResult {
  uploadUrl: string;
  videoKey: string;
}

interface StartAnalysisInput {
  videoKey: string;
  title: string;
  contentType?: ProjectContentType;
  language?: ProjectLanguage;
  durationSec?: number | null;
  width?: number | null;
  height?: number | null;
}

function sanitizeFilename(name: string): string {
  const cleaned = name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9.-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "");
  return cleaned || "video";
}

export async function createUploadUrl(
  input: CreateUploadUrlInput,
): Promise<CreateUploadUrlResult> {
  const session = await getCurrentSession();
  if (!session) {
    throw new Error("Unauthorized");
  }
  if (!input.contentType.startsWith("video/")) {
    throw new Error("Only video uploads are allowed");
  }

  const videoKey = `uploads/${session.user.id}/${crypto.randomUUID()}/${sanitizeFilename(input.filename)}`;
  const uploadUrl = await presignPutUrl(videoKey, input.contentType);

  return { uploadUrl, videoKey };
}

export async function startAnalysis(
  input: StartAnalysisInput,
): Promise<{ projectId: string }> {
  const session = await getCurrentSession();
  if (!session) {
    throw new Error("Unauthorized");
  }

  const project = await createProject({
    userId: session.user.id,
    title: input.title,
    videoKey: input.videoKey,
    contentType: input.contentType === "cinematic" ? "cinematic" : "talk",
    language: input.language === "ko" ? "ko" : "en",
    durationSec: input.durationSec ?? null,
    width: input.width ?? null,
    height: input.height ?? null,
  });

  await inngest.send({
    name: "project/video.uploaded",
    data: { projectId: project.id },
  });

  return { projectId: project.id };
}

export async function updateShortCaptions(
  shortId: string,
  texts: string[],
  style: CaptionStyle,
): Promise<void> {
  const session = await getCurrentSession();
  if (!session) {
    throw new Error("Unauthorized");
  }

  const short = await getShortDetailForUser(shortId, session.user.id);
  if (!short) {
    throw new Error("Short not found");
  }

  const segments = short.segments as unknown as CaptionSegment[];
  if (texts.length !== segments.length) {
    throw new Error("Segment count mismatch");
  }

  const next = segments.map((segment, index) => ({
    ...segment,
    text: texts[index].trim(),
  }));
  await updateShortCaptionData(shortId, next, parseCaptionStyle(style));
}

function exportFilename(title: string): string {
  return `${sanitizeFilename(title)}.mp4`;
}

export async function requestShortExport(
  shortId: string,
): Promise<ShortExportStatus> {
  const session = await getCurrentSession();
  if (!session) {
    throw new Error("Unauthorized");
  }

  const short = await getShortForUser(shortId, session.user.id);
  if (!short) {
    throw new Error("Short not found");
  }
  if (short.exportKey) {
    return {
      status: "ready",
      url: await presignDownloadUrl(short.exportKey, exportFilename(short.title)),
    };
  }
  if (!short.clipKey) {
    throw new Error("Clip is not rendered yet");
  }

  if (short.exportError) {
    await clearShortExportError(shortId);
  }
  await inngest.send({
    name: "project/short.export.requested",
    data: { shortId },
  });
  return { status: "processing" };
}

export async function getShortExportStatus(
  shortId: string,
): Promise<ShortExportStatus> {
  const session = await getCurrentSession();
  if (!session) {
    throw new Error("Unauthorized");
  }

  const short = await getShortForUser(shortId, session.user.id);
  if (!short) {
    throw new Error("Short not found");
  }
  if (short.exportKey) {
    return {
      status: "ready",
      url: await presignDownloadUrl(short.exportKey, exportFilename(short.title)),
    };
  }
  if (short.exportError) {
    return { status: "failed", error: short.exportError };
  }
  return { status: "processing" };
}

// Loaded on demand when a library card expands its shorts shelf.
export async function getProjectShorts(
  projectId: string,
): Promise<ShortRecord[]> {
  const session = await getCurrentSession();
  if (!session) {
    throw new Error("Unauthorized");
  }

  const shorts = await getProjectShortsForUser(projectId, session.user.id);
  if (!shorts) {
    throw new Error("Project not found");
  }
  return shorts;
}

export async function deleteProject(projectId: string): Promise<void> {
  const session = await getCurrentSession();
  if (!session) {
    throw new Error("Unauthorized");
  }

  await deleteProjectForUser(projectId, session.user.id);
  revalidatePath("/dashboard/videos");
}
