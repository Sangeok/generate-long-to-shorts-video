import { ArrowRight, AtSign, Mail, Play, Rss, Video } from "lucide-react";

import { Button } from "@/components/ui/button";

const COLUMNS = [
  {
    title: "Product",
    links: ["Features", "Pricing", "How it works", "Changelog"],
  },
  {
    title: "Company",
    links: ["About", "Blog", "Careers", "Contact"],
  },
  {
    title: "Legal",
    links: ["Privacy", "Terms", "Security"],
  },
] as const;

const SOCIALS = [
  { label: "YouTube", icon: Video },
  { label: "Social", icon: AtSign },
  { label: "Blog", icon: Rss },
  { label: "Email", icon: Mail },
] as const;

export function SiteFooter() {
  return (
    <footer className="border-t border-border">
      {/* Closing CTA band */}
      <div className="mx-auto max-w-6xl px-5 sm:px-6">
        <div className="flex flex-col items-start gap-6 border-b border-border py-16 sm:flex-row sm:items-center sm:justify-between lg:py-20">
          <h2 className="max-w-xl font-display text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
            Stop scrubbing. <span className="text-primary">Start shipping.</span>
          </h2>
          <Button
            size="lg"
            className="h-12 shrink-0 px-6 text-base"
            nativeButton={false}
            render={<a href="#pricing" />}
          >
            Start free
            <ArrowRight />
          </Button>
        </div>
      </div>

      {/* Links */}
      <div className="mx-auto max-w-6xl px-5 py-14 sm:px-6">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-[1.4fr_repeat(3,1fr)]">
          <div className="max-w-xs">
            <a href="#" className="flex items-center gap-2.5">
              <span className="grid size-7 place-items-center rounded-[6px] bg-primary text-primary-foreground">
                <Play className="size-3.5 fill-current" />
              </span>
              <span className="font-display text-lg font-semibold tracking-tight">
            LongformShorts <span className="text-primary">AI</span>
              </span>
            </a>
            <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
              The AI clip studio that turns long videos into short-form content,
              automatically.
            </p>
          </div>

          {COLUMNS.map((col) => (
            <div key={col.title}>
              <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
                {col.title}
              </p>
              <ul className="mt-4 space-y-2.5">
                {col.links.map((link) => (
                  <li key={link}>
                    <a
                      href="#"
                      className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                    >
                      {link}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-14 flex flex-col items-start gap-4 border-t border-border pt-6 sm:flex-row sm:items-center sm:justify-between">
          <p className="font-mono text-xs text-muted-foreground">
            2026 LongformShorts AI. All rights reserved.
          </p>
          <div className="flex items-center gap-1">
            {SOCIALS.map((social) => {
              const Icon = social.icon;
              return (
                <a
                  key={social.label}
                  href="#"
                  aria-label={social.label}
                  className="grid size-9 place-items-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                >
                  <Icon className="size-4" />
                </a>
              );
            })}
          </div>
        </div>
      </div>
    </footer>
  );
}
