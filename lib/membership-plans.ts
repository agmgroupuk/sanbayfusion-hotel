export type MembershipPlan = {
  slug: string;
  name: string;
  price: string;
  cadence: string;
  description: string;
  deliveries: string;
  portions: string;
  benefits: string[];
  featured?: boolean;
};

// Central catalogue for the public site. Replace these planning prices when the
// final delivery costs, food costs, and payment fees are confirmed.
export const membershipPlans: MembershipPlan[] = [
  {
    slug: "basic",
    name: "Monthly Basic",
    price: "฿2,500",
    cadence: "per month",
    description: "A dependable rhythm of nourishing food for busy weeks.",
    deliveries: "6 delivery days",
    portions: "1 food package per delivery",
    benefits: ["Choose available delivery dates", "Rotating seasonal menu", "Pause before your next cycle"],
  },
  {
    slug: "plus",
    name: "Monthly Plus",
    price: "฿4,500",
    cadence: "per month",
    description: "More delivery days, larger packages, and a little extra for the table.",
    deliveries: "12 delivery days",
    portions: "Larger food package",
    benefits: ["Drinks or snacks included", "Priority delivery windows", "Member-only menu drops"],
    featured: true,
  },
  {
    slug: "family",
    name: "Family Membership",
    price: "฿7,500",
    cadence: "per month",
    description: "Family-size portions designed to make shared meals easier.",
    deliveries: "12 delivery days",
    portions: "Multiple portions per delivery",
    benefits: ["Family-size packages", "Flexible date selection", "Extra portions available"],
  },
  {
    slug: "premium",
    name: "Premium Membership",
    price: "฿10,000",
    cadence: "per month",
    description: "Our most generous membership for priority access and elevated products.",
    deliveries: "Up to 20 delivery days",
    portions: "Premium meals and products",
    benefits: ["Priority delivery slots", "Seasonal premium items", "Dedicated member support"],
  },
  {
    slug: "corporate",
    name: "Corporate Membership",
    price: "By arrangement",
    cadence: "monthly programme",
    description: "Recurring food delivery for teams, offices, hospitality, and events.",
    deliveries: "Built around your schedule",
    portions: "Team-size packages",
    benefits: ["Consolidated invoicing", "Delivery planning", "Wholesale and event options"],
  },
];

export const membershipValueProps = [
  ["Predictable meals", "Choose a plan and receive a clear schedule of food packages without one-off ordering friction."],
  ["Flexible delivery", "Select available dates, tell us where you are, and adjust future cycles before they begin."],
  ["Seasonal variety", "Menus move with the market, bringing new dishes, snacks, drinks, and pantry products into the rhythm."],
] as const;