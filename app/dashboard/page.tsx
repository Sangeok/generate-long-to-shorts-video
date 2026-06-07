import type { Metadata } from "next";

import { getCurrentSession } from "@/lib/auth-server";
import { VideoUploader } from "./_components/video-uploader/video-uploader";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Dashboard | LongformShorts AI",
};

export default async function DashboardPage() {
  const session = await getCurrentSession();
  const firstName = session?.user.name?.split(" ")[0] ?? "there";

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-10 px-5 py-12 sm:px-6 sm:py-16">
      <header className="max-w-2xl">
        <p className="eyebrow">Welcome back, {firstName}</p>
        <h1 className="mt-3 font-display text-4xl font-semibold leading-[1.02] tracking-tight text-foreground sm:text-5xl">
          Upload a long video.
          <br />
          Get a reel of shorts.
        </h1>
        <p className="mt-4 text-base text-muted-foreground">
          Drop a full episode, talk, or stream and we&apos;ll find the moments
          worth posting — reframed and ready for vertical.
        </p>
      </header>

      <VideoUploader />
    </div>
  );
}
