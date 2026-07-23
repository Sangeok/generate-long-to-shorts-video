"use server";

import { revalidatePath } from "next/cache";

import {
  normalizeClipCount,
  normalizeContentType,
  normalizeLanguage,
} from "@/constants/generation-limits";
import { getCurrentSession } from "@/lib/auth-server";

import { deleteUserAccount, upsertUserSettings } from "../server";

interface UpdateGenerationDefaultsInput {
  language: string;
  contentType: string;
  clipCount: number;
  captionStyle: unknown;
}

export async function updateGenerationDefaults(
  input: UpdateGenerationDefaultsInput,
): Promise<void> {
  const session = await getCurrentSession();
  if (!session) {
    throw new Error("Unauthorized");
  }

  await upsertUserSettings(session.user.id, {
    language: normalizeLanguage(input.language),
    contentType: normalizeContentType(input.contentType),
    clipCount: normalizeClipCount(input.clipCount),
    captionStyle: input.captionStyle,
  });

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/settings");
}

export async function deleteAccount(): Promise<void> {
  const session = await getCurrentSession();
  if (!session) {
    throw new Error("Unauthorized");
  }

  await deleteUserAccount(session.user.id);
}
