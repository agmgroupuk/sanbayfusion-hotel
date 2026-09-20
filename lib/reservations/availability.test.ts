import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  getAvailableSlots,
  isSlotAvailable,
  validateDate,
} from "./availability";
import { reservationConfig } from "./config";

// "Today" is fixed to Friday 2026-07-10 for every test in this file, so the
// lead/window boundaries below are deterministic:
//   min (leadDays=1)    -> 2026-07-11 (Sat)
//   max (windowDays=60) -> 2026-09-08 (Tue)
beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date(2026, 6, 10));
});

afterEach(() => {
  vi.useRealTimers();
});

describe("validateDate", () => {
  it("rejects a malformed date key", () => {
    expect(validateDate("not-a-date")).toEqual({
      ok: false,
      reason: "Invalid date",
    });
  });

  it("rejects today (inside the lead time)", () => {
    expect(validateDate("2026-07-10").ok).toBe(false);
  });

  it("accepts the earliest bookable date", () => {
    expect(validateDate("2026-07-11")).toEqual({ ok: true });
  });

  it("accepts the last day of the booking window", () => {
    expect(validateDate("2026-09-08")).toEqual({ ok: true });
  });

  it("rejects a date beyond the booking window", () => {
    const result = validateDate("2026-09-09");
    expect(result.ok).toBe(false);
    expect(result.reason).toMatch(/booking window/i);
  });

  it("rejects a closed weekday within the window", () => {
    const result = validateDate("2026-07-12"); // Sunday
    expect(result.ok).toBe(false);
    expect(result.reason).toMatch(/closed/i);
  });
});

describe("getAvailableSlots", () => {
  it("returns every service time when nothing is booked", async () => {
    const slots = await getAvailableSlots("2026-07-11", 4);
    expect(slots).toEqual(reservationConfig.serviceTimes);
  });

  it("returns no slots for a party larger than capacity", async () => {
    const slots = await getAvailableSlots(
      "2026-07-11",
      reservationConfig.maxCoversPerSlot + 1,
    );
    expect(slots).toEqual([]);
  });

  it("returns no slots for an unbookable date", async () => {
    const slots = await getAvailableSlots("2026-07-12", 2); // Sunday, closed
    expect(slots).toEqual([]);
  });
});

describe("isSlotAvailable", () => {
  it("accepts a valid slot within capacity", async () => {
    await expect(isSlotAvailable("2026-07-11", "18:00", 4)).resolves.toBe(
      true,
    );
  });

  it("rejects a time that isn't a real service slot", async () => {
    await expect(isSlotAvailable("2026-07-11", "17:00", 2)).resolves.toBe(
      false,
    );
  });

  it("rejects a party larger than a slot's capacity", async () => {
    await expect(
      isSlotAvailable(
        "2026-07-11",
        "18:00",
        reservationConfig.maxCoversPerSlot + 1,
      ),
    ).resolves.toBe(false);
  });

  it("rejects an unbookable date", async () => {
    await expect(isSlotAvailable("2026-07-12", "18:00", 2)).resolves.toBe(
      false,
    );
  });
});
