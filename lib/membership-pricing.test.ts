import { describe, expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));
import { membershipPlans, membershipPreferredTimes } from "@/lib/membership-plans";
import { validateMembershipConfiguration } from "@/lib/membership-request";
import { calendarMonths, serviceYears } from "@/lib/membership-service-months";
import { stripeMembershipCatalog, getStripeAmountInMinorUnits } from "@/lib/stripe-membership-catalog";
import { validSavedQuote } from "@/lib/membership-quote-integrity";

// Independent acceptance values from the approved pricing schedule, not runtime pricing data.
const approvedFees = [6000, 11000, 15000, 18000, 20500, 22500, 24000, 25500, 27000, 28000, 29000, 30000];
const months = calendarMonths(serviceYears()[1]);

describe("approved membership fee schedule", () => {
  it("matches all twelve approved totals and durations", () => {
    expect(membershipPlans.map(plan => plan.price)).toEqual(approvedFees);
    expect(membershipPlans.map(plan => plan.durationMonths)).toEqual(Array.from({ length: 12 }, (_, i) => i + 1));
  });

  it("increases every total while reducing every effective monthly rate", () => {
    for (let i = 1; i < membershipPlans.length; i++) {
      const previous = membershipPlans[i - 1], current = membershipPlans[i];
      expect(current.price).toBeGreaterThan(previous.price);
      expect(current.price / current.durationMonths).toBeLessThan(previous.price / previous.durationMonths);
    }
    expect(membershipPlans[11].price / membershipPlans[11].durationMonths).toBe(2500);
  });

  it.each(approvedFees.map((fee, index) => ({ fee, duration: index + 1 })))("uses the approved $duration-month fee in server quotes, saved summaries and the Stripe catalog", ({ fee, duration }) => {
    const plan = membershipPlans[duration - 1];
    const configuration = {
      planSlug: plan.slug, selectedServiceMonths: months.slice(0, duration), purchaseMode: "membership_only",
      foodPreferences: [], deliveryArea: "Bangkok", preferredDay: "Monday", preferredTime: membershipPreferredTimes[0],
      alcoholEnabled: false, selectedProducts: [], selectedAddOns: [],
      price: 1, membershipFee: 1, total: 1,
    };
    const checked = validateMembershipConfiguration(configuration);
    expect(checked.ok).toBe(true);
    if (!checked.ok) throw new Error(checked.error);
    expect(checked).toMatchObject({ membershipFee: fee, total: fee, purchaseSnapshot: { membershipFee: fee, total: fee, plan: { membershipFee: fee } } });
    expect(validSavedQuote(checked.purchaseSnapshot)).toBe(true);
    expect(stripeMembershipCatalog.find(item => item.internalPlanId === plan.slug)?.amount).toBe(fee);
    expect(getStripeAmountInMinorUnits(checked.purchaseSnapshot.membershipFee)).toBe(fee * 100);
    const withPackage = validateMembershipConfiguration({ ...configuration, purchaseMode: "membership_with_package", selectedProducts: [{ category: "Thai soups", name: "Tom Yum Goong", quantity: 4 }] });
    expect(withPackage).toMatchObject({ ok: true, membershipFee: fee, packageSubtotal: 320 * 4 * duration, total: fee + 320 * 4 * duration });
  });
});
