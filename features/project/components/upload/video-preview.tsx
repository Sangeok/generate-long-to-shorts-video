import { Loader2, X } from "lucide-react";
import type { SyntheticEvent } from "react";

import { Button } from "@/components/ui/button";

import type { UploadStatus } from "./use-video-uploader";

interface VideoPreviewProps {
  previewUrl: string | null;
  status: UploadStatus;
  onLoadedMetadata: (event: SyntheticEvent<HTMLVideoElement>) => void;
  onReset: () => void;
}

export const VideoPreview = ({
  previewUrl,
  status,
  onLoadedMetadata,
  onReset,
}: VideoPreviewProps) => {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-border bg-black">
      <video
        key={previewUrl}
        src={previewUrl ?? undefined}
        controls={status !== "uploading"}
        onLoadedMetadata={onLoadedMetadata}
        className="aspect-video max-h-[460px] w-full bg-black object-contain"
      />
      {status === "selected" && (
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
      {status === "uploading" && (
        <div className="absolute inset-x-0 bottom-0 flex items-center gap-2 bg-gradient-to-t from-black/80 to-transparent px-4 pt-8 pb-3">
          <Loader2 className="size-3.5 animate-spin text-primary" />
          <span className="font-mono text-[0.625rem] uppercase tracking-[0.2em] text-foreground/80">
            Ingesting
          </span>
        </div>
      )}
    </div>
  );
};
