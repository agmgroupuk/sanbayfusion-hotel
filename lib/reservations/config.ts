/** Reservation rules. A graduation point: move these into Sanity siteSettings later. */
export const reservationConfig = {
  /** Bookable seating times (24h "HH:mm"). One menu, served across these slots. */
  serviceTimes: ["18:00", "18:30", "19:00", "19:30", "20:00", "20:30", "21:00"],
  /** Total covers the kitchen can seat in a single time slot. */
  maxCoversPerSlot: 16,
  minPartySize: 1,
  maxPartySize: 8,
  /** Booking window, in days from today. */
  leadDays: 1,
  windowDays: 60,
  /** Days the restaurant is closed (0 = Sunday … 6 = Saturday). */
  closedWeekdays: [0, 1],
} as const;

export function isClosedDate(date: Date): boolean {
  return reservationConfig.closedWeekdays.includes(
    date.getDay() as (typeof reservationConfig.closedWeekdays)[number],
  );
}

/** Format a Date as a local YYYY-MM-DD (no timezone drift). */
export function toDateKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}
