import type { VideoDTO } from "../types";

export async function getVideo(videoId: string): Promise<VideoDTO> {
  const res = await fetch(`/api/videos/${videoId}`);
  if (!res.ok) {
    throw new Error("Failed to load video");
  }
  return res.json();
}
