// MM:SS 타임코드. 비유한/누락 값은 fallback을 반환한다.
export function formatTimecode(
  seconds: number | null | undefined,
  options?: { fallback?: string },
): string {
  if (seconds === null || seconds === undefined || !Number.isFinite(seconds)) {
    return options?.fallback ?? "--:--";
  }
  const total = Math.floor(seconds);
  const minutes = Math.floor(total / 60);
  const remaining = total % 60;
  return `${String(minutes).padStart(2, "0")}:${String(remaining).padStart(2, "0")}`;
}
