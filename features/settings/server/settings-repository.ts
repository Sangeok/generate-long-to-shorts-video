import "server-only";

import {
  DEFAULT_CLIP_COUNT,
  normalizeClipCount,
} from "@/constants/generation-limits";
import type { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/db";

import type { GenerationDefaults } from "../types";

const DEFAULT_LANGUAGE = "en";
const DEFAULT_CONTENT_TYPE = "talk";

// 행이 없으면 기본값을 반환한다(읽기 시 DB 쓰기 없음).
export async function getUserSettings(
  userId: string,
): Promise<GenerationDefaults> {
  const row = await prisma.userSettings.findUnique({ where: { userId } });
  return {
    language: row?.language ?? DEFAULT_LANGUAGE,
    contentType: row?.contentType ?? DEFAULT_CONTENT_TYPE,
    clipCount: normalizeClipCount(row?.clipCount ?? DEFAULT_CLIP_COUNT),
    captionStyle: row?.captionStyle ?? null,
  };
}

interface UpsertUserSettingsInput {
  language: string;
  contentType: string;
  clipCount: number;
  captionStyle: unknown;
}

export async function upsertUserSettings(
  userId: string,
  input: UpsertUserSettingsInput,
): Promise<void> {
  const captionStyle = input.captionStyle as Prisma.InputJsonValue;
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
