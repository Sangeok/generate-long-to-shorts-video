import type { ProjectStatusResponse } from "../types";

export async function getProjectStatus(
  projectId: string,
): Promise<ProjectStatusResponse> {
  const res = await fetch(`/api/projects/${projectId}/status`, {
    cache: "no-store",
  });
  if (!res.ok) {
    throw new Error("Failed to load project status");
  }
  return res.json();
}
