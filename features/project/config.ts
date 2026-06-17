import { DEFAULT_CLIP_COUNT } from "@/constants/generation-limits";

export interface ShortsConfig {
  count: number;
  minDurationSec: number;
  maxDurationSec: number;
  geminiModel: string;
  videoFps: number;
}

export const SHORTS_CONFIG: ShortsConfig = {
  count: DEFAULT_CLIP_COUNT,
  minDurationSec: 30,
  maxDurationSec: 90,
  geminiModel: "gemini-3.1-flash-lite",
  // Frame sampling rate for the cinematic video-analysis path (1 frame / 5s).
  videoFps: 0.2,
};
