import { describe, it, expect } from "vitest";
import { parseLocalDate } from "@/lib/dates";

describe("parseLocalDate", () => {
  it("parses YYYY-MM-DD as a LOCAL date (not UTC)", () => {
    const d = parseLocalDate("2026-07-01");
    expect(d.getFullYear()).toBe(2026);
    expect(d.getMonth()).toBe(6);   // July, local
    expect(d.getDate()).toBe(1);    // day 1 — never shifts to June 30
    expect(d.getHours()).toBe(0);
  });

  it("keeps day 1 of a month inside that month in any timezone", () => {
    // The regression: new Date("2026-07-01") in UTC-3 lands on June 30 21:00
    const naive = new Date("2026-07-01");
    const fixed = parseLocalDate("2026-07-01");
    expect(fixed.getMonth()).toBe(6);
    // Documents the difference when running in a negative-offset timezone
    if (naive.getTimezoneOffset() > 0) expect(naive.getDate()).not.toBe(1);
  });

  it("passes datetime strings through to the native parser", () => {
    const iso = "2026-07-01T15:30:00.000Z";
    expect(parseLocalDate(iso).getTime()).toBe(new Date(iso).getTime());
  });
});
