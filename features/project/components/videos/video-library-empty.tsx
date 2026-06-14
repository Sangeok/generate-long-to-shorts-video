import Link from "next/link";
import { ArrowRight, Clapperboard } from "lucide-react";

import { Button } from "@/components/ui/button";

// Decorative filmstrip — a quiet nod to the editing motif, not real data.
const FILMSTRIP = Array.from({ length: 32 }, (_, index) =>
  Math.round(34 + Math.abs(Math.sin(index * 1.3) * 60)),
);

export const VideoLibraryEmpty = () => {
  return (
    <div className="animate-rise flex flex-col items-center rounded-2xl border border-border bg-card px-6 py-16 text-center sm:py-20">
      <span className="grid size-14 place-items-center rounded-xl bg-secondary text-muted-foreground">
        <Clapperboard className="size-6" />
      </span>

      <p className="eyebrow mt-7">No videos yet</p>
      <h2 className="mt-3 max-w-md font-display text-2xl font-semibold leading-tight tracking-tight text-foreground sm:text-3xl">
        Your library is an empty stage.
      </h2>
      <p className="mt-3 max-w-sm text-sm leading-relaxed text-muted-foreground">
        Upload a long video and the shorts it becomes will live here — ready to
        replay, caption, and post.
      </p>

      {/* Faint timeline strip under the copy carries the cinematic identity. */}
      <span
        aria-hidden
        className="mt-8 flex h-8 w-full max-w-xs items-end justify-center gap-[3px]"
      >
        {FILMSTRIP.map((height, index) => (
          <span
            key={index}
            className="w-full flex-1 rounded-full bg-foreground/10"
            style={{ height: `${height}%` }}
          />
        ))}
      </span>

      <Button className="mt-8" render={<Link href="/dashboard" />}>
        Upload a video
        <ArrowRight />
      </Button>
    </div>
  );
};
