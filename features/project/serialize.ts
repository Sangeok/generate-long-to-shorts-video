import type { Project } from "@/generated/prisma/client";

import type { ProjectDTO } from "./types";

export function serializeProject(project: Project): ProjectDTO {
  return {
    id: project.id,
    title: project.title,
    originalFilename: project.originalFilename,
    status: project.status,
    sizeBytes: project.sizeBytes.toString(),
    contentType: project.contentType,
    durationSeconds: project.durationSeconds,
    width: project.width,
    height: project.height,
    viewUrl: project.viewUrl,
    error: project.error,
    createdAt: project.createdAt.toISOString(),
    updatedAt: project.updatedAt.toISOString(),
  };
}
