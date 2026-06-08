import {
  AlertTriangle,
  Check,
  ExternalLink,
  Loader2,
  RotateCcw,
  UploadCloud,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";

import type { VideoMeta } from "../hooks/use-video-uploader";
import type { UploadPhase, VideoDTO } from "../types";

interface UploadControlPanelProps {
  file: File | null;
  meta: VideoMeta | null;
  progress: number;
  phase: UploadPhase;
  video: VideoDTO | null;
  error: string | null;
  onChooseDifferentFile: () => void;
  onReset: () => void;
  onUpload: () => void;
}

const formatBytes = (bytes: number) => {
  if (!bytes) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  const i = Math.min(
    units.length - 1,
    Math.floor(Math.log(bytes) / Math.log(1024)),
  );
  const value = bytes / 1024 ** i;
  return `${value.toFixed(value >= 100 || i === 0 ? 0 : 1)} ${units[i]}`;
};

const formatDuration = (seconds: number) => {
  if (!Number.isFinite(seconds)) return "--:--";
  const total = Math.floor(seconds);
  const minutes = Math.floor(total / 60);
  const remainingSeconds = total % 60;
  return `${String(minutes).padStart(2, "0")}:${String(remainingSeconds).padStart(2, "0")}`;
};

const gcd = (a: number, b: number): number => (b === 0 ? a : gcd(b, a % b));

const formatAspect = (width: number, height: number) => {
  if (!width || !height) return "--";
  const divisor = gcd(width, height);
  return `${width / divisor}:${height / divisor}`;
};

const getExtension = (file: File) => {
  const fromName = file.name.includes(".")
    ? file.name.split(".").pop()
    : undefined;
  const fromType = file.type.split("/")[1];
  return (fromName ?? fromType ?? "video").toUpperCase();
};

const MetaCell = ({ label, value }: { label: string; value: string }) => (
  <div className="flex flex-col gap-1">
    <span className="font-mono text-[0.625rem] uppercase tracking-[0.2em] text-muted-foreground">
      {label}
    </span>
    <span className="font-mono text-sm tabular-nums text-foreground">
      {value}
    </span>
  </div>
);

export const UploadControlPanel = ({
  file,
  meta,
  progress,
  phase,
  video,
  error,
  onChooseDifferentFile,
  onReset,
  onUpload,
}: UploadControlPanelProps) => {
  return (
    <div className="flex flex-col gap-5 rounded-2xl border border-border bg-card p-5">
      {phase === "selected" && (
        <>
          <div>
            <p className="eyebrow">Selected clip</p>
            <p
              className="mt-2 truncate font-display text-lg font-semibold tracking-tight"
              title={file?.name}
            >
              {file?.name}
            </p>
          </div>
          <div className="grid grid-cols-2 gap-4 border-y border-border py-4">
            <MetaCell
              label="Duration"
              value={meta ? formatDuration(meta.duration) : "--:--"}
            />
            <MetaCell
              label="Aspect"
              value={meta ? formatAspect(meta.width, meta.height) : "--"}
            />
            <MetaCell label="Size" value={file ? formatBytes(file.size) : "--"} />
            <MetaCell label="Format" value={file ? getExtension(file) : "--"} />
          </div>
          <div className="mt-auto flex flex-col gap-2">
            <Button type="button" size="lg" onClick={onUpload}>
              <UploadCloud /> Upload video
            </Button>
            <Button type="button" variant="ghost" onClick={onChooseDifferentFile}>
              Choose a different file
            </Button>
          </div>
        </>
      )}

      {phase === "uploading" && (
        <>
          <div>
            <p className="eyebrow">Uploading</p>
            <p
              className="mt-2 truncate font-display text-lg font-semibold tracking-tight"
              title={file?.name}
            >
              {file?.name}
            </p>
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="font-display text-5xl font-semibold tabular-nums">
              {Math.round(progress)}
            </span>
            <span className="font-mono text-sm text-muted-foreground">%</span>
          </div>
          <Progress value={progress} aria-label="Upload progress" />
          <p className="font-mono text-xs tabular-nums text-muted-foreground">
            {formatBytes((progress / 100) * (file?.size ?? 0))}
            {" / "}
            {formatBytes(file?.size ?? 0)}
          </p>
        </>
      )}

      {phase === "processing" && (
        <>
          <div>
            <p className="eyebrow">In progress</p>
            <div className="mt-2 flex items-center gap-2.5">
              <Loader2 className="size-4 animate-spin text-primary" />
              <p className="font-mono text-xs uppercase tracking-[0.2em] text-foreground">
                Finalizing on server
              </p>
            </div>
          </div>
          <p
            className="truncate font-display text-lg font-semibold tracking-tight"
            title={file?.name}
          >
            {file?.name}
          </p>
          <div className="border-y border-border py-4">
            <Progress value={null} aria-label="Processing" />
            <p className="mt-3 flex items-center gap-2 font-mono text-[0.625rem] uppercase tracking-[0.2em] text-muted-foreground">
              <span className="size-1.5 animate-pulse rounded-full bg-primary" />
              Verifying upload
            </p>
          </div>
          <p className="text-sm text-muted-foreground">
            Verifying the upload and preparing a shareable link…
          </p>
        </>
      )}

      {phase === "ready" && (
        <>
          <div className="flex items-center gap-2.5">
            <span className="grid size-8 place-items-center rounded-full bg-primary text-primary-foreground">
              <Check className="size-4" />
            </span>
            <p className="font-mono text-xs uppercase tracking-[0.2em] text-foreground">
              Upload complete
            </p>
          </div>
          <p
            className="truncate font-display text-lg font-semibold tracking-tight"
            title={video?.title}
          >
            {video?.title}
          </p>
          {video?.viewUrl && (
            <a
              href={video.viewUrl}
              target="_blank"
              rel="noreferrer"
              className="group/link flex items-center justify-between gap-3 rounded-xl border border-border bg-secondary/40 px-3.5 py-3 transition-colors hover:border-primary/40 hover:bg-secondary/60"
            >
              <span className="flex min-w-0 flex-col gap-1">
                <span className="font-mono text-[0.625rem] uppercase tracking-[0.2em] text-muted-foreground">
                  Signed view URL
                </span>
                <span className="truncate font-mono text-xs text-foreground">
                  {video.viewUrl}
                </span>
              </span>
              <ExternalLink className="size-4 shrink-0 text-muted-foreground transition-colors group-hover/link:text-primary" />
            </a>
          )}
          <div className="mt-auto">
            <Button
              type="button"
              variant="outline"
              size="lg"
              onClick={onReset}
              className="w-full"
            >
              <RotateCcw /> Upload another
            </Button>
          </div>
        </>
      )}

      {phase === "failed" && (
        <>
          <div className="flex items-center gap-2.5">
            <span className="grid size-8 place-items-center rounded-full bg-destructive/15 text-destructive">
              <AlertTriangle className="size-4" />
            </span>
            <p className="font-mono text-xs uppercase tracking-[0.2em] text-destructive">
              Upload failed
            </p>
          </div>
          <div className="rounded-xl border border-destructive/30 bg-destructive/10 px-3.5 py-3">
            <p className="text-sm text-foreground/90" role="alert">
              {error ?? "Something went wrong during upload."}
            </p>
          </div>
          <div className="mt-auto flex flex-col gap-2">
            <Button type="button" size="lg" onClick={onUpload}>
              <RotateCcw /> Try again
            </Button>
            <Button type="button" variant="ghost" onClick={onReset}>
              Start over
            </Button>
          </div>
        </>
      )}
    </div>
  );
};
