export function sanitizeFilename(name: string): string {
  const lower = name.trim().toLowerCase();
  // Split on the last dot to handle extension separately
  const dotIdx = lower.lastIndexOf(".");
  if (dotIdx === -1) {
    const cleaned = lower
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-+|-+$/g, "");
    return cleaned || "video";
  }
  // Strip non-alphanumeric, non-space chars at the boundary right before the dot,
  // then convert remaining non-alnum chars to hyphens
  const base = lower.slice(0, dotIdx).replace(/[^a-z0-9\s]+$/g, ""); // strip trailing special chars
  const ext = lower.slice(dotIdx); // includes the dot
  const cleanBase = base
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+/g, ""); // strip leading hyphens only
  const cleanExt = ext.replace(/[^a-z0-9.]+/g, "");
  const full = cleanBase + cleanExt;
  const result = full.replace(/^-+|-+$/g, "");
  return result || "video";
}

export function buildS3Key(
  userId: string,
  projectId: string,
  filename: string,
): string {
  return `uploads/${userId}/${projectId}/${sanitizeFilename(filename)}`;
}
