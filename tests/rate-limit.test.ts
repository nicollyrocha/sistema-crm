import { describe, it, expect } from "vitest";
import { isRateLimited } from "@/lib/rate-limit";

describe("isRateLimited", () => {
  const now = new Date("2026-09-07T12:00:00Z");

  it("returns false when there are no prior submissions", () => {
    expect(isRateLimited([], now)).toBe(false);
  });

  it("returns false when under the limit within the window", () => {
    const timestamps = [
      new Date("2026-09-07T11:50:00Z"),
      new Date("2026-09-07T11:55:00Z"),
    ];
    expect(isRateLimited(timestamps, now)).toBe(false);
  });

  it("returns true when at the limit within the window", () => {
    const timestamps = [
      new Date("2026-09-07T11:10:00Z"),
      new Date("2026-09-07T11:20:00Z"),
      new Date("2026-09-07T11:30:00Z"),
      new Date("2026-09-07T11:40:00Z"),
      new Date("2026-09-07T11:50:00Z"),
    ];
    expect(isRateLimited(timestamps, now)).toBe(true);
  });

  it("returns false when just under the limit within the window", () => {
    const timestamps = [
      new Date("2026-09-07T11:10:00Z"),
      new Date("2026-09-07T11:20:00Z"),
      new Date("2026-09-07T11:30:00Z"),
      new Date("2026-09-07T11:40:00Z"),
    ];
    expect(isRateLimited(timestamps, now)).toBe(false);
  });

  it("ignores submissions older than the one-hour window", () => {
    const timestamps = [
      new Date("2026-09-07T10:00:00Z"), // 2 hours ago — outside window
      new Date("2026-09-07T09:00:00Z"), // 3 hours ago — outside window
    ];
    expect(isRateLimited(timestamps, now)).toBe(false);
  });

  it("counts a submission exactly at the window boundary as within the window", () => {
    const timestamps = new Array(5).fill(null).map(() => new Date("2026-09-07T11:00:00Z")); // exactly 1 hour ago
    expect(isRateLimited(timestamps, now)).toBe(true);
  });
});
