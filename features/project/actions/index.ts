"use server";

import { revalidatePath } from "next/cache";

import {
  normalizeClipCount,
  normalizeContentType,
  normalizeLanguage,
} from "@/constants/generation-limits";
import { getCurrentSession } from "@/lib/auth-server";
import { inngest } from "@/lib/inngest";

import { parseCaptionStyle } from "../caption-style";
import {
  DAILY_LIMIT_WINDOW_MS,
  getVideoMetaRejection,
  MAX_ACTIVE_PROJECTS,
  MAX_DAILY_PROJECTS,
  MAX_UPLOAD_BYTES,
} from "../project-limits";
import {
  clearShortExportError,
  countActiveProjectsForUser,
  countProjectsCreatedSinceForUser,
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
  DeleteProjectResult,
  ProjectContentType,
  ProjectLanguage,
  ShortExportStatus,
  ShortRecord,
  StartAnalysisResult,
} from "../types";

interface CreateUploadUrlInput {
  filename: string;
  contentType: string;
  fileSize: number;
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
  clipCount?: number;
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

// 방어선: 크기는 클라이언트에서 선검증되므로 throw를 유지한다.
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
  if (
    !Number.isFinite(input.fileSize) ||
    input.fileSize <= 0 ||
    input.fileSize > MAX_UPLOAD_BYTES
  ) {
    throw new Error("File exceeds the upload size limit");
  }

  const videoKey = `uploads/${session.user.id}/${crypto.randomUUID()}/${sanitizeFilename(input.filename)}`;
  const uploadUrl = await presignPutUrl(
    videoKey,
    input.contentType,
    Math.trunc(input.fileSize),
  );

  return { uploadUrl, videoKey };
}

export async function startAnalysis(
  input: StartAnalysisInput,
): Promise<StartAnalysisResult> {
  const session = await getCurrentSession();
  // 인증 실패는 다른 액션과 동일하게 throw, 가드 실패만 유니온으로 반환한다.
  if (!session) {
    throw new Error("Unauthorized");
  }

  // 클라이언트 메타 기반 best-effort 검증.
  const metaRejection = getVideoMetaRejection(
    input.durationSec ?? null,
    input.width ?? null,
    input.height ?? null,
  );
  if (metaRejection) {
    return { ok: false, reason: metaRejection };
  }

  const [activeCount, recentCount] = await Promise.all([
    countActiveProjectsForUser(session.user.id),
    countProjectsCreatedSinceForUser(
      session.user.id,
      new Date(Date.now() - DAILY_LIMIT_WINDOW_MS),
    ),
  ]);
  if (activeCount >= MAX_ACTIVE_PROJECTS) {
    return { ok: false, reason: "active-limit" };
  }
  if (recentCount >= MAX_DAILY_PROJECTS) {
    return { ok: false, reason: "daily-limit" };
  }

  const project = await createProject({
    userId: session.user.id,
    title: input.title,
    videoKey: input.videoKey,
    contentType: normalizeContentType(input.contentType),
    language: normalizeLanguage(input.language),
    clipCount: normalizeClipCount(input.clipCount),
    durationSec: input.durationSec ?? null,
    width: input.width ?? null,
    height: input.height ?? null,
  });

  await inngest.send({
    name: "project/video.uploaded",
    data: { projectId: project.id },
  });

  return { ok: true, projectId: project.id };
}

export async function updateShortCaptions(
  shortId: string,
  cues: CaptionSegment[],
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

  // 추가/삭제로 개수가 바뀌므로 개수 검사 대신 타이밍을 정규화한다. 빈 텍스트와
  // 잘못된 구간은 버리고, 재생 순서대로 정렬해 저장한다.
  const next = (Array.isArray(cues) ? cues : [])
    .map((cue) => ({
      start: Number(cue.start),
      end: Number(cue.end),
      text: String(cue.text ?? "").trim(),
    }))
    .filter(
      (cue) =>
        Number.isFinite(cue.start) &&
        Number.isFinite(cue.end) &&
        cue.start >= 0 &&
        cue.end > cue.start &&
        cue.text.length > 0,
    )
    .sort((a, b) => a.start - b.start);

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

export async function deleteProject(
  projectId: string,
): Promise<DeleteProjectResult> {
  const session = await getCurrentSession();
  if (!session) {
    throw new Error("Unauthorized");
  }

  const deleted = await deleteProjectForUser(projectId, session.user.id);
  revalidatePath("/dashboard/videos");
  return deleted ? { ok: true } : { ok: false, reason: "not-found" };
}
