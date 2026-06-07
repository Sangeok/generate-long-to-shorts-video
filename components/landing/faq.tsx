"use client";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const FAQS = [
  {
    q: "What kind of videos work best?",
    a: "Anything talking-heavy — podcasts, interviews, webinars, streams, and vlogs. LongformShorts AI looks for spoken moments with a clear hook and payoff, so the more conversation, the better the clips.",
  },
  {
    q: "How long does a video take to process?",
    a: "Most hour-long videos are fully clipped, captioned, and reframed in a few minutes. Pro accounts render with priority, so it's usually faster.",
  },
  {
    q: "Do I keep the rights to my clips?",
    a: "Always. Your footage and everything LongformShorts AI generates from it is yours to post, edit, and monetize however you like.",
  },
  {
    q: "Can I edit the clips before exporting?",
    a: "Yes. Every clip is editable — trim the timing, restyle captions, adjust the crop, or swap the suggested hook before you export.",
  },
  {
    q: "What happens when my free plan runs out?",
    a: "Nothing breaks. You keep everything you've made; you just can't process new videos until the next month or until you upgrade to Pro.",
  },
] as const;

export function Faq() {
  return (
    <section
      id="faq"
      className="scroll-mt-20 border-t border-border bg-card/30"
    >
      <div className="mx-auto grid max-w-6xl gap-12 px-5 py-20 sm:px-6 lg:grid-cols-[0.8fr_1.2fr] lg:py-28">
        <div>
          <p className="eyebrow">FAQ</p>
          <h2 className="mt-4 font-display text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
            Questions, answered
          </h2>
          <p className="mt-4 text-sm text-muted-foreground">
            Still curious? Reach us at{" "}
            <a
              href="mailto:hello@longformshorts.app"
              className="text-foreground underline underline-offset-4 hover:text-primary"
            >
              hello@longformshorts.app
            </a>
            .
          </p>
        </div>

        <Accordion className="w-full">
          {FAQS.map((item) => (
            <AccordionItem key={item.q} value={item.q}>
              <AccordionTrigger className="font-display text-base font-medium">
                {item.q}
              </AccordionTrigger>
              <AccordionContent className="max-w-prose text-muted-foreground">
                {item.a}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  );
}
