import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { VideoLibrary, VideoLibraryEmpty } from "@/features/project";
import { getProjectsForUser } from "@/features/project/server";
import { getCurrentSession } from "@/lib/auth-server";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "My Videos | LongformShorts AI",
};

export default async function VideosPage() {
  const session = await getCurrentSession();
  if (!session) {
    redirect("/sign-in");
  }

  const projects = await getProjectsForUser(session.user.id);

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-10 px-5 py-12 sm:px-6 sm:py-16">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow">Your library</p>
          <h1 className="mt-3 font-display text-4xl font-semibold leading-[1.02] tracking-tight text-foreground sm:text-5xl">
            My Videos
          </h1>
        </div>
        {projects.length > 0 && (
          <span className="font-mono text-[0.625rem] uppercase tracking-[0.2em] text-muted-foreground">
            {projects.length} {projects.length === 1 ? "video" : "videos"}
          </span>
        )}
      </header>

      {projects.length === 0 ? (
        <VideoLibraryEmpty />
      ) : (
        <VideoLibrary projects={projects} />
      )}
    </div>
  );
}
