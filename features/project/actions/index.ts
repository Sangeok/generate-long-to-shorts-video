"use server";

import { getCurrentSession } from "@/lib/auth-server";
import { inngest } from "@/lib/inngest";

import {
  createProject,
  presignPutUrl,
} from "../server";

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
