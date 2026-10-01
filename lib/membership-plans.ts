export type MembershipPlan = {
  id: string;
  slug: string;
  name: string;
  description: string;
  price: number;
  durationMonths: number;
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
export const membershipPlans: MembershipPlan[] = [6000, 11000, 15000, 19000, 23000, 27000, 31000, 35000, 39000, 43000, 47000, 50000].map((price, index) => {
  const durationMonths = index + 1;
  return {
    id: `duration-${durationMonths}`,
    slug: `${durationMonths}-month-membership`,
    name: `${durationMonths}-Month Membership`,
    description: `${durationMonths} calendar ${durationMonths === 1 ? "month" : "months"} of membership from final activation.`,
    price,
    durationMonths,
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
  ["Choose", "Select a membership lasting 1 to 12 months."],
  ["Pay", "Buy membership only or add a prepaid package."],
  ["Activate", "Your term starts after payment, team review, and final approval."],
] as const;
