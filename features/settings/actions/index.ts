"use server";

import { revalidatePath } from "next/cache";

import { normalizeClipCount } from "@/constants/generation-limits";
import { getCurrentSession } from "@/lib/auth-server";

import { deleteUserAccount, upsertUserSettings } from "../server";

const LANGUAGES = ["en", "ko"];
const CONTENT_TYPES = ["talk", "cinematic"];

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
    language: LANGUAGES.includes(input.language) ? input.language : "en",
    contentType: CONTENT_TYPES.includes(input.contentType)
      ? input.contentType
      : "talk",
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
