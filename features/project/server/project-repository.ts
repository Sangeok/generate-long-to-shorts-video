import "server-only";

import type { ProjectStatus } from "@/generated/prisma/client";
import { prisma } from "@/lib/db";

interface CreateProjectInput {
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

export function createProject(input: CreateProjectInput) {
  return prisma.project.create({
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

export function getProjectForUser(projectId: string, userId: string) {
  return prisma.project.findFirst({ where: { id: projectId, userId } });
}

export function getProjectKey(projectId: string) {
  return prisma.project.findUniqueOrThrow({
    where: { id: projectId },
    select: { s3Key: true },
  });
}

export function updateProjectStatus(projectId: string, status: ProjectStatus) {
  return prisma.project.update({ where: { id: projectId }, data: { status } });
}

export function markReady(
  projectId: string,
  viewUrl: string,
  viewUrlExpiresAt: Date,
) {
  return prisma.project.update({
    where: { id: projectId },
    data: { status: "READY", viewUrl, viewUrlExpiresAt, error: null },
  });
}

export function markFailed(projectId: string, error: string) {
  return prisma.project.update({
    where: { id: projectId },
    data: { status: "FAILED", error },
  });
}

export function saveViewUrl(
  projectId: string,
  viewUrl: string,
  viewUrlExpiresAt: Date,
) {
  return prisma.project.update({
    where: { id: projectId },
    data: { viewUrl, viewUrlExpiresAt },
  });
}
