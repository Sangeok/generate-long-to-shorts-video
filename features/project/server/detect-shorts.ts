import "server-only";

import { Type } from "@google/genai";

import { getGeminiClient } from "@/lib/gemini";

import { SHORTS_CONFIG, type ShortsConfig } from "../config";
import type {
  CaptionSegment,
  ProjectLanguage,
  ShortClip,
  ShortMoment,
} from "../types";
import { buildVtt, sliceSegments } from "./captions";

// Instruct Gemini to write title/reason in the source video's language.
export function languageInstruction(language: ProjectLanguage): string {
  return language === "ko"
    ? "Write the title and reason in Korean."
    : "Write the title and reason in English.";
}

export const momentsSchema = {
  type: Type.ARRAY,
  items: {
    type: Type.OBJECT,
    properties: {
      title: {
        type: Type.STRING,
        description: "Punchy title for the short clip.",
      },
      startSec: {
        type: Type.NUMBER,
        description: "Clip start time in seconds from the source video.",
      },
      endSec: {
        type: Type.NUMBER,
        description: "Clip end time in seconds from the source video.",
      },
      reason: {
        type: Type.STRING,
        description: "Why this moment makes an engaging short video.",
      },
      seoScore: {
        type: Type.INTEGER,
        description: "Predicted SEO/virality ranking from 0 to 100.",
      },
    },
    propertyOrdering: ["title", "startSec", "endSec", "reason", "seoScore"],
  },
};

function buildPrompt(
  transcriptText: string,
  segments: CaptionSegment[],
  language: ProjectLanguage,
  config: ShortsConfig,
): string {
  const timeline = segments
    .map(
      (segment) =>
        `[${segment.start.toFixed(1)}-${segment.end.toFixed(1)}] ${segment.text}`,
    )
    .join("\n");

  return [
    "You are an expert short-form video editor.",
    "From the long-form video transcript below, find the most engaging,",
    `self-contained moments to cut into vertical short videos.`,
    "",
    `Requirements:`,
    `- Return exactly ${config.count} moments (or as many as the content allows).`,
    `- Each clip must be between ${config.minDurationSec} and ${config.maxDurationSec} seconds long.`,
    `- startSec and endSec must fall within the timeline below and not overlap each other.`,
    `- Prefer moments with a strong hook, payoff, emotion, or standalone insight.`,
    `- seoScore (0-100) reflects how likely the clip ranks and goes viral.`,
    `- ${languageInstruction(language)}`,
    "",
    "Timeline (seconds) with text:",
    timeline,
    "",
    "Full transcript:",
    transcriptText,
  ].join("\n");
}

export function clampMoments(
  moments: ShortMoment[],
  config: ShortsConfig,
): ShortMoment[] {
  const sorted = [...moments].sort((a, b) => a.startSec - b.startSec);
  const accepted: ShortMoment[] = [];

  for (const moment of sorted) {
    const start = Math.max(0, moment.startSec);
    const end = moment.endSec;
    const duration = end - start;

    const withinBounds =
      duration >= config.minDurationSec && duration <= config.maxDurationSec;
    const overlapsPrevious =
      accepted.length > 0 && start < accepted[accepted.length - 1].endSec;

    if (!withinBounds || overlapsPrevious) continue;

    accepted.push({
      title: moment.title.trim(),
      startSec: start,
      endSec: end,
      reason: moment.reason.trim(),
      seoScore: Math.max(0, Math.min(100, Math.round(moment.seoScore))),
    });
  }

  return accepted
    .sort((a, b) => b.seoScore - a.seoScore)
    .slice(0, config.count);
}

export function toShortClips(
  moments: ShortMoment[],
  segments: CaptionSegment[],
): ShortClip[] {
  return moments.map((moment) => {
    const segmentsForClip = sliceSegments(
      segments,
      moment.startSec,
      moment.endSec,
    );
    return {
      ...moment,
      durationSec: moment.endSec - moment.startSec,
      captionsVtt: buildVtt(segmentsForClip),
      segments: segmentsForClip,
    };
  });
}

export async function detectShorts(
  transcriptText: string,
  segments: CaptionSegment[],
  language: ProjectLanguage,
  config: ShortsConfig = SHORTS_CONFIG,
): Promise<ShortClip[]> {
  const response = await getGeminiClient().models.generateContent({
    model: config.geminiModel,
    contents: buildPrompt(transcriptText, segments, language, config),
    config: {
      responseMimeType: "application/json",
      responseSchema: momentsSchema,
    },
  });

  const raw = response.text;
  if (!raw) {
    throw new Error("Gemini returned an empty shorts response");
  }

  const moments = clampMoments(JSON.parse(raw) as ShortMoment[], config);
  return toShortClips(moments, segments);
}
