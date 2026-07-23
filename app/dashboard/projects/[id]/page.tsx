import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";

import {
  formatTimecode,
  parseSegmentsOrNull,
  ShortsSection,
  TranscriptionProgress,
} from "@/features/project";
import type { ProjectStatus } from "@/features/project";
import {
  getProjectForUser,
  getShortsForProject,
} from "@/features/project/server";
import { getCurrentSession } from "@/lib/auth-server";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Project | LongformShorts AI",
};

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

  const status = project.status as ProjectStatus;
  const segments = parseSegmentsOrNull(project.segments);
  const shorts =
    status === "completed" ? await getShortsForProject(project.id) : [];
  const hasPendingClips = shorts.some(
    (short) => short.renderStatus.status === "pending",
  );
  const eyebrow =
    status !== "completed"
      ? "Generating shorts"
      : hasPendingClips
        ? "Rendering clips"
        : "Shorts ready";

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-10 px-5 py-12 sm:px-6 sm:py-16">
      <header className="max-w-2xl">
        <p className="eyebrow">{eyebrow}</p>
        <h1 className="mt-3 truncate font-display text-3xl font-semibold leading-[1.05] tracking-tight text-foreground sm:text-4xl">
          {project.title}
        </h1>
        <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1 font-mono text-[0.625rem] uppercase tracking-[0.2em] text-muted-foreground">
          <span>Duration {formatTimecode(project.durationSec)}</span>
          {project.width != null && project.height != null && (
            <span>
              {project.width} × {project.height}
            </span>
          )}
        </div>
      </header>

      {status === "completed" ? (
        <ShortsSection projectId={project.id} shorts={shorts} />
      ) : (
        <TranscriptionProgress
          projectId={project.id}
          initialStatus={status}
          initialError={project.error}
          segments={segments}
        />
      )}
    </div>
  );
}
