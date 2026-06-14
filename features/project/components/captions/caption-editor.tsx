"use client";

import { Loader2 } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

import { updateShortCaptions } from "../../actions";
import { getClipUrl } from "../../api/get-clip-url";
import { isSameCaptionStyle } from "../../caption-style";
import type { CaptionSegment, CaptionStyle } from "../../types";
import { CaptionStyleControls } from "./caption-style-controls";
import { ClipPlayer } from "./clip-player";

interface CaptionEditorProps {
  projectId: string;
  shortId: string;
  segments: CaptionSegment[];
  captionStyle: CaptionStyle;
}

function formatTimecode(totalSeconds: number): string {
  const total = Math.floor(totalSeconds);
  const minutes = Math.floor(total / 60);
  const seconds = total % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

export const CaptionEditor = ({
  projectId,
  shortId,
  segments,
  captionStyle,
}: CaptionEditorProps) => {
  const [texts, setTexts] = useState(() =>
    segments.map((segment) => segment.text),
  );
  const [savedTexts, setSavedTexts] = useState(texts);
  const [style, setStyle] = useState(captionStyle);
  const [savedStyle, setSavedStyle] = useState(captionStyle);
  const [saving, setSaving] = useState(false);
  const [clipUrl, setClipUrl] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState(0);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    let cancelled = false;
    getClipUrl(projectId, shortId)
      .then((url) => {
        if (!cancelled) setClipUrl(url);
      })
      .catch(() => {
        if (!cancelled) {
          toast.error("Couldn't load the clip preview.");
        }
      });
    return () => {
      cancelled = true;
    };
  }, [projectId, shortId]);

  // The preview always reflects the edited text, not what is saved.
  const previewSegments = useMemo(
    () =>
      segments.map((segment, index) => ({ ...segment, text: texts[index] })),
    [segments, texts],
  );

  const activeIndex = segments.findIndex(
    (segment) => currentTime >= segment.start && currentTime < segment.end,
  );
  const dirty =
    texts.some((text, index) => text !== savedTexts[index]) ||
    !isSameCaptionStyle(style, savedStyle);

  const handleTextChange = (index: number, value: string) => {
    setTexts((prev) => prev.map((text, i) => (i === index ? value : text)));
  };

  const handleSeek = (segment: CaptionSegment) => {
    const video = videoRef.current;
    if (!video) return;
    video.currentTime = segment.start;
    video.play().catch(() => {});
  };

  const handleSave = async () => {
    if (!dirty || saving) return;
    setSaving(true);
    try {
      await updateShortCaptions(shortId, texts, style);
      setSavedTexts(texts);
      setSavedStyle(style);
      toast.success("Captions saved.");
    } catch {
      toast.error("Couldn't save captions. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,22rem)_1fr]">
      <div className="relative aspect-[9/16] w-full max-w-[22rem] self-start overflow-hidden rounded-2xl border border-border bg-background">
        {clipUrl ? (
          <ClipPlayer
            src={clipUrl}
            segments={previewSegments}
            style={style}
            videoRef={videoRef}
            onTimeChange={setCurrentTime}
          />
        ) : (
          <div className="grid size-full place-items-center text-muted-foreground">
            <Loader2 className="size-6 animate-spin" />
          </div>
        )}
      </div>

      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between gap-3">
          <p className="eyebrow">Captions</p>
          <Button onClick={handleSave} disabled={!dirty || saving} size="sm">
            {saving && <Loader2 className="animate-spin" />}
            {dirty ? "Save changes" : "Saved"}
          </Button>
        </div>

        <CaptionStyleControls style={style} onChange={setStyle} />

        <ul className="flex flex-col gap-2">
          {segments.map((segment, index) => (
            <li
              key={index}
              className={cn(
                "flex flex-col gap-2 rounded-xl border border-border bg-card p-3 transition-colors",
                index === activeIndex && "border-primary/60",
              )}
            >
              <button
                type="button"
                onClick={() => handleSeek(segment)}
                className="self-start font-mono text-[0.625rem] uppercase tracking-[0.16em] text-muted-foreground transition-colors hover:text-primary"
              >
                {formatTimecode(segment.start)} — {formatTimecode(segment.end)}
              </button>
              <Textarea
                value={texts[index]}
                onChange={(event) => handleTextChange(index, event.target.value)}
                rows={2}
                className="min-h-0 resize-none"
              />
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};
