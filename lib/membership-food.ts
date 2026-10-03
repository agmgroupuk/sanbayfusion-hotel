import { catalogueCategories } from "./catalogue";
import { containsDiscontinuedProducts } from "./discontinued-products";

export const membershipFoodCategories = catalogueCategories;
export const unavailableMembershipProductsMessage = "One or more selected products are no longer available.";

export function containsUnavailableMembershipProducts(
  items: readonly { category?: unknown; name?: unknown; group?: unknown }[],
) {
  return containsDiscontinuedProducts(items) ||
    items.some(item =>
      typeof item.category === "string" &&
      !catalogueCategories.some(category => category.name === item.category),
    );
}
