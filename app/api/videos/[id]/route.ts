import { NextResponse } from "next/server";

import {
  createViewUrl,
  getVideoForUser,
  getViewUrlTtlSeconds,
  saveViewUrl,
} from "@/features/video/server";
import { serializeVideo } from "@/features/video/serialize";
import { isViewUrlExpired } from "@/features/video/status";
import { getCurrentSession } from "@/lib/auth-server";

export const runtime = "nodejs";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getCurrentSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  let video = await getVideoForUser(id, session.user.id);
  if (!video) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (
    video.status === "READY" &&
    isViewUrlExpired(video.viewUrlExpiresAt, new Date())
  ) {
    const viewUrl = await createViewUrl(video.s3Key);
    const expiresAt = new Date(Date.now() + getViewUrlTtlSeconds() * 1000);
    video = await saveViewUrl(id, viewUrl, expiresAt);
  }

  return NextResponse.json(serializeVideo(video));
}
