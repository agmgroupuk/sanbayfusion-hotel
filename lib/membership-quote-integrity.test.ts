import { describe, expect, it } from "vitest";
import { hasInactiveMembershipProducts, validSavedQuote } from "@/lib/membership-quote-integrity";
import { validateMembershipConfiguration } from "@/lib/membership-request";
import { calendarMonths, serviceYears } from "@/lib/membership-service-months";
import { membershipPreferredTimes } from "@/lib/membership-plans";
const configuration = { planSlug: "3-month-membership", selectedServiceMonths: calendarMonths(serviceYears()[1]).slice(0, 3), purchaseMode: "membership_with_package", foodPreferences: [], deliveryArea: "Bangkok", preferredDay: "Monday", preferredTime: membershipPreferredTimes[0], selectedProducts: [{ category: "Thai soups", name: "Tom Yum Goong", quantity: 4 }] };
function quote() { const result = validateMembershipConfiguration(configuration); if (!result.ok) throw new Error(result.error); return result.purchaseSnapshot; }
describe("immutable quote arithmetic", () => {
 it("accepts the saved quote without reading new catalog prices", () => { expect(validSavedQuote(quote())).toBe(true); });
 it("rejects changed totals", () => { const value = quote(); value.total++; expect(validSavedQuote(value)).toBe(false); });
 it("rejects changed term quantities even if totals remain unchanged", () => { const value = quote(); value.products[0].totalTermQuantity = 4; expect(validSavedQuote(value)).toBe(false); });
 it("rejects delivery-based multiplication", () => { const value = quote(); value.products[0].durationMonths = 12; expect(validSavedQuote(value)).toBe(false); });
 it("preserves historical quote arithmetic but rejects retired invoice items for new charges", () => {
  const value = quote();
  value.addOns.push({ category: "wine", name: "Red Wine", quantity: 1, unitPrice: 100, pricingType: "ONE_TIME", durationMonths: 3, totalTermQuantity: 1, lineTotal: 100 });
  value.packageSubtotal += 100;
  value.total += 100;
  expect(validSavedQuote(value)).toBe(true);
  expect(hasInactiveMembershipProducts(value)).toBe(true);
 });
 it("rejects a retired product name even when its category is forged", () => {
  const value = quote();
  value.products[0].category = "Soft drinks, coffee, tea & juices";
  value.products[0].name = "Wine";
  expect(hasInactiveMembershipProducts(value)).toBe(true);
 });
 it("rejects a retired-product charge embedded in a saved invoice snapshot", () => {
  const value = quote();
  value.charges = [{ code: "EVENT", label: "Wine requirements", amount: 100 }];
  value.total += 100;
  expect(validSavedQuote(value)).toBe(true);
  expect(hasInactiveMembershipProducts(value)).toBe(true);
 });
});
