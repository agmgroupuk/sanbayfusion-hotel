import { beforeEach, describe, expect, it, vi } from "vitest";
const jar = vi.hoisted(() => new Map<string, string>());
vi.mock("server-only", () => ({}));
vi.mock("next/headers", () => ({ cookies: async () => ({ get: (name: string) => jar.has(name) ? { value: jar.get(name)! } : undefined, set: (name: string, value: string, options?: {maxAge?:number}) => options?.maxAge === 0 ? jar.delete(name) : jar.set(name, value), delete: (name: string) => jar.delete(name) }) }));
import { saveMembershipCheckoutSelection, readMembershipCheckoutSelection, clearMembershipCheckoutSelection, membershipCheckoutCookie } from "@/lib/membership-checkout";
import { membershipPreferredTimes } from "@/lib/membership-plans";
const configuration = { planSlug: "3-month-membership", selectedServiceMonths: ["2027-02", "2027-07", "2027-11"], purchaseMode: "membership_with_package", foodPreferences: [], deliveryArea: "Bangkok", preferredDay: "Monday", preferredTime: membershipPreferredTimes[0], selectedProducts: Array.from({ length: 100 }, (_, i) => ({ category: "Long category name", name: `Product ${i} with long descriptive text and a size variation`, quantity: i + 1 })) };
beforeEach(() => jar.clear());
describe("membership cart persistence", () => {
 it("round-trips a complete 100-product configuration within cookie size limits", async () => { expect(JSON.stringify(configuration).length).toBeGreaterThan(4096); await saveMembershipCheckoutSelection(configuration.planSlug, configuration); expect((await readMembershipCheckoutSelection())?.configuration).toEqual(configuration); for (const value of jar.values()) expect(value.length).toBeLessThan(3000); });
 it("fails closed for corrupted cart data", async () => { jar.set(membershipCheckoutCookie, "v2:1"); jar.set(`${membershipCheckoutCookie}_0`, "bad-data"); expect(await readMembershipCheckoutSelection()).toBeNull(); });
 it("clears all chunks on completion", async () => { await saveMembershipCheckoutSelection(configuration.planSlug, configuration); await clearMembershipCheckoutSelection(); expect(jar.size).toBe(0); });
});
