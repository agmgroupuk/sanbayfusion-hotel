import { beverageAddOns } from "./membership-plans";
import { catalogueCategories } from "./catalogue";

export const membershipFoodCategories = catalogueCategories.filter(category => category.group !== "alcohol");
export const membershipAlcoholMessage = "Alcohol cannot be included in a membership application. Please choose food or non-alcoholic beverages.";
export function containsMembershipAlcohol(items: Array<{ category: string; group?: string }>) {
  return items.some(item => item.group === "alcohol" || catalogueCategories.some(category => category.name === item.category && category.group === "alcohol") || beverageAddOns.some(addOn => addOn.category === item.category));
}
