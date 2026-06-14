"use client";

import { useMemo, useState } from "react";
import type { CSSProperties, Ref } from "react";

import { cn } from "@/lib/utils";

import {
  buildCaptionAnimationCss,
  buildOutlineTextShadow,
  CAPTION_FONTS,
  CAPTION_SIZES,
  DEFAULT_CAPTION_STYLE,
} from "../../caption-style";
import { splitSegmentsForCaptions } from "../../captions";
import type { CaptionSegment, CaptionStyle } from "../../types";

interface ClipPlayerProps {
  src: string;
  segments: CaptionSegment[];
  style?: CaptionStyle;
  autoPlay?: boolean;
  className?: string;
  videoRef?: Ref<HTMLVideoElement>;
  onTimeChange?: (time: number) => void;
}

// Mirrors the libass burn-in placement so the preview approximates the
// exported clip. Raw colors are intentional here — they imitate video
// content, not UI chrome.
const POSITION_CLASS: Record<CaptionStyle["position"], string> = {
  top: "top-[12%]",
  middle: "top-1/2 -translate-y-1/2",
  bottom: "bottom-[12%]",
};

function buildEdgeCss(style: CaptionStyle): CSSProperties {
  if (style.edge === "box") {
    // box-decoration-break makes the box hug each wrapped line like libass.
    return {
      backgroundColor: style.edgeColor,
      padding: "0.08em 0.32em",
      boxDecorationBreak: "clone",
      WebkitBoxDecorationBreak: "clone",
    };
  }
  return { textShadow: buildOutlineTextShadow(style.edgeColor) };
}

export const ClipPlayer = ({
  src,
  segments,
  style = DEFAULT_CAPTION_STYLE,
  autoPlay = false,
  className,
  videoRef,
  onTimeChange,
}: ClipPlayerProps) => {
  const [currentTime, setCurrentTime] = useState(0);

  const cues = useMemo(() => splitSegmentsForCaptions(segments), [segments]);
  const activeCue = cues.find(
    (cue) => currentTime >= cue.start && currentTime < cue.end,
  );

  return (
    <div
      className={cn("relative size-full", className)}
      style={{ containerType: "inline-size" }}
    >
      <video
        ref={videoRef}
        src={src}
        controls
        controlsList="nodownload"
        autoPlay={autoPlay}
        playsInline
        className="size-full bg-black object-cover"
        onTimeUpdate={(event) => {
          const time = event.currentTarget.currentTime;
          setCurrentTime(time);
          onTimeChange?.(time);
        }}
      />
      {activeCue && (
        <p
          aria-hidden
          className={cn(
            "pointer-events-none absolute inset-x-[5%] text-center font-bold leading-[1.25]",
            POSITION_CLASS[style.position],
            style.uppercase && "uppercase",
          )}
          style={{
            fontSize: `${CAPTION_SIZES[style.size].cqw}cqw`,
            fontFamily: CAPTION_FONTS[style.font].css,
            color: style.textColor,
          }}
        >
          <span
            key={activeCue.start}
            className="inline-block text-center"
            style={buildCaptionAnimationCss(style.animation)}
          >
            <span style={buildEdgeCss(style)}>{activeCue.text}</span>
          </span>
        </p>
      )}
    </div>
  );
};
