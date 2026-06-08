import { describe, expect, it } from "vitest";

import { buildS3Key, sanitizeFilename } from "../s3-key";

describe("sanitizeFilename", () => {
  it("lowercases and replaces spaces/special chars with single hyphen", () => {
    expect(sanitizeFilename("My Cool Video!!.MP4")).toBe("my-cool-video.mp4");
  });

  it("collapses repeated separators and trims edges", () => {
    expect(sanitizeFilename("  __weird   name__ .mov ")).toBe("weird-name.mov");
  });

  it("falls back to 'video' when nothing usable remains", () => {
    expect(sanitizeFilename("***")).toBe("video");
  });
});

describe("buildS3Key", () => {
  it("namespaces by user and project id", () => {
    expect(buildS3Key("user_1", "proj_2", "Clip One.mp4")).toBe(
      "uploads/user_1/proj_2/clip-one.mp4",
    );
  });
});
