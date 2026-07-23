export const MIN_CLIP_COUNT = 1;
export const MAX_CLIP_COUNT = 5;
export const DEFAULT_CLIP_COUNT = 5;
export const CLIP_COUNT_OPTIONS = [1, 2, 3, 4, 5] as const;

// 언어/콘텐츠 타입의 단일 소스(값 + 라벨). features/project의
// ProjectLanguage/ProjectContentType 유니온이 이 목록에서 파생된다.
export const PROJECT_LANGUAGES = [
  { value: "en", label: "English" },
  { value: "ko", label: "한국어" },
] as const;

export const PROJECT_CONTENT_TYPES = [
  { value: "talk", label: "Talk" },
  { value: "cinematic", label: "Cinematic" },
] as const;

export const DEFAULT_PROJECT_LANGUAGE: (typeof PROJECT_LANGUAGES)[number]["value"] =
  "en";
export const DEFAULT_PROJECT_CONTENT_TYPE: (typeof PROJECT_CONTENT_TYPES)[number]["value"] =
  "talk";

export function normalizeLanguage(
  value: unknown,
): (typeof PROJECT_LANGUAGES)[number]["value"] {
  const match = PROJECT_LANGUAGES.find((option) => option.value === value);
  return match ? match.value : DEFAULT_PROJECT_LANGUAGE;
}

export function normalizeContentType(
  value: unknown,
): (typeof PROJECT_CONTENT_TYPES)[number]["value"] {
  const match = PROJECT_CONTENT_TYPES.find((option) => option.value === value);
  return match ? match.value : DEFAULT_PROJECT_CONTENT_TYPE;
}

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
