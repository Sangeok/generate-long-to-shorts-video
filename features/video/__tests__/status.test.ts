import { describe, expect, it } from "vitest";

import { isViewUrlExpired, mapStatusToPhase } from "../status";

describe("mapStatusToPhase", () => {
  it("maps pre-finalize statuses to uploading/processing", () => {
    expect(mapStatusToPhase("PENDING")).toBe("uploading");
    expect(mapStatusToPhase("UPLOADING")).toBe("uploading");
    expect(mapStatusToPhase("UPLOADED")).toBe("processing");
    expect(mapStatusToPhase("PROCESSING")).toBe("processing");
  });

  it("maps terminal statuses", () => {
    expect(mapStatusToPhase("READY")).toBe("ready");
    expect(mapStatusToPhase("FAILED")).toBe("failed");
  });
});

describe("isViewUrlExpired", () => {
  const now = new Date("2026-06-08T00:00:00.000Z");

  it("treats null expiry as expired", () => {
    expect(isViewUrlExpired(null, now)).toBe(true);
  });

  it("returns true when expiry is in the past", () => {
    expect(isViewUrlExpired(new Date("2026-06-07T23:59:59.000Z"), now)).toBe(true);
  });

  it("returns false when expiry is in the future", () => {
    expect(isViewUrlExpired(new Date("2026-06-08T01:00:00.000Z"), now)).toBe(false);
  });
});
