import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { MembershipSelectionCart } from "./membership-detail";
import { catalogueCategories } from "@/lib/catalogue";
import { membershipPlans } from "@/lib/membership-plans";
import { calculateMembershipQuote } from "@/lib/membership-request";

const plan = membershipPlans[2];
const selectedServiceMonths = ["2027-02", "2027-07", "2027-11"];

function renderCart(productCount: number) {
  const products = catalogueCategories
    .filter(category => category.group === "food" || category.group === "drinks")
    .flatMap(category => category.products.map(product => ({ category: category.name, name: product.name, quantity: 1 })))
    .slice(0, productCount);
  const purchaseMode = "membership_with_package" as const;
  const quote = calculateMembershipQuote({
    planSlug: plan.slug,
    selectedServiceMonths,
    purchaseMode,
    foodPreferences: [],
    deliveryArea: "Bangkok",
    preferredDay: "Monday",
    preferredTime: "09:00–12:00",
    standardMealSlots: [],
    selectedProducts: products,
    }, plan);
  return renderToStaticMarkup(createElement(MembershipSelectionCart, {
    plan,
    selectedServiceMonths,
    quote,
    purchaseMode,
    area: "Bangkok",
    day: "Monday",
    time: "09:00–12:00",
    blockedStatus: null,
    saving: false,
    onContinue: () => {},
    onRemove: () => {},
    onQuantityChange: () => {},
  }));
}

describe("membership selection cart layout", () => {
  it("renders a small selection with its product names, totals, and quantity controls", () => {
    const html = renderCart(2);
    expect(html).toContain("Your selection");
    expect(html).toContain("Food package");
    expect(html).toContain("Continue to Application");
    expect((html.match(/aria-label="Increase /g) ?? [])).toHaveLength(4);
  });

  it("bounds large item lists inside the cart's independently scrollable region", () => {
    const productTotal = catalogueCategories
      .filter(category => category.group === "food" || category.group === "drinks")
      .reduce((sum, category) => sum + category.products.length, 0);
    expect(productTotal).toBeGreaterThanOrEqual(20);
    const html = renderCart(20);
    expect(html).toContain("max-h-[calc(100dvh-7rem)]");
    expect(html).toContain("overflow-y-auto");
    expect(html).toContain("lg:sticky");
    expect((html.match(/aria-label="Increase /g) ?? [])).toHaveLength(40);
    expect(html).toContain("Due after approval");
  });

  it("uses a compact expandable mobile cart with a viewport-bounded item list", () => {
    const html = renderCart(20);
    expect(html).toContain("lg:hidden");
    expect(html).toContain("Cart · 20 items");
    expect(html).toContain("max-h-[78dvh]");
    expect(html).toContain("Close selection");
    expect(html).toContain("break-words");
  });
});
