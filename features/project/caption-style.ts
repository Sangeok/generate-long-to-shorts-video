import type { CSSProperties } from "react";

import type {
  CaptionAnimation,
  CaptionEdge,
  CaptionFont,
  CaptionPosition,
  CaptionSize,
  CaptionStyle,
} from "./types";

// Shared by the browser caption overlay and the FFmpeg burn-in pass: one
// CaptionStyle object derives both the preview CSS and the libass force_style
// string, so the two render paths cannot drift apart.

// Fonts must exist both as a browser font and on the machine running ffmpeg.
export const CAPTION_FONTS: Record<
  CaptionFont,
  { label: string; css: string; ass: string }
> = {
  "malgun-gothic": {
    label: "Malgun Gothic",
    css: '"Malgun Gothic", sans-serif',
    ass: "Malgun Gothic",
  },
  arial: { label: "Arial", css: "Arial, sans-serif", ass: "Arial" },
  impact: { label: "Impact", css: "Impact, sans-serif", ass: "Impact" },
  verdana: { label: "Verdana", css: "Verdana, sans-serif", ass: "Verdana" },
};

// Preview sizes are in cqw on a 9:16 container. VTT cues are converted to ASS
// with PlayResY=288, so 1cqw of width = (9/16) * 288 / 100 PlayRes units.
const ASS_PLAY_RES_Y = 288;
const CONTAINER_ASPECT = 9 / 16;

export const CAPTION_SIZES: Record<CaptionSize, { label: string; cqw: number }> =
  {
    sm: { label: "S", cqw: 6.5 },
    md: { label: "M", cqw: 8 },
    lg: { label: "L", cqw: 10 },
  };

const CAPTION_POSITIONS: Record<
  CaptionPosition,
  { alignment: number; marginV: number }
> = {
  top: { alignment: 8, marginV: 28 },
  middle: { alignment: 5, marginV: 0 },
  bottom: { alignment: 2, marginV: 28 },
};

export const DEFAULT_CAPTION_STYLE: CaptionStyle = {
  font: "malgun-gothic",
  size: "md",
  position: "bottom",
  edge: "outline",
  textColor: "#ffffff",
  edgeColor: "#000000",
  uppercase: false,
  animation: "none",
};

// One duration drives both the CSS keyframe and the libass override so the
// preview and the burn-in start and finish together.
export const CAPTION_ANIM_MS = 180;

const CAPTION_ANIMATIONS = [
  "none",
  "fade",
  "pop",
  "bounce",
  "blur",
  "zoom",
] as const satisfies readonly CaptionAnimation[];

const HEX_COLOR_PATTERN = /^#[0-9a-f]{6}$/;

function isOneOf<T extends string>(
  value: unknown,
  allowed: readonly T[],
): value is T {
  return typeof value === "string" && allowed.includes(value as T);
}

function parseColor(value: unknown, fallback: string): string {
  return typeof value === "string" && HEX_COLOR_PATTERN.test(value)
    ? value
    : fallback;
}

// Normalizes untrusted JSON (DB column, action input) into a valid style.
// Field-level validation also keeps user input out of the ffmpeg filter graph.
export function parseCaptionStyle(value: unknown): CaptionStyle {
  const raw = (
    typeof value === "object" && value !== null ? value : {}
  ) as Partial<Record<keyof CaptionStyle, unknown>>;
  const fallback = DEFAULT_CAPTION_STYLE;
  return {
    font: isOneOf(raw.font, Object.keys(CAPTION_FONTS) as CaptionFont[])
      ? raw.font
      : fallback.font,
    size: isOneOf(raw.size, Object.keys(CAPTION_SIZES) as CaptionSize[])
      ? raw.size
      : fallback.size,
    position: isOneOf(
      raw.position,
      Object.keys(CAPTION_POSITIONS) as CaptionPosition[],
    )
      ? raw.position
      : fallback.position,
    edge: isOneOf(
      raw.edge,
      ["outline", "box"] as const satisfies readonly CaptionEdge[],
    )
      ? raw.edge
      : fallback.edge,
    textColor: parseColor(raw.textColor, fallback.textColor),
    edgeColor: parseColor(raw.edgeColor, fallback.edgeColor),
    uppercase:
      typeof raw.uppercase === "boolean" ? raw.uppercase : fallback.uppercase,
    animation: isOneOf(raw.animation, CAPTION_ANIMATIONS)
      ? raw.animation
      : fallback.animation,
  };
}

export function isSameCaptionStyle(a: CaptionStyle, b: CaptionStyle): boolean {
  return (Object.keys(DEFAULT_CAPTION_STYLE) as (keyof CaptionStyle)[]).every(
    (key) => a[key] === b[key],
  );
}

function toAssFontSize(cqw: number): number {
  return Math.round((cqw * CONTAINER_ASPECT * ASS_PLAY_RES_Y) / 100);
}

// ASS colours are &HAABBGGRR with AA=00 meaning opaque.
function toAssColor(hex: string): string {
  const r = hex.slice(1, 3);
  const g = hex.slice(3, 5);
  const b = hex.slice(5, 7);
  return `&H00${b}${g}${r}`.toUpperCase();
}

// Left/right margin matches the preview's inset-x-[5%]: 5% of PlayResX 384 ≈ 19.
// The old VTT path left this at the ffmpeg default (10), wrapping slightly wider
// than the preview; 19 aligns the two render paths.
const ASS_MARGIN_LR = 19;

// Canonical V4+ style block for the self-generated .ass. The Format line is
// spelled out in full so libass version differences in omitted-field defaults
// cannot drift the burn-in. The Default style derives from the same helpers and
// values as the preview overlay (single source). BackColour mirrors
// OutlineColour so BorderStyle=3 boxes render the same colour regardless of
// which field the renderer uses for the box fill.
export function buildAssStyle(style: CaptionStyle): string {
  const position = CAPTION_POSITIONS[style.position];
  const primary = toAssColor(style.textColor);
  const outline = toAssColor(style.edgeColor);
  const values = [
    "Default",
    CAPTION_FONTS[style.font].ass,
    toAssFontSize(CAPTION_SIZES[style.size].cqw),
    primary,
    primary, // SecondaryColour (unused) mirrors PrimaryColour
    outline,
    outline, // BackColour
    -1, // Bold (ASS true)
    0, // Italic
    0, // Underline
    0, // StrikeOut
    100, // ScaleX
    100, // ScaleY
    0, // Spacing
    0, // Angle
    style.edge === "box" ? 3 : 1, // BorderStyle
    2, // Outline
    0, // Shadow
    position.alignment,
    ASS_MARGIN_LR, // MarginL
    ASS_MARGIN_LR, // MarginR
    position.marginV,
    1, // Encoding (default charset)
  ];
  return [
    "Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding",
    `Style: ${values.join(",")}`,
  ].join("\n");
}

// Preview-side animation: a CSS keyframe (defined in app/globals.css) on the cue
// wrapper. Mirrors buildCaptionAnimationTag so the preview matches the burn-in.
export function buildCaptionAnimationCss(
  animation: CaptionAnimation,
): CSSProperties {
  switch (animation) {
    case "fade":
      return { animation: `caption-fade ${CAPTION_ANIM_MS}ms ease-out` };
    case "pop":
      return { animation: `caption-pop ${CAPTION_ANIM_MS}ms ease-out` };
    case "bounce":
      return { animation: `caption-bounce ${CAPTION_ANIM_MS}ms ease-out` };
    case "blur":
      return { animation: `caption-blur ${CAPTION_ANIM_MS}ms ease-out` };
    case "zoom":
      return { animation: `caption-zoom ${CAPTION_ANIM_MS}ms ease-out` };
    case "none":
      return {};
  }
}

// Burn-in-side animation: a libass override tag prepended to each cue. pop keeps
// \fad so its opacity transition matches the CSS keyframe (opacity 0→1 + scale
// 0.6→1), not just the scale.
export function buildCaptionAnimationTag(animation: CaptionAnimation): string {
  switch (animation) {
    case "fade":
      return `\\fad(${CAPTION_ANIM_MS},0)`;
    case "pop":
      return `\\fad(${CAPTION_ANIM_MS},0)\\fscx60\\fscy60\\t(0,${CAPTION_ANIM_MS},\\fscx100\\fscy100)`;
    case "bounce": {
      // Overshoot to 110% at 60% of the duration, then settle to 100%.
      const peak = Math.round(CAPTION_ANIM_MS * 0.6);
      return `\\fad(${CAPTION_ANIM_MS},0)\\fscx60\\fscy60\\t(0,${peak},\\fscx110\\fscy110)\\t(${peak},${CAPTION_ANIM_MS},\\fscx100\\fscy100)`;
    }
    case "blur":
      return `\\fad(${CAPTION_ANIM_MS},0)\\blur2\\t(0,${CAPTION_ANIM_MS},\\blur0)`;
    case "zoom":
      return `\\fad(${CAPTION_ANIM_MS},0)\\fscx115\\fscy115\\t(0,${CAPTION_ANIM_MS},\\fscx100\\fscy100)`;
    case "none":
      return "";
  }
}

// Mirrors the libass outline (Outline=2 at PlayResY=288 ≈ 0.08em at Fontsize 13).
export function buildOutlineTextShadow(color: string): string {
  const offsets = [
    "-0.08em -0.08em",
    "0.08em -0.08em",
    "-0.08em 0.08em",
    "0.08em 0.08em",
    "0 0.08em",
    "0 -0.08em",
    "0.08em 0",
    "-0.08em 0",
  ];
  return offsets.map((offset) => `${offset} 0 ${color}`).join(", ");
}
