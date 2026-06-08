import type { CreateProjectResponse } from "../types";

export interface CreateProjectPayload {
  filename: string;
  contentType: string;
  sizeBytes: number;
  durationSeconds?: number | null;
  width?: number | null;
  height?: number | null;
}

export async function createProject(
  payload: CreateProjectPayload,
): Promise<CreateProjectResponse> {
  const res = await fetch("/api/projects", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    throw new Error("Failed to create project");
  }
  return res.json();
}
