import type { MembershipPurchaseSnapshot } from "@/lib/membership-request";
import { catalogueCategories } from "@/lib/catalogue";
import { containsDiscontinuedProducts, isDiscontinuedProduct } from "@/lib/discontinued-products";
import { validateServiceMonths } from "@/lib/membership-service-months";
import { validateStandardMealSlots } from "@/lib/standard-meal";

export function hasInactiveMembershipProducts(quote: MembershipPurchaseSnapshot): boolean {
  if (!Array.isArray(quote.products) || !Array.isArray(quote.addOns)) return true;
  if (quote.addOns.length || containsDiscontinuedProducts(quote.products)) return true;
  if (quote.charges?.some(charge => isDiscontinuedProduct(charge.code, charge.label))) return true;
  return quote.products.some(item => !catalogueCategories.some(category =>
    category.name === item.category && category.products.some(product => product.name === item.name),
  ));
}

/** Validate the saved arithmetic without substituting today's catalog prices. */
export function validSavedQuote(quote: MembershipPurchaseSnapshot): boolean {
  const months = quote.plan?.durationMonths;
  if (!Array.isArray(quote.products) || !Array.isArray(quote.addOns)) return false;
  if (![3, 4].includes(quote.version) || quote.currency !== "thb" || !Number.isInteger(months) || !months || months < 1 || months > 12 || !Number.isSafeInteger(quote.membershipFee) || quote.membershipFee <= 0 || quote.plan.membershipFee !== quote.membershipFee) return false;
  if (quote.version === 4 && (validateServiceMonths(quote.selectedServiceMonths, months) || !quote.includedBenefit?.name || !Number.isSafeInteger(quote.includedBenefit.menuValue) || quote.includedBenefit.menuValue <= 0 || quote.includedBenefit.quantityPerServiceMonth !== 1 || quote.includedBenefit.cashValue !== 0)) return false;
  let subtotal = 0;
  if (quote.standardMealSlots && (quote.standardMealSlots.length !== months || validateStandardMealSlots(quote.standardMealSlots, quote.selectedServiceMonths ?? []))) return false;
  for (const item of [...quote.products, ...quote.addOns]) {
    const quantity = "quantity" in item ? item.quantity : item.monthlyQuantity;
    if (!Number.isInteger(quantity) || !quantity || quantity < 1 || quantity > 100 || !Number.isSafeInteger(item.unitPrice) || item.unitPrice < 0 || item.durationMonths !== months || !["MONTHLY", "ONE_TIME"].includes(item.pricingType ?? "")) return false;
    const termQuantity = quantity * (item.pricingType === "MONTHLY" ? months : 1);
    if (item.totalTermQuantity !== termQuantity || item.lineTotal !== item.unitPrice * termQuantity) return false;
    subtotal += item.lineTotal;
  }
  if (quote.purchaseMode === "membership_only" && (quote.products.length || quote.addOns.length)) return false;
  const charges = quote.charges ?? [];
  if (charges.some(charge => !Number.isSafeInteger(charge.amount) || charge.amount < 0 || !charge.label)) return false;
  return quote.packageSubtotal === subtotal && quote.total === quote.membershipFee + subtotal + charges.reduce((sum, charge) => sum + charge.amount, 0);
}
