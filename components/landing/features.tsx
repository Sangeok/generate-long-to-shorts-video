import {
  Captions,
  Crop,
  Languages,
  ScanSearch,
  Share2,
  Wand2,
  type LucideIcon,
} from "lucide-react";

import { cn } from "@/lib/utils";

type Feature = {
  index: string;
  tag: string;
  icon: LucideIcon;
  title: string;
  body: string;
  span: boolean;
};

const FEATURES: Feature[] = [
  {
    index: "01",
    tag: "detect",
    icon: ScanSearch,
    title: "It finds the moments you'd cut anyway",
    body: "Our model scores every second of your footage for hooks, payoffs, and emotional peaks — then hands you the clips most likely to travel, ranked.",
    span: true,
  },
  {
    index: "02",
    tag: "caption",
    icon: Captions,
    title: "Captions that actually keep up",
    body: "Word-perfect, frame-synced subtitles styled to stop the scroll.",
    span: false,
  },
  {
    index: "03",
    tag: "reframe",
    icon: Crop,
    title: "16:9 → 9:16, no awkward crops",
    body: "Subject tracking keeps the speaker centered as you reframe to vertical.",
    span: false,
  },
  {
    index: "04",
    tag: "export",
    icon: Share2,
    title: "One render, every platform",
    body: "Export to Shorts, Reels, and TikTok specs in a click — sized, captioned, and ready to schedule.",
    span: true,
  },
  {
    index: "05",
    tag: "rewrite",
    icon: Wand2,
    title: "B-roll & hooks on tap",
    body: "Auto-suggested titles, hooks, and overlays per clip.",
    span: false,
  },
  {
    index: "06",
    tag: "translate",
    icon: Languages,
    title: "Go global, instantly",
    body: "Translate captions into 30+ languages without re-recording.",
    span: false,
  },
];

function FeatureCard({ feature }: { feature: Feature }) {
  const Icon = feature.icon;
  return (
    <div
      className={cn(
        "group relative flex flex-col rounded-xl border border-border bg-card/50 p-6 transition-colors duration-300 hover:border-primary/40 hover:bg-card sm:p-7",
        feature.span && "lg:col-span-2",
      )}
    >
      <div className="mb-6 flex items-center justify-between">
        <span className="grid size-10 place-items-center rounded-lg border border-border bg-secondary text-primary transition-colors group-hover:border-primary/30">
          <Icon className="size-5" />
        </span>
        <span className="font-mono text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
          {feature.index} / {feature.tag}
        </span>
      </div>
      <h3 className="font-display text-xl font-medium tracking-tight text-balance">
        {feature.title}
      </h3>
      <p className="mt-2.5 max-w-prose text-sm leading-relaxed text-muted-foreground">
        {feature.body}
      </p>
    </div>
  );
}

export function Features() {
  return (
    <section id="features" className="scroll-mt-20">
      <div className="mx-auto max-w-6xl px-5 py-20 sm:px-6 lg:py-28">
        <div className="max-w-2xl">
          <p className="eyebrow">Features</p>
          <h2 className="mt-4 font-display text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
            Everything between &ldquo;upload&rdquo; and &ldquo;posted&rdquo;
          </h2>
          <p className="mt-4 text-muted-foreground">
            A full clipping pipeline that does the tedious parts, so you spend
            your time choosing — not scrubbing.
          </p>
        </div>

        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((feature) => (
            <FeatureCard key={feature.index} feature={feature} />
          ))}
        </div>
      </div>
    </section>
  );
}
