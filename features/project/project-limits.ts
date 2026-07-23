import type { VideoMetaRejection } from "./types";

export const MAX_UPLOAD_BYTES = 2 * 1024 * 1024 * 1024; // 2GB
export const MAX_VIDEO_DURATION_SEC = 4 * 60 * 60; // 영화 길이 수용 상한
// render-clips의 BLUR_FILL_FILTER(crop=ih*1.25:ih)가 전제하는 최소 비율.
const MIN_VIDEO_ASPECT_RATIO = 1.25;
export const MAX_ACTIVE_PROJECTS = 2;
export const MAX_DAILY_PROJECTS = 10;
export const DAILY_LIMIT_WINDOW_MS = 24 * 60 * 60 * 1000;

function isFinitePositive(value: number | null): value is number {
  return value !== null && Number.isFinite(value) && value > 0;
}

export function getVideoMetaRejection(
  durationSec: number | null,
  width: number | null,
  height: number | null,
): VideoMetaRejection | null {
  if (
    !isFinitePositive(durationSec) ||
    !isFinitePositive(width) ||
    !isFinitePositive(height)
  ) {
    return "missing-metadata";
  }
  if (durationSec > MAX_VIDEO_DURATION_SEC) {
    return "video-too-long";
  }
  if (width / height < MIN_VIDEO_ASPECT_RATIO) {
    return "portrait-video";
  }
  return null;
}
