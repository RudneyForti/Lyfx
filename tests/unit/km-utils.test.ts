import { describe, it, expect, vi, beforeEach } from "vitest";
import { addBusinessDays } from "@/lib/km-utils";
import * as holidays from "@/lib/holidays";

// Mock the holidays source — unit tests never hit BrasilAPI (backend mock rule)
vi.mock("@/lib/holidays", () => ({
  getHolidays: vi.fn(async () => new Set<string>()),
}));

const mockedGetHolidays = vi.mocked(holidays.getHolidays);

describe("addBusinessDays", () => {
  beforeEach(() => {
    mockedGetHolidays.mockClear();
    mockedGetHolidays.mockResolvedValue(new Set());
  });

  it("adds business days within the same week", async () => {
    // Monday 2026-07-06 + 2 business days → Wednesday 2026-07-08
    const result = await addBusinessDays(new Date(2026, 6, 6), 2);
    expect(result.getDay()).toBe(3);
    expect(result.getDate()).toBe(8);
  });

  it("skips weekends (Friday + 5 lands on next Friday)", async () => {
    // Friday 2026-07-03 + 5 business days → Friday 2026-07-10
    const result = await addBusinessDays(new Date(2026, 6, 3), 5);
    expect(result.getDay()).toBe(5);
    expect(result.getDate()).toBe(10);
  });

  it("never lands on a Saturday or Sunday", async () => {
    for (let d = 1; d <= 7; d++) {
      const result = await addBusinessDays(new Date(2026, 6, d), 5);
      expect(result.getDay()).not.toBe(0);
      expect(result.getDay()).not.toBe(6);
    }
  });

  it("skips national holidays returned by the provider", async () => {
    // Tuesday 2026-07-07 is a mocked holiday: Monday 06 + 1 → Wednesday 08
    mockedGetHolidays.mockResolvedValue(new Set(["2026-07-07"]));
    const result = await addBusinessDays(new Date(2026, 6, 6), 1);
    expect(result.getDate()).toBe(8);
  });

  it("falls back to weekend-only when the holiday provider fails", async () => {
    mockedGetHolidays.mockResolvedValue(new Set()); // graceful fallback contract
    const result = await addBusinessDays(new Date(2026, 6, 6), 1);
    expect(result.getDate()).toBe(7);
  });

  it("treats invalid day counts as zero", async () => {
    const start = new Date(2026, 6, 6);
    expect((await addBusinessDays(start, NaN)).getTime()).toBe(start.getTime());
    expect((await addBusinessDays(start, -3)).getTime()).toBe(start.getTime());
  });

  it("crosses year boundaries and loads both years' holidays", async () => {
    // Wednesday 2026-12-30 + 3 business days crosses into 2027
    const result = await addBusinessDays(new Date(2026, 11, 30), 3);
    expect(result.getFullYear()).toBe(2027);
    expect(mockedGetHolidays).toHaveBeenCalledWith(2026);
    expect(mockedGetHolidays).toHaveBeenCalledWith(2027);
  });
});
