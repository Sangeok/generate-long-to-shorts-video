import type { ProjectDTO } from "../types";

export async function getProject(projectId: string): Promise<ProjectDTO> {
  const res = await fetch(`/api/projects/${projectId}`);
  if (!res.ok) {
    throw new Error("Failed to load project");
  }
  return res.json();
}
