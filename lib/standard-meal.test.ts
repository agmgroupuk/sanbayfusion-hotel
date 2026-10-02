import { describe, expect, it } from "vitest";
import { standardMealAmounts, standardMealTimes, validateStandardMealSlots, standardMealStatus } from "./standard-meal";
import { membershipPlans, membershipPreferredTimes, beverageAddOns } from "./membership-plans";
import { validateMembershipConfiguration } from "./membership-request";
import { catalogueCategories } from "./catalogue";

const now = new Date("2026-10-02T12:00:00+07:00");
const months = ["2027-02", "2027-07", "2027-11"];
const config = { planSlug: "3-month-membership", selectedServiceMonths: months, purchaseMode: "membership_only", foodPreferences: [], deliveryArea: "Bangkok", preferredDay: "Monday", preferredTime: membershipPreferredTimes[0], alcoholEnabled: false, selectedProducts: [], selectedAddOns: [] };
describe("Standard Meal allowances and optional scheduling", () => {
  it("matches all approved allowances without changing membership prices", () => {
    expect(membershipPlans.map(plan => plan.includedBenefit.menuValue)).toEqual([3000, 4000, 5000, 6000, 7000, 8000, 9000, 10000, 11000, 12500, 14000, 15000]);
    expect(membershipPlans.every(plan => plan.includedBenefit.name === "Standard Meal" && plan.includedBenefit.quantityPerServiceMonth === 1 && plan.includedBenefit.cashValue === 0)).toBe(true);
  });
  it("accepts zero, some or all scheduled meals with exactly one snapshot slot per selected month", () => {
    for (let count = 0; count <= 3; count++) {
      const slots = months.slice(0, count).map(serviceMonth => ({ serviceMonth, deliveryDate: `${serviceMonth}-14`, deliveryTime: "19:30" }));
      const result = validateMembershipConfiguration({ ...config, standardMealSlots: slots, menuValue: 999999, total: 1 }, now);
      expect(result.ok).toBe(true);
      if (!result.ok) throw new Error(result.error);
      expect(result.total).toBe(15000);
      expect(result.purchaseSnapshot.includedBenefit?.menuValue).toBe(5000);
      expect(result.purchaseSnapshot.standardMealSlots).toHaveLength(3);
      expect(result.purchaseSnapshot.standardMealSlots?.filter(slot => slot.deliveryDate)).toHaveLength(count);
    }
  });
  it.each([
    { serviceMonth: "2027-02", deliveryDate: "2027-07-14", deliveryTime: "19:30" },
    { serviceMonth: "2027-02", deliveryDate: "2027-02-29", deliveryTime: "19:30" },
    { serviceMonth: "2027-02", deliveryDate: "2027-02-14", deliveryTime: "10:30" },
    { serviceMonth: "2027-02", deliveryDate: "2027-02-14", deliveryTime: "24:30" },
    { serviceMonth: "2027-02", deliveryDate: "2027-02-14", deliveryTime: null },
    { serviceMonth: "2027-04", deliveryDate: "2027-04-14", deliveryTime: "19:30" },
  ])("rejects invalid or incomplete slot %j", slot => expect(validateStandardMealSlots([slot], months, now)).toBeTruthy());
  it("allows every weekday, midnight, leap day and enforces three days in Bangkok", () => {
    for (let day = 8; day <= 14; day++) expect(validateStandardMealSlots([{ serviceMonth: "2027-02", deliveryDate: `2027-02-${String(day).padStart(2, "0")}`, deliveryTime: "24:00" }], months, now)).toBeNull();
    expect(standardMealTimes.at(0)).toBe("11:00"); expect(standardMealTimes.at(-1)).toBe("24:00");
    expect(validateStandardMealSlots([{ serviceMonth: "2028-02", deliveryDate: "2028-02-29", deliveryTime: "11:00" }], ["2028-02"])).toBeNull();
    expect(validateStandardMealSlots([{ serviceMonth: "2026-10", deliveryDate: "2026-10-04", deliveryTime: "11:00" }], ["2026-10"], now)).toMatch(/three days/);
    expect(validateStandardMealSlots([{ serviceMonth: "2026-10", deliveryDate: "2026-10-05", deliveryTime: "11:00" }], ["2026-10"], now)).toBeNull();
    const slot = { serviceMonth: months[0], deliveryDate: null, deliveryTime: null };
    expect(validateStandardMealSlots([slot, slot], months, now)).toBeTruthy();
  });
  it("charges only the excess and never returns unused allowance as money", () => {
    expect(standardMealAmounts(2700, 3000)).toEqual({ allowanceApplied: 2700, total: 0 });
    expect(standardMealAmounts(3800, 3000)).toEqual({ allowanceApplied: 3000, total: 800 });
    expect(standardMealStatus({ serviceMonth: "2026-09", status: "available" }, now)).toBe("EXPIRED");
    expect(standardMealStatus({ serviceMonth: "2026-09", status: "redeemed" }, now)).toBe("REDEEMED");
  });
  it("rejects alcohol injection regardless of mode, flags or fake client prices, without removing the main catalogue", () => {
    const alcohol = catalogueCategories.filter(category => category.group === "alcohol");
    expect(alcohol.length).toBeGreaterThan(0);
    for (const category of alcohol) for (const alcoholEnabled of [false, true]) {
      const result = validateMembershipConfiguration({ ...config, alcoholEnabled, purchaseMode: "membership_with_package", selectedProducts: [{ category: category.name, name: category.products[0].name, quantity: 1, group: "food", unitPrice: 0 }] }, now);
      expect(result).toMatchObject({ ok: false, error: expect.stringContaining("Alcohol cannot") });
    }
    for (const addOn of beverageAddOns) expect(validateMembershipConfiguration({ ...config, selectedAddOns: [{ category: addOn.category, name: addOn.options[0], quantity: 1 }] }, now)).toMatchObject({ ok: false });
    const drink = catalogueCategories.find(category => category.group === "drinks")!;
    expect(validateMembershipConfiguration({ ...config, purchaseMode: "membership_with_package", selectedProducts: [{ category: drink.name, name: drink.products[0].name, quantity: 2 }] }, now)).toMatchObject({ ok: true });
  });
});
