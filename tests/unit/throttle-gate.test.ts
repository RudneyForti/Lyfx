import { describe, it, expect, vi, afterEach } from "vitest";
import { shouldRun } from "@/lib/throttle-gate";

describe("shouldRun", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("allows the first call for a key", () => {
    expect(shouldRun("first-call-key", 60_000)).toBe(true);
  });

  it("blocks a second call inside the cooldown window", () => {
    shouldRun("cooldown-key", 60_000);
    expect(shouldRun("cooldown-key", 60_000)).toBe(false);
  });

  it("allows again after the cooldown expires", () => {
    vi.useFakeTimers();
    shouldRun("expiry-key", 60_000);
    vi.advanceTimersByTime(60_001);
    expect(shouldRun("expiry-key", 60_000)).toBe(true);
  });

  it("tracks keys independently", () => {
    shouldRun("key-a", 60_000);
    expect(shouldRun("key-b", 60_000)).toBe(true);
  });
});
