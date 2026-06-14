import { NextResponse } from "next/server";

import { getShortForUser, presignGetUrl } from "@/features/project/server";
import { getCurrentSession } from "@/lib/auth-server";

export async function GET(
  _request: Request,
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

  const url = await presignGetUrl(short.clipKey);
  return NextResponse.json({ url });
}
