import { NextResponse } from "next/server";

import {
  createViewUrl,
  getProjectForUser,
  getViewUrlTtlSeconds,
  saveViewUrl,
} from "@/features/project/server";
import { serializeProject } from "@/features/project/serialize";
import { isViewUrlExpired } from "@/features/project/status";
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
  let project = await getProjectForUser(id, session.user.id);
  if (!project) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (
    project.status === "READY" &&
    isViewUrlExpired(project.viewUrlExpiresAt, new Date())
  ) {
    const viewUrl = await createViewUrl(project.s3Key);
    const expiresAt = new Date(Date.now() + getViewUrlTtlSeconds() * 1000);
    project = await saveViewUrl(id, viewUrl, expiresAt);
  }

  return NextResponse.json(serializeProject(project));
}
