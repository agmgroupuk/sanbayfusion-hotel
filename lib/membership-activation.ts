import "server-only";

import { addMonths, formatISO } from "date-fns";
import { and, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { membershipRequests } from "@/lib/db/schema";

export type MembershipLifecycleStatus =
  | "pending_review"
  | "verified"
  | "payment_pending"
  | "active"
  | "expired"
  | "cancelled";

export function nextMemberNumber(value: string | null | undefined) {
  const number = value ? Number(value.replace(/\D/g, "")) : 0;
  return `SBF-M-${String(number + 1).padStart(6, "0")}`;
}

export async function generateMemberId() {
  if (!db) return "SBF-M-000001";
  const result = await db.select({ memberId: membershipRequests.memberId }).from(membershipRequests).where(eq(membershipRequests.memberId, membershipRequests.memberId)).limit(1);
  const latest = result[0]?.memberId ?? null;
  return nextMemberNumber(latest);
}

export async function markMembershipVerified(id: string) {
  if (!db) return null;
  const [row] = await db.update(membershipRequests)
    .set({ status: "verified", verifiedAt: new Date() })
    .where(eq(membershipRequests.id, id))
    .returning();
  return row ?? null;
}

export async function markMembershipPaymentPending(id: string, stripeCustomerId?: string | null, stripeInvoiceId?: string | null, stripePaymentIntentId?: string | null) {
  if (!db) return null;
  const [row] = await db.update(membershipRequests)
    .set({
      status: "payment_pending",
      invoiceStatus: "awaiting_payment",
      stripeCustomerId: stripeCustomerId ?? undefined,
      stripeInvoiceId: stripeInvoiceId ?? undefined,
      stripePaymentIntentId: stripePaymentIntentId ?? undefined,
      paymentDueAt: new Date(),
    })
    .where(eq(membershipRequests.id, id))
    .returning();
  return row ?? null;
}

export async function activateMembershipRequest({ id, method, actor }: { id: string; method: "STRIPE_PAYMENT" | "MANUAL_ADMIN"; actor?: string }) {
  if (!db) return null;
  const request = await db.select().from(membershipRequests).where(eq(membershipRequests.id, id)).limit(1);
  const membership = request[0];
  if (!membership) return null;
  if (membership.status === "active") return membership;

  const memberId = membership.memberId ?? (await generateMemberId());
  const startDate = new Date();
  const expiryDate = addMonths(startDate, membership.validityMonths || 12);
  const startIso = formatISO(startDate, { representation: "date" });
  const expiryIso = formatISO(expiryDate, { representation: "date" });

  const [row] = await db.update(membershipRequests)
    .set({
      status: "active",
      memberId,
      membershipNumber: memberId,
      membershipStartDate: startIso,
      membershipExpiryDate: expiryIso,
      activatedAt: new Date(),
      activatedBy: actor ?? "system",
      activationMethod: method,
      invoiceStatus: "paid",
    })
    .where(eq(membershipRequests.id, id))
    .returning();

  return row ?? null;
}

export async function findMembershipByStripeCustomerId(stripeCustomerId: string) {
  if (!db) return null;
  const rows = await db.select().from(membershipRequests).where(and(eq(membershipRequests.stripeCustomerId, stripeCustomerId), eq(membershipRequests.status, "payment_pending"))).limit(1);
  return rows[0] ?? null;
}

export async function findMembershipByStripeInvoiceId(stripeInvoiceId: string) {
  if (!db) return null;
  const rows = await db.select().from(membershipRequests).where(and(eq(membershipRequests.stripeInvoiceId, stripeInvoiceId), eq(membershipRequests.status, "payment_pending"))).limit(1);
  return rows[0] ?? null;
}
