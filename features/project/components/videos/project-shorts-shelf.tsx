"use client";

import { AlertTriangle, ArrowRight, Loader2, Play } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

import { cn } from "@/lib/utils";

import { getProjectShorts } from "../../actions";
import type { ShortRecord } from "../../types";

interface ProjectShortsShelfProps {
  projectId: string;
  className?: string;
}

function formatTimecode(totalSeconds: number): string {
  const total = Math.floor(totalSeconds);
  const minutes = Math.floor(total / 60);
  const seconds = total % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

export const ProjectShortsShelf = ({
  projectId,
  className,
}: ProjectShortsShelfProps) => {
  const [shorts, setShorts] = useState<ShortRecord[] | null>(null);
  const [failed, setFailed] = useState(false);

  // The shelf only mounts once its card expands, so load on mount.
  useEffect(() => {
    let cancelled = false;
    getProjectShorts(projectId)
      .then((result) => {
        if (!cancelled) setShorts(result);
      })
      .catch(() => {
        if (!cancelled) setFailed(true);
      });
    return () => {
      cancelled = true;
    };
  }, [projectId]);

  return (
    <div
      className={cn(
        "relative rounded-2xl border border-border bg-card/40 p-4 pl-5",
        className,
      )}
    >
      {/* Amber rail ties the open shelf back to the sidebar's active marker. */}
      <span
        aria-hidden
        className="absolute inset-y-4 left-0 w-0.5 rounded-full bg-primary"
      />

      <div className="mb-3 flex items-center justify-between gap-3">
        <p className="eyebrow">Shorts in this video</p>
        <Link
          href={`/dashboard/projects/${projectId}`}
          className="inline-flex items-center gap-1 font-mono text-[0.625rem] uppercase tracking-[0.2em] text-primary transition-opacity hover:opacity-80"
        >
          Open project
          <ArrowRight className="size-3" />
        </Link>
      </div>

      {failed ? (
        <p className="py-4 text-sm text-muted-foreground">
          Couldn&apos;t load these shorts. Open the project to try again.
        </p>
      ) : shorts === null ? (
        <div className="flex items-center gap-2 py-6 text-muted-foreground">
          <Loader2 className="size-4 animate-spin" />
          <span className="font-mono text-[0.625rem] uppercase tracking-[0.2em]">
            Loading
          </span>
        </div>
      ) : (
        <div className="-mx-1 flex snap-x gap-3 overflow-x-auto px-1 pb-1">
          {shorts.map((short, index) => (
            <ShortThumb
              key={short.id}
              projectId={projectId}
              short={short}
              rank={index + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
};

interface ShortThumbProps {
  projectId: string;
  short: ShortRecord;
  rank: number;
}

const ShortThumb = ({ projectId, short, rank }: ShortThumbProps) => {
  const ready = Boolean(short.clipKey);
  const failed = Boolean(short.renderError);
  const isTopPick = rank === 1;

  return (
    <Link
      href={`/dashboard/projects/${projectId}/shorts/${short.id}/captions`}
      className="group/thumb w-32 shrink-0 snap-start"
    >
      <div className="relative aspect-[9/16] overflow-hidden rounded-lg border border-border bg-background">
        <span
          aria-hidden
          className="absolute inset-0 bg-[radial-gradient(120%_90%_at_50%_-10%,_oklch(0.24_0.01_285_/_0.7)_0%,_transparent_55%)]"
        />

        <span
          className={cn(
            "absolute left-2 top-2 z-10 rounded-full px-1.5 py-0.5 font-mono text-[0.5rem] uppercase tracking-[0.16em]",
            isTopPick
              ? "bg-primary text-primary-foreground"
              : "border border-border text-muted-foreground",
          )}
        >
          #{rank}
        </span>

        <span className="absolute inset-0 z-10 grid place-items-center text-muted-foreground">
          {failed ? (
            <AlertTriangle className="size-5 text-destructive" />
          ) : ready ? (
            <span className="grid size-9 place-items-center rounded-full border border-border bg-background/55 text-foreground backdrop-blur-sm transition-colors duration-200 group-hover/thumb:border-transparent group-hover/thumb:bg-primary group-hover/thumb:text-primary-foreground">
              <Play className="size-4 translate-x-px fill-current" />
            </span>
          ) : (
            <Loader2 className="size-5 animate-spin" />
          )}
        </span>

        <span className="absolute inset-x-2 bottom-2 z-10 font-mono text-[0.5rem] uppercase tracking-[0.14em] text-primary">
          {formatTimecode(short.startSec)}
        </span>
      </div>

      <p className="mt-1.5 line-clamp-2 text-xs leading-snug text-muted-foreground transition-colors group-hover/thumb:text-foreground">
        {short.title}
      </p>
    </Link>
  );
};
