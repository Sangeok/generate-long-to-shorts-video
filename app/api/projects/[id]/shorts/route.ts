import { NextResponse } from "next/server";

import {
  getProjectForUser,
  getShortsForProject,
} from "@/features/project/server";
import { getCurrentSession } from "@/lib/auth-server";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getCurrentSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const project = await getProjectForUser(id, session.user.id);
  if (!project) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const shorts = await getShortsForProject(id);
  return NextResponse.json({ shorts });
}
