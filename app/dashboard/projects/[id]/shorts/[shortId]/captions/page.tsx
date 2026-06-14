import { ArrowLeft } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { CaptionEditor, parseCaptionStyle } from "@/features/project";
import type { CaptionSegment } from "@/features/project";
import { getShortDetailForUser } from "@/features/project/server";
import { getCurrentSession } from "@/lib/auth-server";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Edit captions | LongformShorts AI",
};

export default async function CaptionsPage({
  params,
}: {
  params: Promise<{ id: string; shortId: string }>;
}) {
  const session = await getCurrentSession();
  if (!session) {
    redirect("/sign-in");
  }

  const { id, shortId } = await params;
  const short = await getShortDetailForUser(shortId, session.user.id);
  if (!short || short.projectId !== id) {
    notFound();
  }

  const segments = short.segments as unknown as CaptionSegment[];

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-10 px-5 py-12 sm:px-6 sm:py-16">
      <header className="max-w-2xl">
        <Link
          href={`/dashboard/projects/${id}`}
          className="inline-flex items-center gap-1.5 font-mono text-[0.625rem] uppercase tracking-[0.2em] text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="size-3" />
          Back to project
        </Link>
        <p className="eyebrow mt-6">Edit captions</p>
        <h1 className="mt-3 truncate font-display text-3xl font-semibold leading-[1.05] tracking-tight text-foreground sm:text-4xl">
          {short.title}
        </h1>
        <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
          Changes preview instantly in the player. Captions are burned into the
          clip when you download it.
        </p>
      </header>

      <CaptionEditor
        projectId={id}
        shortId={short.id}
        segments={segments}
        captionStyle={parseCaptionStyle(short.captionStyle)}
      />
    </div>
  );
}
