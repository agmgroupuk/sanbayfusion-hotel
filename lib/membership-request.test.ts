import { describe, expect, it } from "vitest";
import { calendarMonths, serviceYears } from "@/lib/membership-service-months";
const eligibleMonths = calendarMonths(serviceYears()[1]);
import { beverageAddOns, membershipPlans } from "@/lib/membership-plans";
import { catalogueCategories } from "@/lib/catalogue";
import { buildMembershipDeliverySchedule } from "@/lib/membership-delivery";
import { pricePackageItem } from "@/lib/package-pricing";
import { calculateMembershipQuote, validateMembershipConfiguration, type MembershipConfiguration, type MembershipPurchaseSnapshot } from "@/lib/membership-request";

const base: MembershipConfiguration = {
  planSlug: "3-month-membership", selectedServiceMonths: eligibleMonths.slice(0, 3), purchaseMode: "membership_only", foodPreferences: [],
  deliveryArea: "Bangkok", preferredDay: "Monday", preferredTime: "09:00–12:00",
  alcoholEnabled: false, selectedAddOns: [], selectedProducts: [],
};
const soup = { category: "Thai soups", name: "Tom Yum Goong", quantity: 4 };

describe("membership package pricing", () => {
  it.each(membershipPlans)("charges only $price for $name without a prepaid package", plan => {
    const result = validateMembershipConfiguration({ ...base, planSlug: plan.slug, selectedServiceMonths: eligibleMonths.slice(0, plan.durationMonths) });
    expect(result).toMatchObject({ ok: true, total: plan.price, packageSubtotal: 0, purchaseSnapshot: { version: 4, products: [], addOns: [] } });
  });
  it.each(membershipPlans)("prices monthly products for the actual $durationMonths month term", plan => {
    const result = validateMembershipConfiguration({ ...base, planSlug: plan.slug, selectedServiceMonths: eligibleMonths.slice(0, plan.durationMonths), purchaseMode: "membership_with_package", selectedProducts: [soup] });
    expect(result).toMatchObject({ ok: true, total: plan.price + 320 * 4 * plan.durationMonths });
    if (!result.ok) return;
    expect(result.purchaseSnapshot.products[0]).toMatchObject({ unitPrice: 320, monthlyQuantity: 4, durationMonths: plan.durationMonths, totalTermQuantity: 4 * plan.durationMonths, lineTotal: 320 * 4 * plan.durationMonths, pricingType: "MONTHLY" });
    expect(result.purchaseSnapshot.delivery).not.toHaveProperty("deliveriesPerMonth");
    expect(result.purchaseSnapshot.products[0]).not.toHaveProperty("annualQuantity");
  });
  it("matches the supplied food and beverage examples", () => {
    expect(pricePackageItem(200, 4, 3, "MONTHLY")).toEqual({ totalTermQuantity: 12, lineTotal: 2400 });
    expect(pricePackageItem(60, 12, 6, "MONTHLY")).toEqual({ totalTermQuantity: 72, lineTotal: 4320 });
    expect(pricePackageItem(1500, 1, 3, "ONE_TIME")).toEqual({ totalTermQuantity: 1, lineTotal: 1500 });
  });
  it("uses the authoritative add-on pricing type", () => {
    const addon = beverageAddOns[0];
    const original = addon.pricingType;
    try {
      const config = { ...base, purchaseMode: "membership_with_package" as const, selectedAddOns: [{ category: addon.category, name: addon.options[0], quantity: 2 }] };
      addon.pricingType = "ONE_TIME";
      const once = calculateMembershipQuote(config, membershipPlans[2]);
      expect(once.packageSubtotal).toBe(addon.price * 2);
      expect(once.purchaseSnapshot.addOns[0]).toMatchObject({ pricingType: "ONE_TIME", totalTermQuantity: 2 });
      addon.pricingType = "MONTHLY";
      const monthly = calculateMembershipQuote(config, membershipPlans[2]);
      expect(monthly.packageSubtotal).toBe(addon.price * 2 * 3);
      expect(monthly.purchaseSnapshot.addOns[0]).toMatchObject({ pricingType: "MONTHLY", monthlyQuantity: 2, durationMonths: 3, totalTermQuantity: 6 });
    } finally { addon.pricingType = original; }
  });
  it("ignores browser prices, duration and totals", () => {
    const result = validateMembershipConfiguration({ ...base, purchaseMode: "membership_with_package", durationMonths: 99, total: 1, selectedProducts: [{ ...soup, unitPrice: 1, lineTotal: 1, pricingType: "ONE_TIME" }] });
    expect(result).toMatchObject({ ok: true, total: 18840, purchaseSnapshot: { plan: { durationMonths: 3 }, products: [{ unitPrice: 320, lineTotal: 3840 }] } });
  });
  it.each([0, -1, 1.5, 101, "4", null])("rejects invalid quantity %s on the server", quantity => {
    expect(validateMembershipConfiguration({ ...base, purchaseMode: "membership_with_package", selectedProducts: [{ ...soup, quantity }] }).ok).toBe(false);
  });
  it("rejects removed plans, duplicate and unknown products and empty packages", () => {
    expect(validateMembershipConfiguration({ ...base, planSlug: "starter" }).ok).toBe(false);
    expect(validateMembershipConfiguration({ ...base, selectedProducts: [soup, soup] }).ok).toBe(false);
    expect(validateMembershipConfiguration({ ...base, selectedProducts: [{ ...soup, name: "Unknown" }] }).ok).toBe(false);
    expect(validateMembershipConfiguration({ ...base, purchaseMode: "membership_with_package" }).ok).toBe(false);
    expect(validateMembershipConfiguration({ ...base, deliveryArea: "Unknown" }).ok).toBe(false);
  });
  it("does not reprice a saved snapshot after a catalog change", () => {
    const product = catalogueCategories.find(c => c.name === soup.category)!.products.find(p => p.name === soup.name)!;
    const result = validateMembershipConfiguration({ ...base, purchaseMode: "membership_with_package", selectedProducts: [soup] });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    const stored = JSON.stringify(result.purchaseSnapshot);
    const oldPrice = product.price;
    try { product.price = 999; expect(JSON.stringify(result.purchaseSnapshot)).toBe(stored); }
    finally { product.price = oldPrice; }
  });
  it("does not manufacture delivery slots from monthly quantities", () => {
    const quote = calculateMembershipQuote({ ...base, purchaseMode: "membership_with_package", selectedProducts: [soup] }, membershipPlans[2]);
    expect(buildMembershipDeliverySchedule({ membershipRequestId: "new", startDate: new Date("2026-10-10T12:00:00Z"), durationMonths: 3, deliveriesPerMonth: 4, purchaseSnapshot: quote.purchaseSnapshot })).toEqual([]);
  });
  it("preserves the historical schedule contract for legacy snapshots", () => {
    const legacy: MembershipPurchaseSnapshot = { version: 2, purchaseMode: "membership_with_package", plan: { id: "01", slug: "starter", name: "Starter", validityMonths: 12, membershipFee: 4000 }, delivery: { area: "Bangkok", preferredDay: "Monday", preferredTime: "09:00–12:00", deliveriesPerMonth: 2, deliveriesPerYear: 24 }, products: [{ category: soup.category, name: soup.name, unitPrice: 320, quantityPerDelivery: 2, annualQuantity: 48, lineTotal: 15360 }], preferences: [], addOns: [], membershipFee: 4000, packageSubtotal: 15360, total: 19360 };
    const schedule = buildMembershipDeliverySchedule({ membershipRequestId: "legacy", startDate: new Date("2026-10-10T12:00:00Z"), durationMonths: 12, deliveriesPerMonth: 2, purchaseSnapshot: legacy });
    expect(schedule).toHaveLength(24);
    expect(schedule[0].packageSnapshot.products[0].quantity).toBe(2);
  });
});
