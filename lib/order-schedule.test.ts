import { describe, expect, it } from "vitest";
import { validateOrderSchedule } from "./order-schedule";
import { earliestServiceDate } from "./membership-service-months";
const membership = { status: "active", invoiceStatus: "paid", selectedServiceMonths: ["2026-10", "2026-12"], durationMonths: 2, membershipExpiryDate: "2027-01-01" };
describe("additional order scheduling", () => {
  const now = new Date("2026-10-07T23:59:59+07:00");
  it("uses calendar days rather than 72 elapsed hours", () => { expect(earliestServiceDate(now)).toBe("2026-10-10"); expect(validateOrderSchedule(membership, "2026-10-10", "11:00", now)).toBeNull(); });
  it("advances the minimum at Bangkok midnight", () => { expect(earliestServiceDate(new Date("2026-10-07T17:00:00Z"))).toBe("2026-10-11"); });
  it("rejects short notice, invalid dates, slots and service-month gaps", () => {
    for (const [date,time] of [["2026-10-09","11:00"],["2026-11-01","11:00"],["2026-10-32","11:00"],["2026-10-10","10:00"]]) expect(validateOrderSchedule(membership,date,time,now)).toBeTruthy();
  });
  it.each(["pending_review","expired","cancelled","rejected","inactive"])("rejects %s membership", status => expect(validateOrderSchedule({...membership,status}, "2026-10-10","11:00",now)).toBeTruthy());
  it("requires a paid selected-month agreement", () => expect(validateOrderSchedule({...membership,invoiceStatus:"pending"},"2026-10-10","11:00",now)).toBeTruthy());
});
