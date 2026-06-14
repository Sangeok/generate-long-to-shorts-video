import type { CaptionSegment } from "./types";

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
