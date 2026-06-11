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

export function sliceSegments(
  segments: CaptionSegment[],
  start: number,
  end: number,
): CaptionSegment[] {
  return segments
    .filter((segment) => segment.end > start && segment.start < end)
    .map((segment) => ({
      start: Math.max(0, segment.start - start),
      end: Math.min(end, segment.end) - start,
      text: segment.text,
    }));
}

// Keep burned-in cues at 1-2 lines; utterance-level segments easily run 4+.
const MAX_CUE_CHARS = 40;

function splitSegment(segment: CaptionSegment): CaptionSegment[] {
  const words = segment.text.split(/\s+/).filter(Boolean);
  if (words.length === 0) return [];

  const chunks: string[] = [];
  let current = "";
  for (const word of words) {
    const next = current ? `${current} ${word}` : word;
    if (current && next.length > MAX_CUE_CHARS) {
      chunks.push(current);
      current = word;
    } else {
      current = next;
    }
  }
  if (current) chunks.push(current);
  if (chunks.length === 1) return [segment];

  // Timing is split proportionally to chunk length within the segment.
  const totalChars = chunks.reduce((sum, chunk) => sum + chunk.length, 0);
  const duration = segment.end - segment.start;
  let cursor = segment.start;
  return chunks.map((text, index) => {
    const start = cursor;
    const end =
      index === chunks.length - 1
        ? segment.end
        : cursor + duration * (text.length / totalChars);
    cursor = end;
    return { start, end, text };
  });
}

export function splitSegmentsForCaptions(
  segments: CaptionSegment[],
): CaptionSegment[] {
  return segments.flatMap(splitSegment);
}

export function buildVtt(segments: CaptionSegment[]): string {
  const cues = segments.map((segment, index) => {
    const range = `${formatTimestamp(segment.start)} --> ${formatTimestamp(segment.end)}`;
    return `${index + 1}\n${range}\n${segment.text}`;
  });
  return `WEBVTT\n\n${cues.join("\n\n")}\n`;
}
