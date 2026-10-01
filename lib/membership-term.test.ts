import { describe, expect, it } from "vitest";
import { membershipPlans } from "./membership-plans";
import { hasActiveMembership, membershipTerm } from "./membership-term";

describe("duration memberships", () => {
  it("offers exactly the twelve authoritative terms and fees with distinct IDs", () => {
    expect(membershipPlans.map(p => p.durationMonths)).toEqual([1,2,3,4,5,6,7,8,9,10,11,12]);
    expect(membershipPlans.map(p => p.price)).toEqual([6000,11000,15000,19000,23000,27000,31000,35000,39000,43000,47000,50000]);
    expect(new Set(membershipPlans.map(p => p.id)).size).toBe(12);
  });
  it.each(membershipPlans)("starts $name at activation and expires after its calendar duration", plan => {
    const term = membershipTerm(new Date("2026-10-10T09:00:00+07:00"), plan.durationMonths);
    expect(term.startDate).toBe("2026-10-10");
    expect(term.expiryDate).toBe(new Date(Date.UTC(2026, 9 + plan.durationMonths, 10)).toISOString().slice(0,10));
  });
  it("clamps month ends, including leap years", () => {
    expect(membershipTerm(new Date("2027-01-31T12:00:00+07:00"), 1).expiryDate).toBe("2027-02-28");
    expect(membershipTerm(new Date("2028-01-31T12:00:00+07:00"), 1).expiryDate).toBe("2028-02-29");
    expect(membershipTerm(new Date("2028-02-29T12:00:00+07:00"), 12).expiryDate).toBe("2029-02-28");
  });
  it("denies ordering at the Bangkok expiry boundary even with a stale active status", () => {
    const term = { status: "active", membershipExpiryDate: "2026-11-10" };
    expect(hasActiveMembership(term, new Date("2026-11-09T16:59:59Z"))).toBe(true);
    expect(hasActiveMembership(term, new Date("2026-11-09T17:00:00Z"))).toBe(false);
    expect(hasActiveMembership({ ...term, status: "payment_received" }, new Date("2026-10-10"))).toBe(false);
    expect(hasActiveMembership({ status: "active", membershipExpiryDate: null })).toBe(false);
  });
});
