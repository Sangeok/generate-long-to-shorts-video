import { ArrowRight, Play, Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";

const CLIPS = [
  { time: "04:12 — 04:41", score: "98", title: "The hook that went viral" },
  { time: "18:30 — 18:52", score: "94", title: "One-line truth bomb" },
  { time: "31:05 — 31:38", score: "91", title: "The plot twist moment" },
] as const;

function ClipCard({
  time,
  score,
  title,
  delay,
  lift,
}: {
  time: string;
  score: string;
  title: string;
  delay: string;
  lift: string;
}) {
  return (
    <div
      className="animate-rise min-w-0 flex-1"
      style={{ animationDelay: delay, marginTop: lift }}
    >
      <div className="relative aspect-[9/16] overflow-hidden rounded-xl border border-border bg-card">
        {/* faux frame backdrop */}
        <div className="absolute inset-0 bg-[radial-gradient(120%_80%_at_50%_0%,oklch(0.26_0.01_285)_0%,oklch(0.16_0.004_285)_70%)]" />
        {/* score badge */}
        <div className="absolute left-2 top-2 flex items-center gap-1 rounded-full bg-primary px-2 py-0.5 font-mono text-[10px] font-semibold text-primary-foreground">
          <Sparkles className="size-2.5" />
          {score}
        </div>
        {/* center play */}
        <div className="absolute inset-0 grid place-items-center">
          <span className="grid size-9 place-items-center rounded-full border border-white/15 bg-background/40 backdrop-blur-sm">
            <Play className="size-3.5 fill-foreground text-foreground" />
          </span>
        </div>
        {/* caption motif */}
        <div className="absolute inset-x-2 bottom-2 space-y-1.5">
          <div className="h-2 w-3/4 rounded-full bg-foreground/80" />
          <div className="h-2 w-1/2 rounded-full bg-foreground/35" />
        </div>
      </div>
      <div className="mt-2 flex items-center justify-between gap-2">
        <span className="truncate text-xs text-muted-foreground">{title}</span>
        <span className="shrink-0 font-mono text-[10px] text-muted-foreground/70">
          9:16
        </span>
      </div>
      <div className="mt-0.5 font-mono text-[10px] tracking-tight text-primary/80">
        {time}
      </div>
    </div>
  );
}

export function Hero() {
  return (
    <section className="relative overflow-hidden">
      <div className="mx-auto grid max-w-6xl grid-cols-1 gap-14 px-5 pt-16 pb-20 sm:px-6 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)] lg:gap-10 lg:pt-24 lg:pb-28">
        {/* Copy */}
        <div className="flex flex-col justify-center">
          <p className="eyebrow animate-rise">
            <span className="text-primary">●</span>&nbsp;&nbsp;AI clip studio
          </p>
          <h1
            className="animate-rise mt-5 font-display text-[2rem] leading-[1.04] font-semibold tracking-tight text-balance sm:text-5xl sm:leading-[0.98] lg:text-[4.25rem]"
            style={{ animationDelay: "60ms" }}
          >
            Turn one long video into{" "}
            <span className="text-primary">a month of shorts.</span>
          </h1>
          <p
            className="animate-rise mt-6 max-w-md text-base leading-relaxed text-muted-foreground sm:text-lg"
            style={{ animationDelay: "120ms" }}
          >
            LongformShorts AI watches your podcast, webinar, or stream, finds the moments
            worth clipping, then reframes and captions them for vertical — no
            editor required.
          </p>
          <div
            className="animate-rise mt-8 flex flex-col gap-3 sm:flex-row sm:items-center"
            style={{ animationDelay: "180ms" }}
          >
            <Button
              size="lg"
              className="h-12 px-6 text-base"
              nativeButton={false}
              render={<a href="#pricing" />}
            >
              Start free
              <ArrowRight />
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="h-12 px-6 text-base"
              nativeButton={false}
              render={<a href="#how" />}
            >
              <Play className="fill-current" />
              Watch demo
            </Button>
          </div>
          <div
            className="animate-rise mt-10 flex items-center gap-4 text-xs text-muted-foreground"
            style={{ animationDelay: "240ms" }}
          >
            <div className="flex -space-x-2">
              {[0, 1, 2, 3].map((i) => (
                <span
                  key={i}
                  className="size-6 rounded-full border border-background bg-secondary"
                />
              ))}
            </div>
            <span>
              Trusted by <span className="text-foreground">12,000+</span>{" "}
              creators
            </span>
          </div>
        </div>

        {/* Clip-slicing visual */}
        <div className="flex flex-col justify-center">
          {/* source timeline */}
          <div
            className="animate-rise rounded-xl border border-border bg-card/60 p-4"
            style={{ animationDelay: "120ms" }}
          >
            <div className="flex items-center justify-between">
              <span className="font-mono text-[11px] text-muted-foreground">
                source-recording.mp4
              </span>
              <span className="font-mono text-[11px] text-muted-foreground">
                47:12
              </span>
            </div>
            <div className="relative mt-3 h-9 overflow-hidden rounded-md bg-secondary">
              {/* waveform-ish bars */}
              <div className="absolute inset-0 flex items-center gap-[3px] px-2">
                {Array.from({ length: 56 }).map((_, i) => {
                  const hot = [5, 6, 7, 22, 23, 38, 39, 40].includes(i);
                  return (
                    <span
                      key={i}
                      className={
                        hot
                          ? "w-[3px] rounded-full bg-primary"
                          : "w-[3px] rounded-full bg-foreground/20"
                      }
                      style={{
                        height: `${20 + ((i * 37) % 60)}%`,
                      }}
                    />
                  );
                })}
              </div>
              {/* playhead */}
              <span className="absolute top-0 bottom-0 left-[38%] w-px bg-primary" />
            </div>
            <div className="mt-2 flex items-center gap-1.5 font-mono text-[10px] text-primary">
              <Sparkles className="size-3" />
              8 high-signal moments detected
            </div>
          </div>

          {/* down flow */}
          <div className="my-3 flex justify-center">
            <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
              auto-clipped ↓
            </span>
          </div>

          {/* output clips */}
          <div className="flex items-start gap-3">
            {CLIPS.map((clip, i) => (
              <ClipCard
                key={clip.time}
                {...clip}
                delay={`${200 + i * 90}ms`}
                lift={i === 1 ? "1.75rem" : "0"}
              />
            ))}
          </div>
        </div>
      </div>

      {/* bottom hairline */}
      <div className="mx-auto max-w-6xl px-5 sm:px-6">
        <div className="border-t border-border" />
      </div>
    </section>
  );
}
