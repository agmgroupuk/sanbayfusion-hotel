export type PlanCategory = "food-only" | "food-drinks" | "family" | "executive" | "corporate";

export type MembershipPlan = {
  id: string;
  slug: string;
  name: string;
  category: PlanCategory;
  tier: "budget" | "standard" | "premium" | "vip" | "custom";
  price: number | null;
  cadence: "monthly";
  deliveryDays: number | null;
  portions: string;
  description: string;
  benefits: string[];
  beverageAllocation: "none" | "selected" | "premium" | "custom";
  featured?: boolean;
};

// Planning catalogue. Prices, delivery counts, products, and benefits are data-driven.
const planRows: [string, string, string, PlanCategory, MembershipPlan["tier"], number | null, number | null, string, string, string[], MembershipPlan["beverageAllocation"]][] = [
  ["01", "budget-starter", "Budget Starter", "food-only", "budget", 999, 4, "Basic Thai meal, rice, main, and small side", "An affordable first step into scheduled food delivery.", ["Standard delivery", "Rotating Thai menu"], "none"],
  ["02", "thai-basic", "Thai Basic", "food-only", "budget", 1499, 6, "Thai main meal, rice, and side dish", "A simple Thai meal rhythm for busy weeks.", ["Choose available dates", "Standard delivery"], "none"],
  ["03", "thai-plus", "Thai Plus", "food-only", "standard", 1999, 6, "Premium Thai meals with one drink", "A richer Thai menu with a small beverage included.", ["Premium Thai dishes", "Drink included"], "selected"],
  ["04", "home-food", "Home Food", "food-only", "standard", 2499, 8, "Larger main, rice, side, and selected drink", "A dependable household package for recurring evenings.", ["Larger portions", "Flexible date selection"], "selected"],
  ["05", "family-basic", "Family Basic", "family", "standard", 3499, 8, "Family-size meals with multiple portions", "Shared food for the household without daily ordering.", ["Family portions", "Standard delivery"], "none"],
  ["06", "family-plus", "Family Plus", "family", "standard", 4499, 10, "Family meals, drinks, and selected desserts", "A fuller family rhythm with treats built in.", ["Drinks included", "Selected desserts"], "selected"],
  ["07", "food-lover", "Food Lover", "food-only", "premium", 5499, 12, "Thai and international menu with premium portions", "More variety for members who want the kitchen to keep moving.", ["Premium portions", "Drinks included", "Member menu drops"], "selected"],
  ["08", "premium-food", "Premium Food", "food-only", "premium", 6999, 12, "Premium Thai and international meals, drinks, and desserts", "A polished food programme for the full month.", ["Premium drinks", "Desserts included", "Priority delivery"], "premium"],
  ["09", "executive-food", "Executive Food", "executive", "premium", 8499, 16, "Premium menu with seafood, steak, and desserts", "A generous programme for demanding schedules.", ["Seafood selections", "Steak selections", "Premium desserts"], "premium"],
  ["10", "luxury-food", "Luxury Food", "executive", "vip", 12000, 20, "Premium seafood, steak, international food, and desserts", "Our most complete food-only programme.", ["Luxury menu", "Priority delivery", "Premium zero-proof drinks"], "premium"],
  ["11", "social-starter", "Social Starter", "food-drinks", "budget", 1999, 6, "Food package with selected beverage allocation", "A modest food and social drinks rhythm where legally permitted.", ["Selected beverages", "Standard delivery"], "selected"],
  ["12", "weekend-package", "Weekend Package", "food-drinks", "standard", 2999, 8, "Premium meals with selected beverages", "A weekend-led package for shared meals and gatherings.", ["Premium meals", "Selected beverages"], "selected"],
  ["13", "dinner-club", "Dinner Club", "food-drinks", "standard", 3999, 8, "Eight premium dinner deliveries with beverage component", "Restaurant-style dinners delivered on a recurring plan.", ["Dinner menu", "Beverage component"], "selected"],
  ["14", "premium-social", "Premium Social", "food-drinks", "premium", 5999, 12, "Premium food, selected beverages, and dessert", "A fuller social table for regular entertaining.", ["Premium food", "Dessert included", "Selected beverages"], "selected"],
  ["15", "executive-club", "Executive Club", "executive", "premium", 7999, 12, "Premium seafood and meat with beverage allocation", "A serious recurring programme for hosts and executives.", ["Premium seafood", "Premium meat", "Premium dessert"], "premium"],
  ["16", "luxury-club", "Luxury Club", "executive", "vip", 10000, 16, "Premium food, beverage allocation, and special menu", "A high-touch programme for frequent delivery.", ["Special menu", "Priority slots", "Premium allocation"], "premium"],
  ["17", "vip-dining-club", "VIP Dining Club", "food-drinks", "vip", 15000, 20, "Premium seafood, steak, desserts, and beverage allocation", "A priority programme with dedicated member support.", ["VIP support", "Priority delivery", "Premium menu"], "premium"],
  ["18", "vip-family-club", "VIP Family Club", "family", "vip", 20000, 20, "Family-size premium meals and beverage allocation", "A complete household programme with a family account.", ["Multiple portions", "Family account", "Priority delivery"], "premium"],
  ["19", "black-label-dining", "Black Label Dining", "executive", "vip", 30000, 20, "Luxury food, premium seafood, steaks, and beverage allocation", "A tailored luxury menu for a private household or host.", ["Priority service", "Luxury selections", "Dedicated support"], "premium"],
  ["20", "elite-membership", "Elite Membership", "corporate", "custom", 50000, null, "Bespoke chef-selected programme with premium allocation", "A custom food programme for high-touch households, teams, or hospitality.", ["Chef-selected menus", "Dedicated member support", "Priority delivery"], "custom"],
];

export const membershipPlans: MembershipPlan[] = planRows.map(([id, slug, name, category, tier, price, deliveryDays, portions, description, benefits, beverageAllocation], index) => ({
  id,
  slug,
  name,
  category,
  tier,
  price,
  cadence: "monthly",
  deliveryDays,
  portions,
  description,
  benefits,
  beverageAllocation,
  featured: index === 6 || index === 12,
}));

export const membershipValueProps = [
  ["Join", "Choose a predefined package with a clear number of delivery days, portions, and benefits."],
  ["Subscribe", "Confirm your area, delivery dates, dietary needs, and recurring membership terms."],
  ["Receive", "Scheduled food packages arrive with the care of the Sanbay Fusion kitchen."],
  ["Enjoy", "Menus rotate with the season, while your membership keeps the next meal predictable."],
] as const;

export const packageCategoryLabels: Record<PlanCategory, string> = {
  "food-only": "Food only",
  "food-drinks": "Food + drinks",
  family: "Family",
  executive: "Executive",
  corporate: "Corporate",
};
