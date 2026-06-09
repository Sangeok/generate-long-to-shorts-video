import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";

import { TranscriptionProgress } from "@/features/project";
import type { CaptionSegment, ProjectStatus } from "@/features/project";
import { getProjectForUser } from "@/features/project/server";
import { getCurrentSession } from "@/lib/auth-server";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Project | LongformShorts AI",
};

function formatDuration(seconds: number | null): string {
  if (!seconds || !Number.isFinite(seconds)) return "--:--";
  const total = Math.floor(seconds);
  const minutes = Math.floor(total / 60);
  const remaining = total % 60;
  return `${String(minutes).padStart(2, "0")}:${String(remaining).padStart(2, "0")}`;
}

export default async function ProjectPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await getCurrentSession();
  if (!session) {
    redirect("/sign-in");
  }

  const { id } = await params;
  const project = await getProjectForUser(id, session.user.id);
  if (!project) {
    notFound();
  }

  const segments =
    (project.segments as unknown as CaptionSegment[] | null) ?? null;

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-10 px-5 py-12 sm:px-6 sm:py-16">
      <header className="max-w-2xl">
        <p className="eyebrow">Generating shorts</p>
        <h1 className="mt-3 truncate font-display text-3xl font-semibold leading-[1.05] tracking-tight text-foreground sm:text-4xl">
          {project.title}
        </h1>
        <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1 font-mono text-[0.625rem] uppercase tracking-[0.2em] text-muted-foreground">
          <span>Duration {formatDuration(project.durationSec)}</span>
          {project.width && project.height && (
            <span>
              {project.width} × {project.height}
            </span>
          )}
        </div>
      </header>

      <TranscriptionProgress
        projectId={project.id}
        initialStatus={project.status as ProjectStatus}
        initialError={project.error}
        segments={segments}
      />
    </div>
  );
}
