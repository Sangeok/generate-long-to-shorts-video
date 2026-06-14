import { buildAssStyle, buildCaptionAnimationTag } from "../caption-style";
import type { CaptionSegment, CaptionStyle } from "../types";

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

export { splitSegmentsForCaptions } from "../captions";

export function buildVtt(segments: CaptionSegment[]): string {
  const cues = segments.map((segment, index) => {
    const range = `${formatTimestamp(segment.start)} --> ${formatTimestamp(segment.end)}`;
    return `${index + 1}\n${range}\n${segment.text}`;
  });
  return `WEBVTT\n\n${cues.join("\n\n")}\n`;
}

// ASS uses H:MM:SS.cc (centiseconds). Centis are carried into seconds so a value
// like 1.999s formats as 0:00:02.00, never 0:00:01.100.
function formatAssTimestamp(totalSeconds: number): string {
  const totalCentis = Math.round(Math.max(0, totalSeconds) * 100);
  const centis = totalCentis % 100;
  const whole = (totalCentis - centis) / 100;
  const hours = Math.floor(whole / 3600);
  const minutes = Math.floor((whole % 3600) / 60);
  const seconds = whole % 60;
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${hours}:${pad(minutes)}:${pad(seconds)}.${pad(centis)}`;
}

// Braces delimit libass override blocks, so cue text must not contain them;
// newlines become hard breaks.
function escapeAssText(text: string): string {
  return text
    .replace(/\r?\n/g, "\\N")
    .replace(/\{/g, "(")
    .replace(/\}/g, ")");
}

// Self-generated .ass for the burn-in: styles are embedded (no force_style) so
// the animation override tag can ride on each cue. The animation prefix is
// omitted entirely when "none" rather than emitting an empty {} block.
export function buildAss(cues: CaptionSegment[], style: CaptionStyle): string {
  const tag = buildCaptionAnimationTag(style.animation);
  const prefix = tag ? `{${tag}}` : "";
  const dialogues = cues.map((cue) => {
    const range = `${formatAssTimestamp(cue.start)},${formatAssTimestamp(cue.end)}`;
    return `Dialogue: 0,${range},Default,,0,0,0,,${prefix}${escapeAssText(cue.text)}`;
  });
  return [
    "[Script Info]",
    "ScriptType: v4.00+",
    "PlayResX: 384",
    "PlayResY: 288",
    "ScaledBorderAndShadow: yes",
    "YCbCr Matrix: None",
    "WrapStyle: 0",
    "",
    "[V4+ Styles]",
    buildAssStyle(style),
    "",
    "[Events]",
    "Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text",
    ...dialogues,
    "",
  ].join("\n");
}
