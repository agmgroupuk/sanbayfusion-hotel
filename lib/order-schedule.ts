import { bangkokDate, earliestServiceDate } from "./membership-service-months";
import { hasActiveMembership } from "./membership-term";
import { standardMealTimes } from "./standard-meal";

export const orderDeliveryTimes = standardMealTimes;
export const orderBusinessTimezone = "Asia/Bangkok";
type MembershipTerm = Parameters<typeof hasActiveMembership>[0];

/** Eligibility is required both today and on the selected service day. */
export function validateOrderSchedule(membership: MembershipTerm, date: string, time: string, now = new Date()) {
  if (!hasActiveMembership(membership, now)) return "An active membership for the current service month is required to place an order.";
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return "Choose a valid delivery date.";
  const serviceDay = new Date(`${date}T12:00:00+07:00`);
  if (!Number.isFinite(serviceDay.getTime()) || bangkokDate(serviceDay) !== date) return "Choose a valid delivery date.";
  if (date < earliestServiceDate(now)) return "Orders must be scheduled at least 3 days in advance.";
  if (!hasActiveMembership(membership, serviceDay)) return "Choose a delivery date within your active membership service months.";
  if (!orderDeliveryTimes.includes(time)) return "Choose an available delivery time.";
  return null;
}
