import { describe, expect, it } from "vitest";
import { membershipPlans } from "@/lib/membership-plans";
import { validateMembershipConfiguration, type MembershipConfiguration } from "@/lib/membership-request";

const baseConfiguration: MembershipConfiguration = {
  planSlug: "starter",
  purchaseMode: "membership_only",
  foodPreferences: [],
  deliveryArea: "Bangkok central",
  preferredDay: "Monday",
  preferredTime: "09:00-12:00",
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
    expect(result.purchaseSnapshot.products).toEqual([]);
    expect(result.purchaseSnapshot.preferences).toEqual([{ category: "Thai soups", name: "Tom Yum Goong", quantityPerDelivery: 2 }]);
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
      { category: "Thai soups", name: "Tom Yum Goong", unitPrice: 320, quantityPerDelivery: 2, annualQuantity: 48, lineTotal: 15360 },
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
});
