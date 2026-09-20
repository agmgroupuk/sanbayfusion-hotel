import { and, eq, inArray, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { reservations } from "@/lib/db/schema";
import { reservationConfig, isClosedDate } from "./config";

const ACTIVE = ["pending", "confirmed"] as const;

/** Parse a YYYY-MM-DD key into a local Date at midnight. */
function parseDateKey(key: string): Date {
  const [y, m, d] = key.split("-").map(Number);
  return new Date(y, m - 1, d);
}

/** Booked covers per time slot for a given date. Empty when no DB configured. */
async function coversBySlot(dateKey: string): Promise<Record<string, number>> {
  if (!db) return {};
  const rows = await db
    .select({
      timeSlot: reservations.timeSlot,
      covers: sql<number>`coalesce(sum(${reservations.partySize}), 0)`,
    })
    .from(reservations)
    .where(
      and(
        eq(reservations.date, dateKey),
        inArray(reservations.status, [...ACTIVE]),
      ),
    )
    .groupBy(reservations.timeSlot);

  const map: Record<string, number> = {};
  for (const r of rows) map[r.timeSlot] = Number(r.covers);
  return map;
}

export interface DateValidation {
  ok: boolean;
  reason?: string;
}

/** Is this date bookable at all (within window, not closed)? */
export function validateDate(dateKey: string): DateValidation {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateKey)) return { ok: false, reason: "Invalid date" };
  const date = parseDateKey(dateKey);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const min = new Date(today);
  min.setDate(min.getDate() + reservationConfig.leadDays);
  const max = new Date(today);
  max.setDate(max.getDate() + reservationConfig.windowDays);

  if (date < min) return { ok: false, reason: "Please choose a later date" };
  if (date > max) return { ok: false, reason: "That date is beyond our booking window" };
  if (isClosedDate(date)) return { ok: false, reason: "We are closed on that day" };
  return { ok: true };
}

/** Slots that can still seat `partySize` guests on `dateKey`. */
export async function getAvailableSlots(
  dateKey: string,
  partySize: number,
): Promise<string[]> {
  const validation = validateDate(dateKey);
  if (!validation.ok) return [];

  const booked = await coversBySlot(dateKey);
  return reservationConfig.serviceTimes.filter((slot) => {
    const remaining = reservationConfig.maxCoversPerSlot - (booked[slot] ?? 0);
    return remaining >= partySize;
  });
}

/** Authoritative check used inside the server action before inserting. */
export async function isSlotAvailable(
  dateKey: string,
  timeSlot: string,
  partySize: number,
): Promise<boolean> {
  if (!validateDate(dateKey).ok) return false;
  if (!(reservationConfig.serviceTimes as readonly string[]).includes(timeSlot))
    return false;
  const booked = await coversBySlot(dateKey);
  const remaining = reservationConfig.maxCoversPerSlot - (booked[timeSlot] ?? 0);
  return remaining >= partySize;
}
