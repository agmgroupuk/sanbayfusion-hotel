import type { IncludedMemberBenefit } from "@/lib/membership-service-months";
import { standardMealAllowances } from "@/lib/standard-meal";

export type MembershipPlan = {
  id: string;
  slug: string;
  name: string;
  description: string;
  price: number;
  durationMonths: number;
  includedBenefit: IncludedMemberBenefit;
  allowedBeverageCategories: string[];
};

export const membershipDeliveryAreas = ["Bangkok"] as const;
export const membershipPreferredDays = ["Monday", "Wednesday", "Friday", "Saturday", "Sunday"] as const;
export const membershipPreferredTimes = ["09:00–12:00", "12:00–15:00", "17:00–20:00"] as const;

export function membershipPlanAllowsCatalogueCategory(plan: Pick<MembershipPlan, "allowedBeverageCategories">, categoryName: string, group: string) {
  if (group !== "alcohol") return true;
  const category = categoryName === "Champagne & sparkling wine" ? "wine" : categoryName.toLowerCase().replace(/[^a-z]+/g, "-").replace(/^-|-$/g, "");
  return plan.allowedBeverageCategories.includes(category);
}

// Distinct IDs preserve the meaning of historical 01–20 plan references.
// Authoritative one-time THB fees: increasing totals, decreasing effective monthly rates.
// Quotes, saved applications, invoice lines and catalog synchronization derive from this table.
export const membershipPlans: MembershipPlan[] = [6000, 11000, 15000, 18000, 20500, 22500, 24000, 25500, 27000, 28000, 29000, 30000].map((price, index) => {
  const durationMonths = index + 1;
  return {
    id: `duration-${durationMonths}`,
    slug: `${durationMonths}-month-membership`,
    name: `${durationMonths}-Month Membership`,
    description: `For eligible foreign visitors normally living outside Thailand. Choose ${durationMonths} eligible service ${durationMonths === 1 ? "month" : "months"} in your selected calendar year. Months do not have to be consecutive.`,
    price,
    durationMonths,
    includedBenefit: {
      name: "Standard Meal",
      kind: "standard_meal",
      menuValue: standardMealAllowances[index],
      quantityPerServiceMonth: 1,
      cashValue: 0,
    },
    allowedBeverageCategories: ["beer", "wine", "whisky", "rum", "vodka", "gin", "tequila"],
  };
});

// Keep alcohol disabled until Thai licensing, age checks, permitted hours,
// advertising, import, premises, and delivery requirements are verified.
export const alcoholSalesEnabled = process.env.NEXT_PUBLIC_ALCOHOL_SALES_ENABLED === "true";

export type AddOnPricingType = "MONTHLY" | "ONE_TIME";

// Existing beverage add-ons are one-time purchases; only catalog data sets pricing.
export const beverageAddOns: ReadonlyArray<{ category: string; label: string; options: readonly string[]; price: number; pricingType: AddOnPricingType }> = [
  { category: "beer", label: "Beer", options: ["Thai Beer", "Premium Beer", "Imported Beer"], price: 790, pricingType: "ONE_TIME" },
  { category: "wine", label: "Wine", options: ["House Red Wine", "House White Wine", "Premium Red Wine", "Premium White Wine", "Sparkling Wine"], price: 1490, pricingType: "ONE_TIME" },
  { category: "whisky", label: "Whisky", options: ["House Whisky", "Blended Whisky", "Scotch Whisky", "Premium Whisky"], price: 2490, pricingType: "ONE_TIME" },
  { category: "rum", label: "Rum", options: ["White Rum", "Dark Rum", "Spiced Rum", "Premium Rum"], price: 1290, pricingType: "ONE_TIME" },
  { category: "vodka", label: "Vodka", options: ["House Vodka", "Premium Vodka", "Imported Vodka"], price: 1290, pricingType: "ONE_TIME" },
  { category: "gin", label: "Gin", options: ["House Gin", "London Dry Gin", "Premium Gin"], price: 1290, pricingType: "ONE_TIME" },
  { category: "tequila", label: "Tequila", options: ["Blanco Tequila", "Reposado Tequila", "Añejo Tequila"], price: 1890, pricingType: "ONE_TIME" },
] as const;

export const membershipValueProps = [
  ["Choose", "Select 1 to 12 non-consecutive service months in a calendar year."],
  ["Apply", "Save a payment method and authorize your membership and optional package."],
  ["Activate", "After approval and successful payment, use your benefits in your selected service months."],
] as const;
