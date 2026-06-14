export const SHORTS_CONFIG = {
  count: 5,
  minDurationSec: 30,
  maxDurationSec: 90,
  geminiModel: "gemini-3.1-flash-lite",
  // Frame sampling rate for the cinematic video-analysis path (1 frame / 5s).
  videoFps: 0.2,
} as const;
