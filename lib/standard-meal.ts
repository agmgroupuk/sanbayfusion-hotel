import { bangkokDate, earliestServiceDate, serviceMonthPattern } from "./membership-service-months";

export const standardMealAllowances = [3000, 4000, 5000, 6000, 7000, 8000, 9000, 10000, 11000, 12500, 14000, 15000] as const;
export type StandardMealSlot = { serviceMonth: string; deliveryDate: string | null; deliveryTime: string | null };
// Midnight closes the selected delivery day, represented as 24:00 rather than the next day's 00:00.
export const standardMealTimes = Array.from({ length: 27 }, (_, i) => `${String(11 + Math.floor(i / 2)).padStart(2, "0")}:${i % 2 ? "30" : "00"}`);
export function standardMealTimeLabel(time: string) {
  if (time === "24:00") return "12:00 midnight (end of day)";
  const [hour, minute] = time.split(":").map(Number);
  return `${hour % 12 || 12}:${String(minute).padStart(2, "0")} ${hour < 12 ? "AM" : "PM"}`;
}
export function standardMealDateBounds(month: string, now = new Date()) {
  const [year, number] = month.split("-").map(Number);
  const first = `${month}-01`, last = new Date(Date.UTC(year, number, 0)).toISOString().slice(0, 10);
  return { min: [first, earliestServiceDate(now)].sort().at(-1)!, max: last };
}
export function validateStandardMealSlots(slots: StandardMealSlot[] | undefined, months: string[], now?: Date): string | null {
  const seen = new Set<string>();
  for (const slot of slots ?? []) {
    if (!serviceMonthPattern.test(slot.serviceMonth) || !months.includes(slot.serviceMonth) || seen.has(slot.serviceMonth)) return "Schedule at most one Standard Meal for each selected service month.";
    seen.add(slot.serviceMonth);
    if (!slot.deliveryDate && !slot.deliveryTime) continue;
    if (!slot.deliveryDate || !slot.deliveryTime) return "Choose both a date and time, or select Schedule later.";
    const date = slot.deliveryDate;
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || date.slice(0, 7) !== slot.serviceMonth || date > standardMealDateBounds(slot.serviceMonth).max || date < `${slot.serviceMonth}-01`) return "The Standard Meal delivery date must be a valid day in its selected month.";
    if (now && date < earliestServiceDate(now)) return "Choose a delivery date with at least three days of advance notice.";
    if (!standardMealTimes.includes(slot.deliveryTime)) return "Choose an available delivery time from 11:00 AM through midnight.";
  }
  return null;
}
export function standardMealStatus(row: { status: string; serviceMonth: string }, now = new Date()) {
  if (row.status === "redeemed" || row.status === "fulfilled") return "REDEEMED";
  if (row.serviceMonth < bangkokDate(now).slice(0, 7)) return "EXPIRED";
  return row.status.toUpperCase();
}
export function standardMealAmounts(eligibleFoodTotal: number, allowance: number) {
  const applied = Math.min(eligibleFoodTotal, allowance);
  return { allowanceApplied: applied, total: eligibleFoodTotal - applied };
}
