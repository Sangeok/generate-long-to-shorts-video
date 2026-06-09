import type { CaptionSegment } from "../types";

interface DeepgramUtterance {
  start: number;
  end: number;
  transcript: string;
}

function formatTimestamp(totalSeconds: number): string {
  const clamped = Math.max(0, totalSeconds);
  const hours = Math.floor(clamped / 3600);
  const minutes = Math.floor((clamped % 3600) / 60);
  const seconds = Math.floor(clamped % 60);
  const millis = Math.round((clamped - Math.floor(clamped)) * 1000);
  const pad = (value: number, size = 2) => String(value).padStart(size, "0");
  return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}.${pad(millis, 3)}`;
}

export function buildSegments(
  utterances: DeepgramUtterance[],
): CaptionSegment[] {
  return utterances
    .filter((utterance) => utterance.transcript.trim().length > 0)
    .map((utterance) => ({
      start: utterance.start,
      end: utterance.end,
      text: utterance.transcript.trim(),
    }));
}

export function buildVtt(segments: CaptionSegment[]): string {
  const cues = segments.map((segment, index) => {
    const range = `${formatTimestamp(segment.start)} --> ${formatTimestamp(segment.end)}`;
    return `${index + 1}\n${range}\n${segment.text}`;
  });
  return `WEBVTT\n\n${cues.join("\n\n")}\n`;
}
