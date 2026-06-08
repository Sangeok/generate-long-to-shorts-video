import { Check, Loader2, X } from "lucide-react";
import type { SyntheticEvent } from "react";

import { Button } from "@/components/ui/button";

import type { UploadPhase } from "../types";

interface VideoPreviewProps {
  previewUrl: string | null;
  viewUrl: string | null;
  phase: UploadPhase;
  onLoadedMetadata: (event: SyntheticEvent<HTMLVideoElement>) => void;
  onReset: () => void;
}

export const VideoPreview = ({
  previewUrl,
  viewUrl,
  phase,
  onLoadedMetadata,
  onReset,
}: VideoPreviewProps) => {
  const src = phase === "ready" && viewUrl ? viewUrl : (previewUrl ?? undefined);
  const showOverlay = phase === "uploading" || phase === "processing";

  return (
    <div className="relative overflow-hidden rounded-2xl border border-border bg-black">
      <video
        key={src}
        src={src}
        controls={!showOverlay}
        onLoadedMetadata={onLoadedMetadata}
        className="aspect-video max-h-[460px] w-full bg-black object-contain"
      />
      {phase === "selected" && (
        <Button
          type="button"
          size="icon-sm"
          variant="secondary"
          aria-label="Remove video"
          onClick={onReset}
          className="absolute top-2 right-2 backdrop-blur-sm"
        >
          <X />
        </Button>
      )}
      {showOverlay && (
        <div className="absolute inset-x-0 bottom-0 flex items-center gap-2 bg-gradient-to-t from-black/80 to-transparent px-4 pt-8 pb-3">
          <Loader2 className="size-3.5 animate-spin text-primary" />
          <span className="font-mono text-[0.625rem] uppercase tracking-[0.2em] text-foreground/80">
            {phase === "uploading" ? "Uploading" : "Finalizing"}
          </span>
        </div>
      )}
      {phase === "ready" && (
        <div className="absolute top-2 left-2 flex items-center gap-1.5 rounded-full bg-primary px-2.5 py-1 text-primary-foreground">
          <Check className="size-3" />
          <span className="font-mono text-[0.625rem] uppercase tracking-[0.2em]">
            Ready
          </span>
        </div>
      )}
    </div>
  );
};
