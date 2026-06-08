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
  projectId: string,
  filename: string,
): string {
  return `uploads/${userId}/${projectId}/${sanitizeFilename(filename)}`;
}
