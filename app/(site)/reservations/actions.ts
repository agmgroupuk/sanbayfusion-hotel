"use server";

import { reservationSchema } from "@/lib/validations/reservation";
import {
  getAvailableSlots,
  isSlotAvailable,
  validateDate,
} from "@/lib/reservations/availability";
import { formatDateLong } from "@/lib/reservations/format";
import { db } from "@/lib/db";
import { reservations } from "@/lib/db/schema";
import { sendReservationEmails } from "@/lib/email/reservation";

export type ReservationResult =
  | { ok: true; message: string; reference?: string; demo?: boolean }
  | { ok: false; error: string };

/** Slots that can still seat the party on a date — drives the time picker. */
export async function getSlotsAction(
  dateKey: string,
  partySize: number,
): Promise<string[]> {
  if (!Number.isInteger(partySize) || partySize < 1) return [];
  return getAvailableSlots(dateKey, partySize);
}

export async function createReservationAction(
  raw: unknown,
): Promise<ReservationResult> {
  const parsed = reservationSchema.safeParse(raw);
  if (!parsed.success) {
    const first = parsed.error.issues[0]?.message ?? "Please check your details";
    return { ok: false, error: first };
  }
  const data = parsed.data;

  const dateCheck = validateDate(data.date);
  if (!dateCheck.ok) {
    return { ok: false, error: dateCheck.reason ?? "That date isn't available" };
  }

  // Re-check availability server-side to guard against races / stale forms.
  const available = await isSlotAvailable(
    data.date,
    data.timeSlot,
    data.partySize,
  );
  if (!available) {
    return {
      ok: false,
      error: "That time has just been taken — please choose another slot.",
    };
  }

  let reference: string | undefined;
  try {
    if (db) {
      const [row] = await db
        .insert(reservations)
        .values({
          name: data.name,
          email: data.email,
          phone: data.phone,
          partySize: data.partySize,
          date: data.date,
          timeSlot: data.timeSlot,
          specialRequests: data.specialRequests || null,
        })
        .returning({ id: reservations.id });
      reference = row?.id.slice(0, 8).toUpperCase();
    }
  } catch (err) {
    console.error("[reservation] insert failed", err);
    return {
      ok: false,
      error: "We couldn't save your reservation. Please try again or call us.",
    };
  }

  // Email is best-effort — never block a successful booking on it.
  try {
    await sendReservationEmails({
      ...data,
      specialRequests: data.specialRequests || undefined,
      dateLong: formatDateLong(data.date),
      reference,
    });
  } catch (err) {
    console.error("[reservation] email failed", err);
  }

  return {
    ok: true,
    reference,
    // No database means nothing was persisted — flag it so the UI is honest
    // rather than implying a confirmed booking.
    demo: !db,
    message: `Thank you, ${data.name}. Your table for ${data.partySize} on ${formatDateLong(
      data.date,
    )} at ${data.timeSlot} is requested — we'll confirm shortly.`,
  };
}
