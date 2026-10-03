const discontinuedProductTerms =
  /\b(?:absinthe|alcohol(?:ic)?|alcopops?|amaretto|aperitifs?|beer|bourbon|brandy|cava|champagne|cider|cognac|digestifs?|distillates?|gin|hard cider|hard lemonade|hard seltzer|liqueurs?|liquor|mead|mezcal|moonshine|port|prosecco|raki|rum|sake|schnapps?|scotch|sherry|shochu|soju|spirits?|tequila|vermouth|vodka|whisk(?:e?y)|wine)\b/i;

export function isDiscontinuedProduct(category: unknown, name: unknown, group?: unknown) {
  return group === "alcohol" ||
    (typeof category === "string" && discontinuedProductTerms.test(category)) ||
    (typeof name === "string" && discontinuedProductTerms.test(name));
}

export function containsDiscontinuedProducts(
  items: readonly { category?: unknown; name?: unknown; group?: unknown }[],
) {
  return items.some(item => isDiscontinuedProduct(item.category, item.name, item.group));
}
