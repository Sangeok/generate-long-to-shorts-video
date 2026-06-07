import { Upload, Wand2, Download } from "lucide-react";

const STEPS = [
  {
    n: "01",
    time: "00:00",
    icon: Upload,
    title: "Drop in your long video",
    body: "Upload a file or paste a YouTube link. Podcasts, webinars, streams — up to 4 hours.",
  },
  {
    n: "02",
    time: "00:30",
    icon: Wand2,
    title: "AI finds & cuts the clips",
    body: "LongformShorts AI scores the footage, picks the standout moments, then reframes and captions each one.",
  },
  {
    n: "03",
    time: "02:00",
    icon: Download,
    title: "Review & export",
    body: "Tweak any clip, then export to every vertical platform — or schedule straight from the dashboard.",
  },
] as const;

export function HowItWorks() {
  return (
    <section id="how" className="scroll-mt-20 border-y border-border bg-card/30">
      <div className="mx-auto max-w-6xl px-5 py-20 sm:px-6 lg:py-28">
        <div className="max-w-2xl">
          <p className="eyebrow">How it works</p>
          <h2 className="mt-4 font-display text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
            From raw footage to ready-to-post in three steps
          </h2>
        </div>

        <ol className="mt-14 grid gap-px overflow-hidden rounded-xl border border-border bg-border sm:grid-cols-3">
          {STEPS.map((step) => {
            const Icon = step.icon;
            return (
              <li
                key={step.n}
                className="relative flex flex-col bg-card p-7 sm:p-8"
              >
                <div className="flex items-center justify-between">
                  <span className="font-display text-5xl font-semibold tracking-tight text-primary/25">
                    {step.n}
                  </span>
                  <span className="font-mono text-[11px] text-muted-foreground">
                    +{step.time}
                  </span>
                </div>
                <span className="mt-8 grid size-10 place-items-center rounded-lg border border-border bg-secondary text-primary">
                  <Icon className="size-5" />
                </span>
                <h3 className="mt-4 font-display text-lg font-medium tracking-tight">
                  {step.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  {step.body}
                </p>
              </li>
            );
          })}
        </ol>
      </div>
    </section>
  );
}
