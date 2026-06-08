import { describe, expect, it } from "vitest";

import type { Project } from "@/generated/prisma/client";

import { serializeProject } from "../serialize";

const base: Project = {
  id: "proj_1",
  userId: "user_1",
  title: "clip.mp4",
  originalFilename: "clip.mp4",
  s3Key: "uploads/user_1/proj_1/clip.mp4",
  contentType: "video/mp4",
  sizeBytes: 3_221_225_472n,
  durationSeconds: 12.5,
  width: 1920,
  height: 1080,
  status: "READY",
  viewUrl: "https://signed.example/clip.mp4",
  viewUrlExpiresAt: new Date("2026-06-15T00:00:00.000Z"),
  error: null,
  createdAt: new Date("2026-06-08T00:00:00.000Z"),
  updatedAt: new Date("2026-06-08T00:01:00.000Z"),
};

describe("serializeProject", () => {
  it("stringifies bigint size and ISO-formats dates", () => {
    const dto = serializeProject(base);
    expect(dto.sizeBytes).toBe("3221225472");
    expect(dto.createdAt).toBe("2026-06-08T00:00:00.000Z");
    expect(dto.updatedAt).toBe("2026-06-08T00:01:00.000Z");
  });

  it("passes through nullable fields and status", () => {
    const dto = serializeProject({ ...base, viewUrl: null, durationSeconds: null });
    expect(dto.viewUrl).toBeNull();
    expect(dto.durationSeconds).toBeNull();
    expect(dto.status).toBe("READY");
  });

  it("does not expose internal fields (s3Key, viewUrlExpiresAt, userId)", () => {
    const dto = serializeProject(base) as unknown as Record<string, unknown>;
    expect(dto.s3Key).toBeUndefined();
    expect(dto.viewUrlExpiresAt).toBeUndefined();
    expect(dto.userId).toBeUndefined();
  });
});
