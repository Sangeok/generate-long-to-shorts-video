import { NextResponse } from "next/server";

import { getVideoForUser, updateVideoStatus } from "@/features/video/server";
import { getCurrentSession } from "@/lib/auth-server";
import { inngest } from "@/lib/inngest";

export const runtime = "nodejs";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getCurrentSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const video = await getVideoForUser(id, session.user.id);
  if (!video) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // Only finalize an upload that is still in its pre-processing window. Guards
  // against double-submits re-firing the pipeline on an already-processing/ready video.
  if (video.status !== "PENDING" && video.status !== "UPLOADING") {
    return NextResponse.json({ ok: true, alreadyStarted: true });
  }

  await updateVideoStatus(id, "UPLOADED");
  await inngest.send({
    name: "video/uploaded",
    data: { videoId: id, userId: session.user.id },
  });

  return NextResponse.json({ ok: true });
}
