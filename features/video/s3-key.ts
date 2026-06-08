const PENDING_UPLOAD_PREFIX = "incoming";

export function sanitizeFilename(name: string): string {
  const cleaned = name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9.-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-+(\.[a-z0-9]+)$/, "$1"); // drop hyphens right before the extension
  return cleaned || "video";
}

export function buildS3Key(
  userId: string,
  videoId: string,
  filename: string,
): string {
  return `uploads/${userId}/${videoId}/${sanitizeFilename(filename)}`;
}

export function buildPendingS3Key(finalKey: string): string {
  return `${PENDING_UPLOAD_PREFIX}/${finalKey}`;
}
