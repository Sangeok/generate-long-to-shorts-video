import { NextResponse } from "next/server";

import { getProjectForUser, updateProjectStatus } from "@/features/project/server";
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
  const project = await getProjectForUser(id, session.user.id);
  if (!project) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await updateProjectStatus(id, "UPLOADED");
  await inngest.send({
    name: "project/video.uploaded",
    data: { projectId: id, userId: session.user.id },
  });

  return NextResponse.json({ ok: true });
}
