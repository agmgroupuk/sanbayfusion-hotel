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
};

export const membershipDeliveryAreas = ["Bangkok"] as const;
export const membershipPreferredDays = ["Monday", "Wednesday", "Friday", "Saturday", "Sunday"] as const;
export const membershipPreferredTimes = ["09:00–12:00", "12:00–15:00", "17:00–20:00"] as const;

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
  };
});

export const membershipValueProps = [
  ["Choose", "Select 1 to 12 non-consecutive service months in a calendar year."],
  ["Apply", "Save a payment method and authorize your membership and optional package."],
  ["Activate", "After approval and successful payment, use your benefits in your selected service months."],
] as const;
