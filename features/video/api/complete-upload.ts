export async function completeUpload(videoId: string): Promise<void> {
  const res = await fetch(`/api/videos/${videoId}/complete`, {
    method: "POST",
  });
  if (!res.ok) {
    throw new Error("Failed to finalize upload");
  }
}
