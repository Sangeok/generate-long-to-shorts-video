import type { ShortRecord } from "../types";

interface ShortsResponse {
  shorts: ShortRecord[];
}

export async function getShorts(projectId: string): Promise<ShortRecord[]> {
  const res = await fetch(`/api/projects/${projectId}/shorts`, {
    cache: "no-store",
  });
  if (!res.ok) {
    throw new Error("Failed to load shorts");
  }
  const data = (await res.json()) as ShortsResponse;
  return data.shorts;
}
