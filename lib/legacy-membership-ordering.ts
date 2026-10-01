const legacyLevels = ["budget", "budget", "budget", "budget", "standard", "standard", "standard", "standard", "premium", "premium", "premium", "premium", "premium", "premium", "premium", "vip", "vip", "vip", "vip", "vip"] as const;
const categories = {
  budget: ["beer", "house-wine"],
  standard: ["beer", "wine", "whisky"],
  premium: ["beer", "wine", "whisky", "rum", "vodka", "gin"],
  vip: ["beer", "wine", "whisky", "rum", "vodka", "gin", "tequila"],
};
/** Read-only compatibility for existing paid 01–20 agreements. */
export function legacyOrderingPermissions(planId: string) {
  if (!/^(0[1-9]|1[0-9]|20)$/.test(planId)) return null;
  return { allowedBeverageCategories: categories[legacyLevels[Number(planId) - 1]] };
}
