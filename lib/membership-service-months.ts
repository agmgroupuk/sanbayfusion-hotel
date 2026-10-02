/** Calendar service months and scheduling are evaluated in Thailand time. */
export const serviceMonthPattern = /^\d{4}-(0[1-9]|1[0-2])$/;
export const membershipAdvanceNoticeDays = 3;

export function bangkokDate(now = new Date()) {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Bangkok", year: "numeric", month: "2-digit", day: "2-digit" }).format(now);
}

export function earliestServiceDate(now = new Date()) {
  // Calendar-day cutoff: any time on October 7 (Bangkok) permits October 10.
  const date = new Date(`${bangkokDate(now)}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + membershipAdvanceNoticeDays);
  return date.toISOString().slice(0, 10);
}

export function serviceYears(now = new Date()) {
  const year = Number(bangkokDate(now).slice(0, 4));
  return [year, year + 1];
}

export function calendarMonths(year: number) {
  return Array.from({ length: 12 }, (_, index) => `${year}-${String(index + 1).padStart(2, "0")}`);
}

export function serviceMonthLabel(month: string, short = false) {
  if (!serviceMonthPattern.test(month)) return month;
  return new Intl.DateTimeFormat("en-GB", { month: short ? "short" : "long", year: "numeric", timeZone: "Asia/Bangkok" }).format(new Date(`${month}-01T00:00:00+07:00`));
}

export function serviceMonthState(month: string, now = new Date()): "UPCOMING" | "CURRENT" | "COMPLETED" {
  const current = bangkokDate(now).slice(0, 7);
  return month === current ? "CURRENT" : month < current ? "COMPLETED" : "UPCOMING";
}

export function isEligibleServiceMonth(month: string, now = new Date()) {
  return serviceMonthPattern.test(month) && serviceYears(now).includes(Number(month.slice(0, 4))) && month >= earliestServiceDate(now).slice(0, 7);
}

/** Structural checks also apply to saved agreements; eligibility applies at purchase. */
export function validateServiceMonths(value: unknown, count: number, now?: Date): string | null {
  if (!Number.isInteger(count) || count < 1 || count > 12 || !Array.isArray(value) || value.length !== count) return `Select exactly ${count} service ${count === 1 ? "month" : "months"}.`;
  if (!value.every(month => typeof month === "string" && serviceMonthPattern.test(month))) return "Choose valid months with an explicit year.";
  if (new Set(value).size !== count) return "Select different service months; a month cannot be selected twice.";
  if (new Set(value.map(month => month.slice(0, 4))).size !== 1) return "Select your service months within one calendar year.";
  if (now && !value.every(month => isEligibleServiceMonth(month, now))) return "A selected month is no longer eligible. Choose current or future months in the current or next year, allowing at least three days for scheduling.";
  return null;
}

export function serviceMonthBounds(months: string[]) {
  const sorted = [...months].sort();
  const [year, month] = sorted[sorted.length - 1].split("-").map(Number);
  return { startDate: `${sorted[0]}-01`, expiryDate: new Date(Date.UTC(year, month, 1)).toISOString().slice(0, 10) };
}

export type IncludedMemberBenefit = {
  kind?: "standard_meal";
  name: string;
  menuValue: number;
  quantityPerServiceMonth: 1;
  cashValue: 0;
};

export const complimentaryBenefitConditions = "One Standard Meal redemption per selected service month. Eligible food above the allowance is payable; additional orders are charged separately. Unused allowance has no cash value, cannot be transferred or withdrawn, and does not roll over. Menu and scheduling are subject to confirmation.";
