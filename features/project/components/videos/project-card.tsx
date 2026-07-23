"use client";

import {
  AlertTriangle,
  ArrowUpRight,
  ChevronDown,
  Loader2,
  MoreHorizontal,
  Trash2,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

import { formatTimecode } from "../../format";
import { PROJECT_STATUS_META } from "../../project-status";
import type { ProjectSummary } from "../../types";

interface ProjectCardProps {
  project: ProjectSummary;
  index: number;
  isExpanded: boolean;
  onToggleExpand: () => void;
  onDelete: () => void;
}

// Deterministic timeline bars — a cinematic motif across the wide poster.
const TIMELINE = Array.from({ length: 56 }, (_, index) =>
  Math.round(26 + Math.abs(Math.sin(index * 1.1) * 70)),
);

function isRenderingShorts(project: ProjectSummary): boolean {
  return (
    project.status === "completed" &&
    project.readyShorts < project.totalShorts
  );
}

function getStatusLabel(project: ProjectSummary): string {
  const isCompleted = project.status === "completed";
  if (isCompleted && project.totalShorts > 0 && isRenderingShorts(project)) {
    return `${project.readyShorts}/${project.totalShorts} ready`;
  }
  if (isCompleted && project.totalShorts === 0) {
    return "No shorts";
  }
  return PROJECT_STATUS_META[project.status].label;
}

function getStatusDotClass(project: ProjectSummary): string {
  if (project.status === "failed") {
    return "bg-destructive";
  }
  if (PROJECT_STATUS_META[project.status].active || isRenderingShorts(project)) {
    return "bg-primary animate-pulse";
  }
  if (project.status === "completed") {
    return "bg-primary";
  }
  return "bg-muted-foreground";
}

function formatRelativeTime(iso: string): string {
  const then = new Date(iso).getTime();
  const diffSec = Math.round((Date.now() - then) / 1000);
  const day = 86400;
  if (diffSec < 60) return "just now";
  if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m ago`;
  if (diffSec < day) return `${Math.floor(diffSec / 3600)}h ago`;
  if (diffSec < day * 7) return `${Math.floor(diffSec / day)}d ago`;
  return new Date(iso).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}

export const ProjectCard = ({
  project,
  index,
  isExpanded,
  onToggleExpand,
  onDelete,
}: ProjectCardProps) => {
  const [confirmOpen, setConfirmOpen] = useState(false);

  const isProcessing = PROJECT_STATUS_META[project.status].active;
  const isFailed = project.status === "failed";
  const isCompleted = project.status === "completed";
  const canExpand = isCompleted && project.totalShorts > 0;

  const statusLabel = getStatusLabel(project);
  const dotClass = getStatusDotClass(project);

  return (
    <article
      className="group animate-rise flex flex-col overflow-hidden rounded-2xl border border-border bg-card"
      style={{ animationDelay: `${Math.min(index, 8) * 60}ms` }}
    >
      <Link
        href={`/dashboard/projects/${project.id}`}
        aria-label={`Open ${project.title}`}
        className="relative block aspect-video overflow-hidden bg-background"
      >
        <span
          aria-hidden
          className={cn(
            "absolute inset-0",
            isFailed
              ? "bg-[radial-gradient(120%_120%_at_50%_-20%,_oklch(0.62_0.2_25_/_0.18)_0%,_transparent_55%)]"
              : "bg-[radial-gradient(120%_120%_at_50%_-20%,_oklch(0.24_0.01_285_/_0.8)_0%,_transparent_55%)]",
          )}
        />

        <span className="absolute left-4 top-4 z-10 rounded-full border border-border px-2.5 py-1 font-mono text-[0.625rem] uppercase tracking-[0.18em] text-muted-foreground">
          {project.contentType}
        </span>
        <span className="absolute right-4 top-4 z-10 font-mono text-[0.625rem] uppercase tracking-[0.2em] text-muted-foreground">
          {formatTimecode(project.durationSec)}
        </span>

        <span className="absolute inset-0 z-10 grid place-items-center">
          {isFailed ? (
            <span className="grid size-14 place-items-center rounded-full border border-destructive/40 bg-destructive/10 text-destructive">
              <AlertTriangle className="size-5" />
            </span>
          ) : isProcessing ? (
            <span className="flex flex-col items-center gap-2 text-muted-foreground">
              <Loader2 className="size-5 animate-spin" />
              <span className="font-mono text-[0.625rem] uppercase tracking-[0.18em]">
                {PROJECT_STATUS_META[project.status].label}
              </span>
            </span>
          ) : (
            <span className="grid size-14 place-items-center rounded-full border border-border bg-background/55 text-foreground backdrop-blur-sm transition-colors duration-200 group-hover:border-transparent group-hover:bg-primary group-hover:text-primary-foreground">
              <ArrowUpRight className="size-5" />
            </span>
          )}
        </span>

        <span
          aria-hidden
          className="absolute inset-x-4 bottom-4 z-10 flex h-7 items-end gap-[2px]"
        >
          {TIMELINE.map((height, barIndex) => (
            <span
              key={barIndex}
              className="w-full flex-1 rounded-full bg-foreground/12"
              style={{ height: `${height}%` }}
            />
          ))}
        </span>
      </Link>

      <div className="flex flex-1 flex-col gap-3 p-4">
        <Link href={`/dashboard/projects/${project.id}`}>
          <h3 className="line-clamp-1 font-display text-lg font-semibold leading-snug tracking-tight text-foreground">
            {project.title}
          </h3>
        </Link>

        <div className="flex items-center justify-between gap-2">
          <span className="flex items-center gap-2 font-mono text-[0.625rem] uppercase tracking-[0.16em] text-muted-foreground">
            <span className={cn("size-1.5 rounded-full", dotClass)} />
            {statusLabel}
            <span className="text-foreground/25">·</span>
            {formatRelativeTime(project.createdAt)}
          </span>

          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button
                  variant="ghost"
                  size="icon-sm"
                  aria-label="Video actions"
                  className="-mr-1 text-muted-foreground"
                />
              }
            >
              <MoreHorizontal />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                render={<Link href={`/dashboard/projects/${project.id}`} />}
              >
                <ArrowUpRight />
                Open project
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                variant="destructive"
                onClick={() => setConfirmOpen(true)}
              >
                <Trash2 />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {canExpand && (
          <button
            type="button"
            onClick={onToggleExpand}
            aria-expanded={isExpanded}
            className={cn(
              "mt-auto flex items-center justify-between rounded-lg border border-border px-3 py-2 font-mono text-[0.625rem] uppercase tracking-[0.18em] transition-colors",
              isExpanded
                ? "border-primary/40 bg-primary/5 text-foreground"
                : "text-muted-foreground hover:bg-muted hover:text-foreground",
            )}
          >
            {project.totalShorts} shorts
            <ChevronDown
              className={cn(
                "size-3.5 transition-transform duration-200",
                isExpanded && "rotate-180 text-primary",
              )}
            />
          </button>
        )}
      </div>

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this video?</AlertDialogTitle>
            <AlertDialogDescription>
              &ldquo;{project.title}&rdquo; and all {project.totalShorts} shorts
              generated from it will be permanently removed. This can&apos;t be
              undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={() => {
                setConfirmOpen(false);
                onDelete();
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </article>
  );
};
