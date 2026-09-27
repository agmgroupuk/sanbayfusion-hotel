import { describe, expect, it } from "vitest";
import { membershipPlanAllowsCatalogueCategory, membershipPlans } from "@/lib/membership-plans";
import { buildMembershipDeliverySchedule } from "@/lib/membership-delivery";
import { calculateMembershipQuote, membershipConfigurationSchema, validateMembershipConfiguration, type MembershipConfiguration } from "@/lib/membership-request";

const baseConfiguration: MembershipConfiguration = {
  planSlug: "starter",
  purchaseMode: "membership_only",
  foodPreferences: [],
  deliveryArea: "Bangkok central",
  preferredDay: "Monday",
  preferredTime: "09:00–12:00",
  alcoholEnabled: false,
  selectedAddOns: [],
  selectedProducts: [],
};

describe("membership purchase pricing", () => {
  it("charges only the fee in membership-only mode and keeps selections as preferences", () => {
    const result = validateMembershipConfiguration({
      ...baseConfiguration,
      selectedProducts: [{ category: "Thai soups", name: "Tom Yum Goong", quantity: 2 }],
    });

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.membershipFee).toBe(4000);
    expect(result.packageSubtotal).toBe(0);
    expect(result.total).toBe(4000);
    expect(result.purchaseSnapshot).toMatchObject({ version: 2, currency: "thb", pricingVersion: 1, charges: [], total: 4000 });
    expect(result.purchaseSnapshot.products).toEqual([]);
    expect(result.purchaseSnapshot.preferences).toEqual([{ category: "Thai soups", name: "Tom Yum Goong", productName: "Tom Yum Goong", variant: null, quantityPerDelivery: 2 }]);
  });

  it("prices prepaid quantities across the plan's annual delivery entitlement", () => {
    const result = validateMembershipConfiguration({
      ...baseConfiguration,
      purchaseMode: "membership_with_package",
      selectedProducts: [{ category: "Thai soups", name: "Tom Yum Goong", quantity: 2 }],
    });

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    const plan = membershipPlans.find((item) => item.slug === "starter");
    expect(plan?.deliveryDaysPerYear).toBe(24);
    expect(result.purchaseSnapshot.products).toEqual([
      { category: "Thai soups", group: "food", name: "Tom Yum Goong", productName: "Tom Yum Goong", variant: null, unitPrice: 320, quantityPerDelivery: 2, annualQuantity: 48, lineTotal: 15360 },
    ]);
    expect(result.packageSubtotal).toBe(15360);
    expect(result.total).toBe(19360);
  });

  it("rejects products that are not in the authoritative catalog", () => {
    const result = validateMembershipConfiguration({
      ...baseConfiguration,
      purchaseMode: "membership_with_package",
      selectedProducts: [{ category: "Thai soups", name: "Unlisted soup", quantity: 1 }],
    });

    expect(result).toMatchObject({ ok: false, error: "One or more catalogue selections are no longer available." });
  });

  it("rejects delivery rules that are not offered by the membership configuration", () => {
    const result = membershipConfigurationSchema.safeParse({ ...baseConfiguration, deliveryArea: "Unlisted service area" });
    expect(result.success).toBe(false);
  });

  it("keeps product name and package size as separate snapshot fields", () => {
    const plan = membershipPlans.find((item) => item.slug === "vip");
    expect(plan).toBeDefined();
    if (!plan) return;
    const quote = calculateMembershipQuote({
      ...baseConfiguration,
      purchaseMode: "membership_with_package",
      selectedProducts: [{ category: "Beer", name: "Singha Lager - 330 ml", quantity: 1 }],
    }, plan);

    expect(quote.purchaseSnapshot.products[0]).toMatchObject({
      productName: "Singha Lager",
      variant: "330 ml",
      group: "alcohol",
      unitPrice: 180,
      quantityPerDelivery: 1,
      annualQuantity: plan.deliveryDaysPerYear,
    });
  });

  it("enforces the plan's configured alcohol category eligibility", () => {
    const starter = membershipPlans.find((item) => item.slug === "starter");
    const vip = membershipPlans.find((item) => item.slug === "vip");
    expect(starter && membershipPlanAllowsCatalogueCategory(starter, "Whisky", "alcohol")).toBe(false);
    expect(vip && membershipPlanAllowsCatalogueCategory(vip, "Whisky", "alcohol")).toBe(true);
  });
});

describe("membership delivery entitlements", () => {
  it("creates the plan's monthly delivery slots with the prepaid per-delivery package frozen", () => {
    const quote = validateMembershipConfiguration({
      ...baseConfiguration,
      purchaseMode: "membership_with_package",
      selectedProducts: [{ category: "Thai soups", name: "Tom Yum Goong", quantity: 2 }],
    });
    expect(quote.ok).toBe(true);
    if (!quote.ok) return;

    const schedule = buildMembershipDeliverySchedule({
      membershipRequestId: "membership-1",
      startDate: new Date("2026-09-27T12:00:00.000Z"),
      validityMonths: 12,
      deliveriesPerMonth: 2,
      purchaseSnapshot: quote.purchaseSnapshot,
    });

    expect(schedule).toHaveLength(24);
    expect(schedule[0]).toMatchObject({
      cycleStartDate: "2026-09-27",
      cycleEndDate: "2026-10-26",
      sequence: 1,
      status: "available",
      packageSnapshot: {
        purchaseMode: "membership_with_package",
        products: [{ category: "Thai soups", group: "food", name: "Tom Yum Goong", productName: "Tom Yum Goong", variant: null, unitPrice: 320, quantity: 2 }],
      },
    });
    expect(schedule[23].cycleStartDate).toBe("2027-08-27");
  });
});
