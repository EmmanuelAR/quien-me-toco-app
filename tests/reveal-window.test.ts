import { describe, expect, it } from "vitest";
import { calendarDayKey, canRevealNow } from "@/lib/time/reveal";

describe("canRevealNow", () => {
  it("permite revelar el mismo día del evento (CR)", () => {
    // 29 oct 2026 18:00 CR = 29 oct 2026 00:00 UTC+0... CR is UTC-6 → 29 oct 2026 00:00 CR = 06:00 UTC
    const eventAt = new Date("2026-10-29T20:00:00-06:00");
    const morning = new Date("2026-10-29T08:00:00-06:00");
    expect(canRevealNow(eventAt, morning)).toBe(true);
  });

  it("bloquea el día anterior", () => {
    const eventAt = new Date("2026-10-29T20:00:00-06:00");
    const dayBefore = new Date("2026-10-28T23:00:00-06:00");
    expect(canRevealNow(eventAt, dayBefore)).toBe(false);
  });

  it("calendarDayKey es YYYY-MM-DD estable", () => {
    expect(calendarDayKey(new Date("2026-12-24T15:00:00-06:00"))).toBe("2026-12-24");
  });
});
