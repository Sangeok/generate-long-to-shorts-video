import { NextResponse } from "next/server";

import {
  getShortForUser,
  presignDownloadUrl,
  presignGetUrl,
} from "@/features/project/server";
import { getCurrentSession } from "@/lib/auth-server";

function downloadFilename(title: string): string {
  const slug =
    title
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9.-]+/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-+|-+$/g, "") || "short";
  return `${slug}.mp4`;
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string; shortId: string }> },
) {
  const session = await getCurrentSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { shortId } = await params;
  const short = await getShortForUser(shortId, session.user.id);
  if (!short || !short.clipKey) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const download = new URL(request.url).searchParams.get("download") === "1";
  const url = download
    ? await presignDownloadUrl(short.clipKey, downloadFilename(short.title))
    : await presignGetUrl(short.clipKey);

  return NextResponse.json({ url });
}
