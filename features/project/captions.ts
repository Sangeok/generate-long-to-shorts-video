import type { CaptionSegment } from "./types";

// Normalizes untrusted JSON (DB column) into valid segments, mirroring
// parseCaptionStyle — invalid entries drop at the boundary instead of
// failing deep in the render pipeline.
export function parseSegments(value: unknown): CaptionSegment[] {
  if (!Array.isArray(value)) return [];
  const segments: CaptionSegment[] = [];
  for (const item of value) {
    if (typeof item !== "object" || item === null) continue;
    const raw = item as Partial<Record<keyof CaptionSegment, unknown>>;
    if (typeof raw.start !== "number" || !Number.isFinite(raw.start)) continue;
    if (typeof raw.end !== "number" || !Number.isFinite(raw.end)) continue;
    if (typeof raw.text !== "string") continue;
    segments.push({ start: raw.start, end: raw.end, text: raw.text });
  }
  return segments;
}

// Project.segments(Json?)는 null이 "전사 전"을 의미하므로 null을 보존한다.
export function parseSegmentsOrNull(value: unknown): CaptionSegment[] | null {
  if (value === null || value === undefined) return null;
  return parseSegments(value);
}

// Shared by the browser caption overlay and the FFmpeg burn-in pass so the
// preview line breaks match the exported clip.

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
