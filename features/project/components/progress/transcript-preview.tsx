import type { CaptionSegment } from "../../types";

interface TranscriptPreviewProps {
  segments: CaptionSegment[];
}

const PREVIEW_LIMIT = 12;

function formatTimecode(totalSeconds: number): string {
  const total = Math.floor(totalSeconds);
  const minutes = Math.floor(total / 60);
  const seconds = total % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

export const TranscriptPreview = ({ segments }: TranscriptPreviewProps) => {
  if (segments.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        No caption cues to show from the transcript.
      </p>
    );
  }

  const visible = segments.slice(0, PREVIEW_LIMIT);
  const remaining = segments.length - visible.length;

  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      <div className="flex items-baseline justify-between gap-3">
        <p className="eyebrow">Transcript</p>
        <span className="font-mono text-[0.625rem] uppercase tracking-[0.2em] text-muted-foreground">
          {segments.length} cues
        </span>
      </div>
      <ul className="mt-4 flex flex-col gap-3">
        {visible.map((segment, index) => (
          <li key={index} className="flex gap-4">
            <span className="shrink-0 pt-0.5 font-mono text-xs tabular-nums text-primary">
              {formatTimecode(segment.start)}
            </span>
            <p className="text-sm leading-relaxed text-foreground/90">
              {segment.text}
            </p>
          </li>
        ))}
      </ul>
      {remaining > 0 && (
        <p className="mt-4 font-mono text-[0.625rem] uppercase tracking-[0.2em] text-muted-foreground">
          + {remaining} more cues
        </p>
      )}
    </div>
  );
};
