"use client";

import {
  AlertTriangle,
  CalendarClock,
  Captions,
  Download,
  Loader2,
  Play,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import { getShortExportStatus, requestShortExport } from "../../actions";
import { getClipUrl } from "../../api/get-clip-url";
import { formatTimecode } from "../../format";
import type { ShortRecord } from "../../types";
import { ClipPlayer } from "../captions/clip-player";

interface ShortCardProps {
  projectId: string;
  short: ShortRecord;
  rank: number;
}

// Deterministic waveform heights — a cinematic motif, not real audio data.
const WAVEFORM = Array.from({ length: 38 }, (_, index) =>
  Math.round(28 + Math.abs(Math.sin(index * 1.7) * 72)),
);

const EXPORT_POLL_INTERVAL_MS = 3000;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function triggerDownload(url: string): void {
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.rel = "noopener";
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
}

export const ShortCard = ({ projectId, short, rank }: ShortCardProps) => {
  const [clipUrl, setClipUrl] = useState<string | null>(null);
  const [isLoadingPlay, setIsLoadingPlay] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  const isTopPick = rank === 1;
  const isReady = short.renderStatus.status === "ready";
  const isFailed = short.renderStatus.status === "failed";

  const handlePlay = async () => {
    if (!isReady || clipUrl || isLoadingPlay) return;
    setIsLoadingPlay(true);
    try {
      setClipUrl(await getClipUrl(projectId, short.id));
    } catch {
      toast.error("Couldn't load the clip. Please try again.");
    } finally {
      setIsLoadingPlay(false);
    }
  };

  // Captions are burned in on demand: request an export, poll until the
  // burned file is ready, then download it.
  const handleDownload = async () => {
    if (!isReady || isDownloading) return;
    setIsDownloading(true);
    try {
      let result = await requestShortExport(short.id);
      while (result.status === "processing") {
        await sleep(EXPORT_POLL_INTERVAL_MS);
        result = await getShortExportStatus(short.id);
      }
      if (result.status === "ready") {
        triggerDownload(result.url);
      } else {
        toast.error("Export failed. Please try again.");
      }
    } catch {
      toast.error("Download failed. Please try again.");
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <article className="flex flex-col overflow-hidden rounded-2xl border border-border bg-card">
      <div className="relative aspect-[9/16] overflow-hidden bg-background">
        {clipUrl ? (
          <div className="absolute inset-0">
            <ClipPlayer
              src={clipUrl}
              segments={short.segments}
              style={short.captionStyle}
              autoPlay
            />
          </div>
        ) : (
          <button
            type="button"
            onClick={handlePlay}
            disabled={!isReady}
            aria-label={isReady ? `Play ${short.title}` : short.title}
            className="group/poster absolute inset-0 block text-left disabled:cursor-default"
          >
            <span
              aria-hidden
              className="absolute inset-0 bg-[radial-gradient(120%_90%_at_50%_-10%,_oklch(0.24_0.01_285_/_0.7)_0%,_transparent_55%)]"
            />

            <span className="absolute left-4 top-4 z-10 flex items-center">
              <span
                className={cn(
                  "rounded-full px-2.5 py-1 font-mono text-[0.625rem] uppercase tracking-[0.18em]",
                  isTopPick
                    ? "bg-primary text-primary-foreground"
                    : "border border-border text-muted-foreground",
                )}
              >
                #{rank}
              </span>
            </span>
            <span className="absolute right-4 top-4 z-10 font-mono text-[0.625rem] uppercase tracking-[0.2em] text-muted-foreground">
              9:16
            </span>

            <span className="absolute inset-0 z-10 grid place-items-center">
              {isFailed ? (
                <span className="grid size-16 place-items-center rounded-full border border-destructive/40 bg-destructive/10 text-destructive">
                  <AlertTriangle className="size-6" />
                </span>
              ) : isReady ? (
                <span className="grid size-16 place-items-center rounded-full border border-border bg-background/55 text-foreground backdrop-blur-sm transition-colors duration-200 group-hover/poster:border-transparent group-hover/poster:bg-primary group-hover/poster:text-primary-foreground">
                  {isLoadingPlay ? (
                    <Loader2 className="size-6 animate-spin" />
                  ) : (
                    <Play className="size-6 translate-x-0.5 fill-current" />
                  )}
                </span>
              ) : (
                <span className="flex flex-col items-center gap-2 text-muted-foreground">
                  <Loader2 className="size-6 animate-spin" />
                  <span className="font-mono text-[0.625rem] uppercase tracking-[0.18em]">
                    Rendering
                  </span>
                </span>
              )}
            </span>

            <span className="absolute inset-x-4 bottom-4 z-10 flex flex-col gap-2">
              <span className="flex h-8 items-end gap-[3px]" aria-hidden>
                {WAVEFORM.map((height, index) => (
                  <span
                    key={index}
                    className="w-full flex-1 rounded-full bg-foreground/15"
                    style={{ height: `${height}%` }}
                  />
                ))}
              </span>
              <span className="flex items-center justify-between font-mono text-[0.625rem] uppercase tracking-[0.16em] text-muted-foreground">
                <span className="text-primary">
                  {formatTimecode(short.startSec)} —{" "}
                  {formatTimecode(short.endSec)}
                </span>
                <span>{Math.round(short.durationSec)}s</span>
              </span>
            </span>
          </button>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-4 p-5">
        <h3 className="line-clamp-2 font-display text-lg font-semibold leading-snug tracking-tight text-foreground">
          {short.title}
        </h3>

        <div className="flex flex-col gap-1.5">
          <div className="flex items-baseline justify-between">
            <span className="eyebrow">Signal</span>
            <span className="font-mono text-xs tabular-nums text-foreground">
              {short.seoScore}
              <span className="text-muted-foreground">/100</span>
            </span>
          </div>
          <span className="h-1 overflow-hidden rounded-full bg-secondary">
            <span
              className={cn(
                "block h-full rounded-full",
                isTopPick ? "bg-primary" : "bg-foreground/35",
              )}
              style={{ width: `${short.seoScore}%` }}
            />
          </span>
        </div>

        <p className="line-clamp-3 text-sm leading-relaxed text-muted-foreground">
          {isFailed
            ? "This clip failed to render. Other clips are unaffected."
            : short.reason}
        </p>

        <div className="mt-auto flex items-center gap-2 pt-1">
          <Button
            variant="outline"
            size="sm"
            onClick={handleDownload}
            disabled={!isReady || isDownloading}
          >
            {isDownloading ? <Loader2 className="animate-spin" /> : <Download />}
            {isDownloading ? "Exporting" : "Download"}
          </Button>
          {/* <a> never matches :disabled, so render a Link only once ready. */}
          <Button
            variant="ghost"
            size="sm"
            disabled={!isReady}
            nativeButton={!isReady}
            render={
              isReady ? (
                <Link
                  href={`/dashboard/projects/${projectId}/shorts/${short.id}/captions`}
                />
              ) : undefined
            }
          >
            <Captions />
            Captions
          </Button>
          <Button
            variant="ghost"
            size="sm"
            disabled={!isReady}
            onClick={() => toast("Scheduling is coming soon.")}
          >
            <CalendarClock />
            Schedule
          </Button>
        </div>
      </div>
    </article>
  );
};
