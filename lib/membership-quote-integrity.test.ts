import { describe, expect, it } from "vitest";
import { validSavedQuote } from "@/lib/membership-quote-integrity";
import { validateMembershipConfiguration } from "@/lib/membership-request";
import { membershipPreferredTimes } from "@/lib/membership-plans";
const configuration = { planSlug: "3-month-membership", purchaseMode: "membership_with_package", foodPreferences: [], deliveryArea: "Bangkok", preferredDay: "Monday", preferredTime: membershipPreferredTimes[0], alcoholEnabled: false, selectedProducts: [{ category: "Thai soups", name: "Tom Yum Goong", quantity: 4 }], selectedAddOns: [] };
function quote() { const result = validateMembershipConfiguration(configuration); if (!result.ok) throw new Error(result.error); return result.purchaseSnapshot; }
describe("immutable quote arithmetic", () => {
 it("accepts the saved quote without reading new catalog prices", () => { expect(validSavedQuote(quote())).toBe(true); });
 it("rejects changed totals", () => { const value = quote(); value.total++; expect(validSavedQuote(value)).toBe(false); });
 it("rejects changed term quantities even if totals remain unchanged", () => { const value = quote(); value.products[0].totalTermQuantity = 4; expect(validSavedQuote(value)).toBe(false); });
 it("rejects delivery-based multiplication", () => { const value = quote(); value.products[0].durationMonths = 12; expect(validSavedQuote(value)).toBe(false); });
 it("charges a saved one-time add-on only once", () => { const value = quote(); value.addOns.push({ category: "extra", name: "One-time extra", quantity: 2, unitPrice: 100, pricingType: "ONE_TIME", durationMonths: 3, totalTermQuantity: 2, lineTotal: 200 }); value.packageSubtotal += 200; value.total += 200; expect(validSavedQuote(value)).toBe(true); value.addOns[0].lineTotal = 600; expect(validSavedQuote(value)).toBe(false); });
});
