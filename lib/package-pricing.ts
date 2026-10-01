export type PricingType = "MONTHLY" | "ONE_TIME";

export function pricePackageItem(unitPrice: number, quantity: number, durationMonths: number, pricingType: PricingType) {
  if (!Number.isSafeInteger(unitPrice) || unitPrice < 0 || !Number.isInteger(quantity) || quantity < 1 || quantity > 100 || !Number.isInteger(durationMonths) || durationMonths < 1 || durationMonths > 12) throw new Error("Invalid package pricing input");
  const totalTermQuantity = quantity * (pricingType === "MONTHLY" ? durationMonths : 1);
  return { totalTermQuantity, lineTotal: unitPrice * totalTermQuantity };
}
