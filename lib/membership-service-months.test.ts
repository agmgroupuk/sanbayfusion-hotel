import { describe, expect, it } from "vitest";
import { calendarMonths, isEligibleServiceMonth, serviceMonthState, validateServiceMonths } from "./membership-service-months";
import { hasActiveMembership, hasOngoingMembership, membershipDisplayStatus } from "./membership-term";
import { membershipPlans } from "./membership-plans";
import { validateMembershipConfiguration } from "./membership-request";

const now = new Date("2026-10-02T12:00:00+07:00");
const months = ["2027-02", "2027-07", "2027-11"];
describe("selected calendar service months", () => {
  it.each(membershipPlans)("requires exactly $durationMonths unique months for $name", plan => {
    const selected = calendarMonths(2027).slice(0, plan.durationMonths);
    expect(validateServiceMonths(selected, plan.durationMonths, now)).toBeNull();
    expect(validateServiceMonths(selected.slice(1), plan.durationMonths, now)).toBeTruthy();
    expect(validateServiceMonths([...selected, selected[0]], plan.durationMonths, now)).toBeTruthy();
  });
  it.each([["2027-02", "2027-02", "2027-11"], ["2027-00", "2027-13", "2027-11"], ["February", "July", "November"], ["2026-09", "2026-11", "2026-12"], ["2027-02", "2028-07", "2028-11"], ["2028-02", "2028-07", "2028-11"]])("rejects ambiguous, duplicate, past or unavailable months: %s", (...selected) => {
    expect(validateServiceMonths(selected, 3, now)).toBeTruthy();
  });
  it("uses Bangkok boundaries and the three-day scheduling rule", () => {
    expect(isEligibleServiceMonth("2026-10", new Date("2026-10-28T12:00:00+07:00"))).toBe(true);
    expect(isEligibleServiceMonth("2026-10", new Date("2026-10-29T00:00:00+07:00"))).toBe(false);
    expect(isEligibleServiceMonth("2026-11", new Date("2026-10-29T00:00:00+07:00"))).toBe(true);
    expect(serviceMonthState("2027-02", new Date("2027-01-31T16:59:59Z"))).toBe("UPCOMING");
    expect(serviceMonthState("2027-02", new Date("2027-01-31T17:00:00Z"))).toBe("CURRENT");
  });
  it("blocks repurchase between selected months while denying month-specific access", () => {
    const term = { status: "active", invoiceStatus: "paid", selectedServiceMonths: months, durationMonths: 3, membershipExpiryDate: "2027-12-01" };
    for (let month = 1; month <= 12; month++) {
      const date = new Date(`2027-${String(month).padStart(2, "0")}-15T12:00:00+07:00`);
      expect(hasActiveMembership(term, date)).toBe([2, 7, 11].includes(month));
      expect(hasOngoingMembership(term, date)).toBe(month < 12);
    }
    expect(membershipDisplayStatus(term, new Date("2027-03-01"))).toBe("SCHEDULED");
    expect(hasActiveMembership({ ...term, invoiceStatus: "awaiting_payment" }, new Date("2027-02-15"))).toBe(false);
    expect(hasActiveMembership({ ...term, selectedServiceMonths: null, purchaseSnapshot: { version: 4 } }, new Date("2027-02-15"))).toBe(false);
  });
  it.each(membershipPlans)("includes the correct benefit without increasing $name prices", plan => {
    const result = validateMembershipConfiguration({ planSlug: plan.slug, selectedServiceMonths: calendarMonths(2027).slice(0, plan.durationMonths), purchaseMode: "membership_only", foodPreferences: [], deliveryArea: "Bangkok", preferredDay: "Monday", preferredTime: "09:00–12:00", alcoholEnabled: false, selectedAddOns: [], selectedProducts: [], includedBenefit: { menuValue: 1000000 } }, now);
    expect(result).toMatchObject({ ok: true, total: plan.price, packageSubtotal: 0, purchaseSnapshot: { includedBenefit: { menuValue: 1500 + plan.durationMonths * 500, cashValue: 0, quantityPerServiceMonth: 1 }, products: [], addOns: [] } });
  });
});
