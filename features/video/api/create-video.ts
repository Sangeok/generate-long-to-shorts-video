import type { CreateVideoResponse } from "../types";

export interface CreateVideoPayload {
  filename: string;
  contentType: string;
  sizeBytes: number;
  durationSeconds?: number | null;
  width?: number | null;
  height?: number | null;
}

export async function createVideo(
  payload: CreateVideoPayload,
): Promise<CreateVideoResponse> {
  const res = await fetch("/api/videos", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    throw new Error("Failed to create video");
  }
  return res.json();
}
