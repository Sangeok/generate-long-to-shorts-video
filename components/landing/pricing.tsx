"use client";

import * as React from "react";
import { Check } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";

const PLANS = [
  {
    name: "Free",
    blurb: "For trying it out on your next upload.",
    monthly: 0,
    annual: 0,
    cta: "Start free",
    highlighted: false,
    features: [
      "3 long videos / month",
      "Up to 10 clips per video",
      "Auto-captions & reframing",
      "720p exports with watermark",
    ],
  },
  {
    name: "Pro",
    blurb: "For creators shipping shorts every week.",
    monthly: 19,
    annual: 15,
    cta: "Start 7-day trial",
    highlighted: true,
    features: [
      "Unlimited long videos",
      "Unlimited clips & exports",
      "1080p, no watermark",
      "30+ caption languages",
      "Scheduling & brand presets",
      "Priority rendering",
    ],
  },
] as const;

function PlanCard({
  plan,
  annual,
}: {
  plan: (typeof PLANS)[number];
  annual: boolean;
}) {
  const price = annual ? plan.annual : plan.monthly;
  return (
    <div
      className={cn(
        "relative flex flex-col rounded-2xl border p-7 sm:p-8",
        plan.highlighted
          ? "border-primary/60 bg-card"
          : "border-border bg-card/40",
      )}
    >
      {plan.highlighted && (
        <Badge className="absolute -top-2.5 right-7 font-mono text-[10px] uppercase tracking-[0.15em]">
          Most popular
        </Badge>
      )}
      <h3 className="font-display text-2xl font-semibold tracking-tight">
        {plan.name}
      </h3>
      <p className="mt-1.5 text-sm text-muted-foreground">{plan.blurb}</p>

      <div className="mt-6 flex items-baseline gap-1">
        <span className="font-display text-5xl font-semibold tracking-tight">
          ${price}
        </span>
        <span className="text-sm text-muted-foreground">
          {price === 0 ? "forever" : "/ mo"}
        </span>
      </div>
      <p className="mt-1 h-4 font-mono text-[11px] text-primary">
        {plan.highlighted && annual ? "billed annually — save 21%" : " "}
      </p>

      <Button
        className="mt-6"
        nativeButton={false}
        variant={plan.highlighted ? "default" : "outline"}
        render={<a href="#" />}
      >
        {plan.cta}
      </Button>

      <ul className="mt-7 space-y-3">
        {plan.features.map((feature) => (
          <li key={feature} className="flex items-start gap-3 text-sm">
            <span className="mt-0.5 grid size-4 shrink-0 place-items-center rounded-full bg-primary/15 text-primary">
              <Check className="size-3" />
            </span>
            <span className="text-muted-foreground">{feature}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function Pricing() {
  const [annual, setAnnual] = React.useState(true);

  return (
    <section id="pricing" className="scroll-mt-20">
      <div className="mx-auto max-w-5xl px-5 py-20 sm:px-6 lg:py-28">
        <div className="flex flex-col items-center text-center">
          <p className="eyebrow">Pricing</p>
          <h2 className="mt-4 font-display text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
            Simple pricing. Cancel whenever.
          </h2>
          <p className="mt-4 max-w-md text-muted-foreground">
            Start free, upgrade when shorts become a habit.
          </p>

          <div className="mt-8 flex items-center gap-3">
            <span
              className={cn(
                "font-mono text-xs uppercase tracking-[0.15em] transition-colors",
                annual ? "text-muted-foreground" : "text-foreground",
              )}
            >
              Monthly
            </span>
            <Switch
              checked={annual}
              onCheckedChange={(checked) => setAnnual(checked)}
              aria-label="Toggle annual billing"
            />
            <span
              className={cn(
                "font-mono text-xs uppercase tracking-[0.15em] transition-colors",
                annual ? "text-foreground" : "text-muted-foreground",
              )}
            >
              Annual
            </span>
          </div>
        </div>

        <div className="mt-12 grid gap-5 sm:grid-cols-2">
          {PLANS.map((plan) => (
            <PlanCard key={plan.name} plan={plan} annual={annual} />
          ))}
        </div>
      </div>
    </section>
  );
}
