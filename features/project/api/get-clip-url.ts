interface ClipUrlResponse {
  url: string;
}

export async function getClipUrl(
  projectId: string,
  shortId: string,
): Promise<string> {
  const res = await fetch(`/api/projects/${projectId}/shorts/${shortId}/clip-url`, {
    cache: "no-store",
  });
  if (!res.ok) {
    throw new Error("Failed to load clip URL");
  }
  const data = (await res.json()) as ClipUrlResponse;
  return data.url;
}
