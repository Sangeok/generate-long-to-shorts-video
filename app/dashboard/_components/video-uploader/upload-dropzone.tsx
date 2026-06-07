import { UploadCloud } from "lucide-react";
import type { DragEventHandler } from "react";

import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface UploadDropzoneProps {
  isDragging: boolean;
  onDragLeave: DragEventHandler<HTMLDivElement>;
  onDragOver: DragEventHandler<HTMLDivElement>;
  onDrop: DragEventHandler<HTMLDivElement>;
  onOpenPicker: () => void;
}

export const UploadDropzone = ({
  isDragging,
  onDragLeave,
  onDragOver,
  onDrop,
  onOpenPicker,
}: UploadDropzoneProps) => {
  return (
    <div
      role="button"
      tabIndex={0}
      aria-label="Select a video to upload"
      onClick={onOpenPicker}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onOpenPicker();
        }
      }}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
      className={cn(
        "group relative flex cursor-pointer flex-col items-center justify-center gap-6 overflow-hidden rounded-2xl border border-dashed px-8 py-16 text-center outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring sm:py-24",
        isDragging
          ? "border-primary/60 bg-card"
          : "border-border bg-card/30 hover:border-border/70 hover:bg-card/50",
      )}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-border to-transparent"
      />
      <div className="grid size-14 place-items-center rounded-xl border border-border bg-secondary text-foreground transition-transform group-hover:-translate-y-0.5">
        <UploadCloud className="size-6" />
      </div>
      <div className="space-y-2">
        <p className="eyebrow">Drop footage here</p>
        <h2 className="font-display text-2xl font-semibold tracking-tight sm:text-3xl">
          Drag a video in, or browse
        </h2>
        <p className="mx-auto max-w-sm text-sm text-muted-foreground">
          Drop a full episode, talk, or stream. We&apos;ll find the moments
          worth posting.
        </p>
      </div>
      <span
        className={cn(
          buttonVariants({ size: "lg" }),
          "pointer-events-none gap-2",
        )}
      >
        <UploadCloud className="size-4" />
        Select from device
      </span>
      <div className="flex flex-wrap items-center justify-center gap-x-2.5 gap-y-1 font-mono text-[0.625rem] uppercase tracking-[0.2em] text-muted-foreground">
        <span>MP4</span>
        <span className="text-border">/</span>
        <span>MOV</span>
        <span className="text-border">/</span>
        <span>WEBM</span>
        <span className="mx-1 text-border">/</span>
        <span>9:16 / 16:9 / 1:1</span>
      </div>
    </div>
  );
};
