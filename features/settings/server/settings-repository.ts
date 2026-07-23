import "server-only";

import {
  DEFAULT_CLIP_COUNT,
  DEFAULT_PROJECT_CONTENT_TYPE,
  DEFAULT_PROJECT_LANGUAGE,
  normalizeClipCount,
} from "@/constants/generation-limits";
import type { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/db";

import type { GenerationDefaults } from "../types";

// 설정 행이 없는 사용자에게 적용되는 기본 생성 설정의 단일 소스.
export const DEFAULT_GENERATION_SETTINGS: GenerationDefaults = {
  language: DEFAULT_PROJECT_LANGUAGE,
  contentType: DEFAULT_PROJECT_CONTENT_TYPE,
  clipCount: DEFAULT_CLIP_COUNT,
  captionStyle: null,
};

// 행이 없으면 기본값을 반환한다(읽기 시 DB 쓰기 없음).
export async function getUserSettings(
  userId: string,
): Promise<GenerationDefaults> {
  const row = await prisma.userSettings.findUnique({ where: { userId } });
  return {
    language: row?.language ?? DEFAULT_GENERATION_SETTINGS.language,
    contentType: row?.contentType ?? DEFAULT_GENERATION_SETTINGS.contentType,
    clipCount: normalizeClipCount(
      row?.clipCount ?? DEFAULT_GENERATION_SETTINGS.clipCount,
    ),
    captionStyle: row?.captionStyle ?? null,
  };
}

interface UpsertUserSettingsInput {
  language: string;
  contentType: string;
  clipCount: number;
  captionStyle: unknown;
}

const MAX_CAPTION_STYLE_JSON_CHARS = 2_000;

// captionStyle은 불투명 JSON으로 저장한다(읽기 시 project가 정규화).
// 객체가 아니거나 과대한 값은 기존 값을 보존하도록 저장을 생략한다.
function sanitizeCaptionStyle(
  value: unknown,
): Prisma.InputJsonValue | undefined {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return undefined;
  }
  try {
    if (JSON.stringify(value).length > MAX_CAPTION_STYLE_JSON_CHARS) {
      return undefined;
    }
  } catch {
    return undefined;
  }
  return value as Prisma.InputJsonValue;
}

export async function upsertUserSettings(
  userId: string,
  input: UpsertUserSettingsInput,
): Promise<void> {
  const captionStyle = sanitizeCaptionStyle(input.captionStyle);
  const clipCount = normalizeClipCount(input.clipCount);
  await prisma.userSettings.upsert({
    where: { userId },
    create: {
      userId,
      language: input.language,
      contentType: input.contentType,
      clipCount,
      captionStyle,
    },
    update: {
      language: input.language,
      contentType: input.contentType,
      clipCount,
      captionStyle,
    },
  });
}
