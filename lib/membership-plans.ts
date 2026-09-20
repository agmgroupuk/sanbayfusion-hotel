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
  cadence: "monthly";
  deliveryDays: number;
  items: PackageItem[];
  benefits: string[];
  featured?: boolean;
};

// Fixed package catalogue. Prices and contents remain editable data, not checkout logic.
const rows: [string, string, string, PlanCategory, PlanLevel, number, number, PackageItem[], string[]][] = [
  ["01", "thai-starter", "Thai Starter", "food-only", "budget", 1490, 6, [["Pad Kra Pao Chicken", 2], ["Jasmine Rice", 2], ["Chicken Satay", 1], ["Som Tam", 1], ["Thai Iced Tea", 2], ["Bottled Water", 2]], ["Thai food-focused", "Standard delivery"]],
  ["02", "bangkok-basic", "Bangkok Basic", "food-only", "budget", 1990, 6, [["Pad Thai Chicken", 2], ["Green Curry Chicken", 2], ["Jasmine Rice", 2], ["Spring Rolls", 2], ["Thai Iced Tea", 2], ["Soft Drinks", 2]], ["Thai food-focused", "Standard delivery"]],
  ["03", "thai-food-club", "Thai Food Club", "food-only", "budget", 2490, 8, [["Pad Kra Pao Beef", 2], ["Tom Yum Chicken", 2], ["Fried Rice", 2], ["Chicken Satay", 2], ["Som Tam", 2], ["Thai Tea", 2], ["Soft Drinks", 2]], ["Thai food-focused", "Expanded delivery rhythm"]],
  ["04", "thai-dinner", "Thai Dinner", "food-only", "budget", 2990, 8, [["Tom Yum Goong", 2], ["Green Curry Chicken", 2], ["Pad Thai Prawns", 2], ["Jasmine Rice", 2], ["Thai Fish Cakes", 2], ["Mango Sticky Rice", 2], ["Soft Drinks", 2]], ["Thai food-focused", "Dinner menu"]],
  ["05", "bangkok-night", "Bangkok Night", "food-drinks", "standard", 3490, 8, [["Pad Kra Pao Beef", 2], ["Tom Yum Goong", 2], ["Thai BBQ Chicken", 2], ["Jasmine Rice", 2], ["Spring Rolls", 2], ["Mango Sticky Rice", 2], ["Thai Beer", 4, true]], ["Thai food", "Beer allocation where legally permitted"]],
  ["06", "thai-beer-dinner", "Thai Beer Dinner", "food-drinks", "standard", 3990, 8, [["Thai BBQ Chicken", 2], ["Crispy Pork", 2], ["Som Tam", 2], ["Sticky Rice", 2], ["Chicken Satay", 2], ["French Fries", 1], ["Thai Beer", 6, true]], ["Dinner package", "Beer allocation where legally permitted"]],
  ["07", "thai-wine-dinner", "Thai Wine Dinner", "food-drinks", "standard", 4990, 8, [["Tom Yum Goong", 2], ["Massaman Beef", 2], ["Pad Thai Prawns", 2], ["Seafood Salad", 1], ["Jasmine Rice", 2], ["Mango Sticky Rice", 2], ["House Red Wine", "1 bottle", true]], ["Thai dinner", "Wine allocation where legally permitted"]],
  ["08", "seafood-club", "Seafood Club", "food-drinks", "standard", 5990, 10, [["Grilled Prawns", 2], ["Steamed Sea Bass with Lime", 2], ["Seafood Salad", 2], ["Tom Yum Seafood", 2], ["Garlic Rice", 2], ["Mango Sticky Rice", 2], ["Premium Beer", 6, true]], ["Seafood selections", "Premium beer allocation where legally permitted"]],
  ["09", "thai-premium", "Thai Premium", "food-drinks", "premium", 6990, 10, [["Premium Beef Steak", 2], ["Tom Yum Goong", 2], ["Green Curry Seafood", 2], ["Grilled Squid", 2], ["Jasmine Rice", 2], ["Premium Dessert", 2], ["Premium Beer", 6, true], ["House Red Wine", "1 bottle", true]], ["Premium food", "Seafood and steak selections"]],
  ["10", "executive-dinner", "Executive Dinner", "food-drinks", "premium", 7990, 10, [["Ribeye Steak", 2], ["Garlic Prawns", 2], ["Tom Yum Seafood", 2], ["Caesar Salad", 2], ["Garlic Bread", 2], ["Premium Dessert", 2], ["Red Wine", "1 bottle", true], ["Premium Beer", 6, true]], ["Premium dinner", "Wine and beer allocation where legally permitted"]],
  ["11", "bangkok-executive", "Bangkok Executive", "executive", "premium", 9990, 12, [["Premium Ribeye", 2], ["Seafood Platter", 1], ["Tom Yum Goong", 2], ["Massaman Beef", 2], ["Caesar Salad", 2], ["Premium Dessert", 2], ["Red Wine", "1 bottle", true], ["Premium Beer", 6, true]], ["Premium collection", "Priority delivery"]],
  ["12", "thai-luxury", "Thai Luxury", "executive", "premium", 12990, 12, [["Wagyu Beef Steak", 2], ["Premium Prawns", 2], ["Premium Seafood Platter", 1], ["Tom Yum Seafood", 2], ["Truffle Pasta", 2], ["Premium Dessert", 2], ["Premium Red Wine", "1 bottle", true], ["Premium White Wine", "1 bottle", true], ["Premium Beer", 6, true]], ["Premium collection", "Luxury menu"]],
  ["13", "wine-steak-club", "Wine & Steak Club", "executive", "premium", 14990, 12, [["Wagyu Steak", 2], ["Ribeye Steak", 2], ["Garlic Prawns", 2], ["Seafood Salad", 2], ["Truffle Pasta", 2], ["Premium Dessert", 2], ["Premium Red Wine", "2 bottles", true], ["Premium White Wine", "1 bottle", true]], ["Premium collection", "Wine allocation where legally permitted"]],
  ["14", "whisky-dinner-club", "Whisky Dinner Club", "executive", "premium", 17990, 12, [["Wagyu Steak", 2], ["Premium Seafood Platter", 1], ["Tom Yum Goong", 2], ["Premium Pasta", 2], ["Caesar Salad", 2], ["Premium Dessert", 2], ["Premium Whisky", "1 bottle", true], ["Premium Beer", 6, true]], ["Premium collection", "Whisky allocation where legally permitted"]],
  ["15", "royal-thai-club", "Royal Thai Club", "executive", "premium", 19990, 14, [["Premium Wagyu Steak", 2], ["King Prawn Platter", 1], ["Premium Thai Seafood", 1], ["Massaman Beef", 2], ["Premium Thai Curry", 2], ["Premium Dessert Selection", 2], ["Premium Red Wine", "2 bottles", true], ["Premium Beer", 6, true]], ["Premium collection", "Royal Thai menu"]],
  ["16", "vip-bangkok-club", "VIP Bangkok Club", "executive", "vip", 24990, 16, [["Premium Wagyu Steak", 2], ["Premium Seafood Platter", 2], ["King Prawns", 2], ["Premium Thai Curry", 2], ["Truffle Pasta", 2], ["Premium Dessert Selection", 2], ["Premium Red Wine", "2 bottles", true], ["Premium White Wine", "1 bottle", true], ["Premium Beer", 12, true]], ["VIP collection", "Priority delivery"]],
  ["17", "vip-wine-steak", "VIP Wine & Steak", "executive", "vip", 29990, 16, [["Wagyu Tenderloin", 2], ["Wagyu Ribeye", 2], ["Premium Lobster / Seafood Selection", 2], ["King Prawns", 2], ["Truffle Pasta", 2], ["Premium Salad", 2], ["Premium Dessert", 2], ["Premium Red Wine", "3 bottles", true], ["Premium White Wine", "1 bottle", true]], ["VIP collection", "Wine allocation where legally permitted"]],
  ["18", "vip-whisky-seafood", "VIP Whisky & Seafood", "executive", "vip", 34990, 16, [["Wagyu Steak", 2], ["Premium Seafood Platter", 2], ["King Prawns", 2], ["Premium Thai Seafood", 2], ["Truffle Pasta", 2], ["Premium Dessert", 2], ["Premium Whisky", "1 bottle", true], ["Premium Red Wine", "2 bottles", true], ["Premium Beer", 12, true]], ["VIP collection", "Whisky allocation where legally permitted"]],
  ["19", "black-vip-club", "Black VIP Club", "executive", "vip", 39990, 18, [["Premium Wagyu Tenderloin", 2], ["Premium Wagyu Ribeye", 2], ["Premium Seafood Platter", 2], ["King Prawns", 2], ["Lobster / Seafood Selection", 1], ["Truffle Pasta", 2], ["Premium Dessert Selection", 2], ["Premium Red Wine", "3 bottles", true], ["Premium White Wine", "1 bottle", true], ["Premium Whisky", "1 bottle", true], ["Premium Beer", 12, true]], ["VIP collection", "Priority service"]],
  ["20", "elite-royal-membership", "Elite Royal Membership", "executive", "vip", 49990, 20, [["Premium Wagyu Tenderloin", 2], ["Premium Wagyu Ribeye", 2], ["Premium Seafood Platter", 2], ["King Prawn Selection", 2], ["Premium Lobster / Seafood Selection", 2], ["Premium Thai Signature Dishes", 2], ["Truffle Pasta", 2], ["Premium Dessert Collection", 2], ["Premium Red Wine", "4 bottles", true], ["Premium White Wine", "2 bottles", true], ["Premium Whisky", "1 bottle", true], ["Premium Beer", 12, true]], ["Priority delivery", "VIP member support"]],
];

export const membershipPlans: MembershipPlan[] = rows.map(([id, slug, name, category, level, price, deliveryDays, items, benefits], index) => ({
  id,
  slug,
  name,
  category,
  level,
  price,
  cadence: "monthly",
  deliveryDays,
  items: items.map(([itemName, quantity, alcohol]) => ({ name: itemName, quantity, alcohol })),
  benefits,
  featured: index === 4 || index === 19,
}));

// Keep alcohol disabled until Thai licensing, age checks, permitted hours,
// advertising, import, premises, and delivery requirements are verified.
export const alcoholSalesEnabled = process.env.NEXT_PUBLIC_ALCOHOL_SALES_ENABLED === "true";

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
