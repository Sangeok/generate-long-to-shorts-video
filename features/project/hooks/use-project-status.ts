"use client";

import { useEffect, useRef, useState } from "react";

import { getProjectStatus } from "../api/get-project-status";
import { PROJECT_STATUS_META } from "../project-status";
import type { ProjectStatus } from "../types";

const POLL_INTERVAL_MS = 2000;

export function useProjectStatus(
  projectId: string,
  initialStatus: ProjectStatus,
  initialError: string | null,
) {
  const [status, setStatus] = useState<ProjectStatus>(initialStatus);
  const [error, setError] = useState<string | null>(initialError);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (PROJECT_STATUS_META[initialStatus].terminal) return;

    let cancelled = false;

    const tick = async () => {
      try {
        const next = await getProjectStatus(projectId);
        if (cancelled) return;
        setStatus(next.status);
        setError(next.error);
        if (!PROJECT_STATUS_META[next.status].terminal) {
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
  }, [projectId, initialStatus]);

  return { status, error };
}
