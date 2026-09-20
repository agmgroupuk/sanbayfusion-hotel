export type PlanCategory = "food-only" | "food-drinks" | "family" | "executive" | "corporate";
export type PlanLevel = "budget" | "standard" | "premium" | "vip";

export type PackageItem = {
  name: string;
  quantity: number | string;
  alcohol?: boolean;
};

export type MembershipPlan = {
  id: string;
  slug: string;
  name: string;
  category: PlanCategory;
  level: PlanLevel;
  price: number;
  cadence: "annual";
  validityMonths: 12;
  deliveryDays: number;
  deliveryDaysPerYear: number;
  rhythm: string;
  foodLevel: string;
  foodValueRange: [number, number];
  exampleMenu: string[];
  allowedBeverageCategories: string[];
  items: PackageItem[];
  benefits: string[];
  featured?: boolean;
};

// Fixed package catalogue. Prices and contents remain editable data, not checkout logic.
const rows: [string, string, string, PlanCategory, PlanLevel, number, number, PackageItem[], string[]][] = [
  ["01", "starter", "Starter Membership", "food-only", "budget", 4000, 2, [["Thai starter food package", 1]], ["Every 2 weeks", "Standard delivery"]],
  ["02", "essential", "Essential Membership", "food-only", "budget", 6000, 2, [["Essential food package", 1]], ["Every 2 weeks", "Standard delivery"]],
  ["03", "bronze", "Bronze Membership", "food-only", "budget", 8000, 2, [["Bronze food package", 1]], ["Every 2 weeks", "Standard delivery"]],
  ["04", "bronze-plus", "Bronze Plus", "food-only", "budget", 10000, 4, [["Bronze Plus food package", 1]], ["About 1/week", "Standard delivery"]],
  ["05", "silver", "Silver Membership", "food-only", "standard", 12000, 4, [["Silver food package", 1]], ["About 1/week", "Standard delivery"]],
  ["06", "silver-plus", "Silver Plus", "food-only", "standard", 14000, 4, [["Silver Plus food package", 1]], ["About 1/week", "Standard delivery"]],
  ["07", "gold", "Gold Membership", "food-only", "standard", 16000, 4, [["Gold food package", 1]], ["About 1/week", "Premium delivery"]],
  ["08", "gold-plus", "Gold Plus", "food-only", "standard", 18000, 6, [["Gold Plus food package", 1]], ["About 1–2/week", "Premium delivery"]],
  ["09", "premium", "Premium Membership", "food-drinks", "premium", 20000, 6, [["Premium food package", 1], ["Selected beverage allocation", 1]], ["About 1–2/week", "Premium menu"]],
  ["10", "premium-plus", "Premium Plus", "food-drinks", "premium", 22500, 6, [["Premium Plus food package", 1], ["Selected beverage allocation", 1]], ["About 1–2/week", "Premium menu"]],
  ["11", "platinum-membership", "Platinum Membership", "food-drinks", "premium", 25000, 6, [["Platinum food package", 1], ["Premium beverage allocation", 1]], ["About 1–2/week", "Priority delivery"]],
  ["12", "platinum-plus", "Platinum Plus", "food-drinks", "premium", 27500, 8, [["Platinum Plus food package", 1], ["Premium beverage allocation", 1]], ["About 2/week", "Priority delivery"]],
  ["13", "executive", "Executive Membership", "executive", "premium", 30000, 8, [["Executive food package", 1], ["Premium beverage allocation", 1]], ["About 2/week", "Executive support"]],
  ["14", "executive-plus", "Executive Plus", "executive", "premium", 32500, 8, [["Executive Plus food package", 1], ["Premium beverage allocation", 1]], ["About 2/week", "Executive support"]],
  ["15", "diamond-membership", "Diamond Membership", "executive", "premium", 35000, 8, [["Diamond food package", 1], ["Premium beverage allocation", 1]], ["About 2/week", "Priority delivery"]],
  ["16", "diamond-plus", "Diamond Plus", "executive", "vip", 38000, 10, [["Diamond Plus food package", 1], ["Premium beverage allocation", 1]], ["About 2–3/week", "VIP support"]],
  ["17", "vip", "VIP Membership", "executive", "vip", 41000, 10, [["VIP food package", 1], ["Premium beverage allocation", 1]], ["About 2–3/week", "VIP support"]],
  ["18", "vip-plus", "VIP Plus", "executive", "vip", 44000, 10, [["VIP Plus food package", 1], ["Premium beverage allocation", 1]], ["About 2–3/week", "VIP support"]],
  ["19", "royal", "Royal Membership", "executive", "vip", 47000, 12, [["Royal food package", 1], ["Premium beverage allocation", 1]], ["About 3/week", "Priority service"]],
  ["20", "elite-membership", "Elite Membership", "executive", "vip", 50000, 12, [["Elite food package", 1], ["Premium beverage allocation", 1]], ["About 3/week", "Dedicated member support"]],
];

export const membershipPlans: MembershipPlan[] = rows.map(([id, slug, name, category, level, price, deliveryDays, items, benefits], index) => ({
  id,
  slug,
  name,
  category,
  level,
  price,
  cadence: "annual",
  validityMonths: 12,
  deliveryDays,
  deliveryDaysPerYear: deliveryDays * 12,
  rhythm: benefits[0],
  foodLevel: level === "budget" ? "Essential Thai" : level === "standard" ? "Thai Plus" : level === "premium" ? "Premium" : "Elite",
  foodValueRange: level === "budget" ? [250, 450] : level === "standard" ? [450, 800] : level === "premium" ? [850, 1400] : [1400, 2500],
  exampleMenu: items.filter((item) => !item.alcohol).slice(0, 6).map((item) => item.name),
  allowedBeverageCategories: level === "budget" ? ["beer", "house-wine"] : level === "standard" ? ["beer", "wine", "whisky"] : level === "premium" ? ["beer", "wine", "whisky", "rum", "vodka", "gin"] : ["beer", "wine", "whisky", "rum", "vodka", "gin", "tequila"],
  items: items.map(([itemName, quantity, alcohol]) => ({ name: itemName, quantity, alcohol })),
  benefits,
  featured: index === 4 || index === 19,
}));

// Keep alcohol disabled until Thai licensing, age checks, permitted hours,
// advertising, import, premises, and delivery requirements are verified.
export const alcoholSalesEnabled = process.env.NEXT_PUBLIC_ALCOHOL_SALES_ENABLED === "true";

export const beverageAddOns = [
  { category: "beer", label: "Beer", options: ["Thai Beer", "Premium Beer", "Imported Beer"], price: 790 },
  { category: "wine", label: "Wine", options: ["House Red Wine", "House White Wine", "Premium Red Wine", "Premium White Wine", "Sparkling Wine"], price: 1490 },
  { category: "whisky", label: "Whisky", options: ["House Whisky", "Blended Whisky", "Scotch Whisky", "Premium Whisky"], price: 2490 },
  { category: "rum", label: "Rum", options: ["White Rum", "Dark Rum", "Spiced Rum", "Premium Rum"], price: 1290 },
  { category: "vodka", label: "Vodka", options: ["House Vodka", "Premium Vodka", "Imported Vodka"], price: 1290 },
  { category: "gin", label: "Gin", options: ["House Gin", "London Dry Gin", "Premium Gin"], price: 1290 },
  { category: "tequila", label: "Tequila", options: ["Blanco Tequila", "Reposado Tequila", "Añejo Tequila"], price: 1890 },
] as const;

export const membershipValueProps = [
  ["Join", "Choose one fixed package with fixed food, quantities, beverages, and delivery days."],
  ["Subscribe", "Confirm your area, dates, dietary needs, and recurring membership terms."],
  ["Receive", "Your predefined package arrives on scheduled delivery days."],
  ["Enjoy", "The menu rotates, but your package stays clear and predictable."],
] as const;

export const packageCategoryLabels: Record<PlanCategory, string> = {
  "food-only": "Food only",
  "food-drinks": "Food + drinks",
  family: "Family",
  executive: "Executive",
  corporate: "Corporate",
};
