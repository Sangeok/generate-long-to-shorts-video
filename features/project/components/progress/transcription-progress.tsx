"use client";

import { AlertTriangle, Check, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useRef } from "react";

import { cn } from "@/lib/utils";

import { useProjectStatus } from "../../hooks/use-project-status";
import type { CaptionSegment, ProjectStatus } from "../../types";
import { TranscriptPreview } from "./transcript-preview";

type StepState = "done" | "active" | "pending" | "failed";

interface StepDef {
  label: string;
  description: string;
}

const STEPS: StepDef[] = [
  { label: "Uploaded", description: "Your video is safely stored." },
  {
    label: "Transcribing",
    description: "Deepgram is transcribing the audio and building captions.",
  },
  {
    label: "Transcription ready",
    description: "Transcript and captions are ready.",
  },
  {
    label: "Finding best moments",
    description: "Gemini is scoring the most engaging moments for shorts.",
  },
  {
    label: "Shorts ready",
    description: "Your short-video moments are ready.",
  },
];

function computeStepStates(status: ProjectStatus): StepState[] {
  switch (status) {
    case "uploaded":
      return ["done", "pending", "pending", "pending", "pending"];
    case "transcribing":
      return ["done", "active", "pending", "pending", "pending"];
    case "transcribed":
      return ["done", "done", "done", "pending", "pending"];
    case "generating_shorts":
      return ["done", "done", "done", "active", "pending"];
    case "completed":
      return ["done", "done", "done", "done", "done"];
    case "failed":
      return ["done", "failed", "pending", "pending", "pending"];
  }
}

const StepIndicator = ({ state }: { state: StepState }) => {
  if (state === "done") {
    return (
      <span className="grid size-8 place-items-center rounded-full bg-primary text-primary-foreground">
        <Check className="size-4" />
      </span>
    );
  }
  if (state === "active") {
    return (
      <span className="grid size-8 place-items-center rounded-full border border-primary/60 text-primary">
        <Loader2 className="size-4 animate-spin" />
      </span>
    );
  }
  if (state === "failed") {
    return (
      <span className="grid size-8 place-items-center rounded-full bg-destructive/15 text-destructive">
        <AlertTriangle className="size-4" />
      </span>
    );
  }
  return (
    <span className="grid size-8 place-items-center rounded-full border border-border text-muted-foreground">
      <span className="size-1.5 rounded-full bg-current" />
    </span>
  );
};

interface TranscriptionProgressProps {
  projectId: string;
  initialStatus: ProjectStatus;
  initialError: string | null;
  segments: CaptionSegment[] | null;
}

export const TranscriptionProgress = ({
  projectId,
  initialStatus,
  initialError,
  segments,
}: TranscriptionProgressProps) => {
  const router = useRouter();
  const { status, error } = useProjectStatus(
    projectId,
    initialStatus,
    initialError,
  );
  const refreshedRef = useRef(false);
  const completedRef = useRef(false);
  const transcriptReady =
    status === "transcribed" ||
    status === "generating_shorts" ||
    status === "completed";

  useEffect(() => {
    if (transcriptReady && !segments && !refreshedRef.current) {
      refreshedRef.current = true;
      router.refresh();
    }
  }, [transcriptReady, segments, router]);

  // Once shorts are ready, re-render the server page so it swaps the progress
  // view for the generated shorts.
  useEffect(() => {
    if (status === "completed" && !completedRef.current) {
      completedRef.current = true;
      router.refresh();
    }
  }, [status, router]);

  const states = computeStepStates(status);

  return (
    <div className="flex flex-col gap-6">
      <ol className="flex flex-col rounded-2xl border border-border bg-card p-6">
        {STEPS.map((step, index) => {
          const state = states[index];
          const isLast = index === STEPS.length - 1;
          return (
            <li key={step.label} className="flex gap-4">
              <div className="flex flex-col items-center">
                <StepIndicator state={state} />
                {!isLast && (
                  <span
                    className={cn(
                      "my-1 w-px flex-1",
                      state === "done" ? "bg-primary/40" : "bg-border",
                    )}
                  />
                )}
              </div>
              <div className={cn("pb-8", isLast && "pb-0")}>
                <p
                  className={cn(
                    "font-display text-lg font-semibold tracking-tight",
                    state === "pending" && "text-muted-foreground",
                    state === "failed" && "text-destructive",
                  )}
                >
                  {step.label}
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {state === "failed"
                    ? (error ?? "Something went wrong during transcription.")
                    : step.description}
                </p>
              </div>
            </li>
          );
        })}
      </ol>

      {transcriptReady && segments && <TranscriptPreview segments={segments} />}
    </div>
  );
};
