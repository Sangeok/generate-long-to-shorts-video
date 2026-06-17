export const MIN_CLIP_COUNT = 1;
export const MAX_CLIP_COUNT = 5;
export const DEFAULT_CLIP_COUNT = 5;
export const CLIP_COUNT_OPTIONS = [1, 2, 3, 4, 5] as const;

export function normalizeClipCount(value: unknown): number {
  if (value === null || value === undefined) {
    return DEFAULT_CLIP_COUNT;
  }

  if (typeof value === "string" && value.trim() === "") {
    return DEFAULT_CLIP_COUNT;
  }

  const parsed = Number(value);
  if (!Number.isFinite(parsed)) {
    return DEFAULT_CLIP_COUNT;
  }

  return Math.min(
    MAX_CLIP_COUNT,
    Math.max(MIN_CLIP_COUNT, Math.trunc(parsed)),
  );
}
