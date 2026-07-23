"use client";

import { useEffect, useRef, useState } from "react";

import { getShorts } from "../../api/get-shorts";
import type { ShortRecord } from "../../types";
import { ShortCard } from "./short-card";

interface ShortsSectionProps {
  projectId: string;
  shorts: ShortRecord[];
}

const POLL_INTERVAL_MS = 4000;

function hasPending(shorts: ShortRecord[]): boolean {
  return shorts.some((short) => short.renderStatus.status === "pending");
}

export const ShortsSection = ({
  projectId,
  shorts: initialShorts,
}: ShortsSectionProps) => {
  const [shorts, setShorts] = useState(initialShorts);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Clips render after the project completes, so poll until no short's
  // renderStatus is still "pending".
  useEffect(() => {
    if (!hasPending(shorts)) return;

    let cancelled = false;

    const tick = async () => {
      try {
        const next = await getShorts(projectId);
        if (cancelled) return;
        setShorts(next);
        if (hasPending(next)) {
          timerRef.current = setTimeout(tick, POLL_INTERVAL_MS);
        }
      } catch {
        if (cancelled) return;
        timerRef.current = setTimeout(tick, POLL_INTERVAL_MS);
      }
    };

    timerRef.current = setTimeout(tick, POLL_INTERVAL_MS);

    return () => {
      cancelled = true;
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [projectId, shorts]);

  const readyCount = shorts.filter(
    (short) => short.renderStatus.status === "ready",
  ).length;

  return (
    <section className="flex flex-col gap-6">
      <div className="flex items-baseline justify-between gap-3">
        <p className="eyebrow">Generated shorts</p>
        <span className="font-mono text-[0.625rem] uppercase tracking-[0.2em] text-muted-foreground">
          {readyCount}/{shorts.length} ready
        </span>
      </div>

      {shorts.length === 0 ? (
        <p className="rounded-2xl border border-border bg-card p-6 text-sm text-muted-foreground">
          No shorts were generated for this video.
        </p>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {shorts.map((short, index) => (
            <ShortCard
              key={short.id}
              projectId={projectId}
              short={short}
              rank={index + 1}
            />
          ))}
        </div>
      )}
    </section>
  );
};
