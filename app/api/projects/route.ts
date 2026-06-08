import { NextResponse } from "next/server";

import { buildS3Key } from "@/features/project/s3-key";
import { createProject, createUploadUrl } from "@/features/project/server";
import { getCurrentSession } from "@/lib/auth-server";

export const runtime = "nodejs";

interface CreateProjectBody {
  filename: string;
  contentType: string;
  sizeBytes: number;
  durationSeconds?: number | null;
  width?: number | null;
  height?: number | null;
}

export async function POST(request: Request) {
  const session = await getCurrentSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json()) as CreateProjectBody;
  if (!body.filename || !body.contentType || !body.sizeBytes) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }
  if (!body.contentType.startsWith("video/")) {
    return NextResponse.json(
      { error: "Only video uploads are allowed" },
      { status: 400 },
    );
  }

  const userId = session.user.id;
  const projectId = crypto.randomUUID();
  const key = buildS3Key(userId, projectId, body.filename);

  await createProject({
    id: projectId,
    userId,
    title: body.filename,
    originalFilename: body.filename,
    s3Key: key,
    contentType: body.contentType,
    sizeBytes: BigInt(body.sizeBytes),
    durationSeconds: body.durationSeconds ?? null,
    width: body.width ?? null,
    height: body.height ?? null,
  });

  const uploadUrl = await createUploadUrl(key, body.contentType);

  return NextResponse.json({ projectId, uploadUrl, key });
}
