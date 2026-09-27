import "server-only";

import { addMonths, formatISO, parseISO } from "date-fns";
import { and, desc, eq, isNotNull, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { membershipDeliveryEntitlements, membershipRequests, type MembershipRequest } from "@/lib/db/schema";
import { sendMembershipPaymentReviewEmail } from "@/lib/email/membership-request";
import { buildMembershipDeliverySchedule } from "@/lib/membership-delivery";

export type MembershipLifecycleStatus =
  | "pending_review"
  | "verified"
  | "payment_pending"
  | "payment_received"
  | "active"
  | "expired"
  | "cancelled";

export function nextMemberNumber(value: string | null | undefined) {
  const number = value ? Number(value.replace(/\D/g, "")) : 0;
  return `SBF-M-${String(number + 1).padStart(6, "0")}`;
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

export async function recordMembershipPayment({
  id,
  stripeCustomerId,
  paymentIntentId,
  amount,
  currency,
  purchaseMode,
}: {
  id: string;
  stripeCustomerId: string;
  paymentIntentId: string;
  amount: number;
  currency: string;
  purchaseMode: string;
}) {
  if (!db || currency !== "thb") return null;
  const membership = (await db.select().from(membershipRequests).where(eq(membershipRequests.id, id)).limit(1))[0];
  if (!membership || membership.stripeCustomerId !== stripeCustomerId || amount !== membership.estimatedTotal * 100) return null;
  const snapshot = membership.purchaseSnapshot as { purchaseMode?: string } | null;
  const expectedMode = snapshot?.purchaseMode === "membership_with_package" ? "MEMBERSHIP_WITH_PACKAGE" : "MEMBERSHIP_ONLY";
  if (purchaseMode !== expectedMode) return null;
  if (membership.status === "active" || membership.status === "payment_received") {
    return membership.stripePaymentIntentId === paymentIntentId ? membership : null;
  }
  if (membership.status !== "payment_pending") return null;

  const [row] = await db.update(membershipRequests)
    .set({ status: "payment_received", invoiceStatus: "paid", stripePaymentIntentId: paymentIntentId })
    .where(and(eq(membershipRequests.id, id), eq(membershipRequests.status, "payment_pending")))
    .returning();
  if (row) {
    const purchase = row.purchaseSnapshot as { purchaseMode?: string; membershipFee?: number; packageSubtotal?: number } | null;
    try {
      await sendMembershipPaymentReviewEmail({
        customerName: row.fullName,
        customerEmail: row.email,
        customerPhone: row.phone,
        requestNumber: row.requestNumber,
        planName: row.planName,
        purchaseMode: purchase?.purchaseMode === "membership_with_package" ? "Membership + prepaid annual package" : "Membership only",
        membershipFee: purchase?.membershipFee ?? row.annualFee,
        packageSubtotal: purchase?.packageSubtotal ?? row.addOnTotal,
        totalPaid: row.estimatedTotal,
        deliveryDaysPerMonth: row.deliveryDays,
        deliveryDaysPerYear: row.annualDeliveryDays,
        paymentReference: paymentIntentId,
      });
    } catch (error) {
      console.error("[membership payment] staff review notification failed", error);
    }
  }
  return row ?? null;
}

export async function activateMembershipRequest({ id, actor }: { id: string; actor: string }) {
  if (!db) return null;
  return db.transaction(async (tx) => {
    await tx.execute(sql`select pg_advisory_xact_lock(731946201)`);
    const [membership] = await tx.select().from(membershipRequests).where(eq(membershipRequests.id, id)).limit(1);
    if (!membership) return null;
    if (membership.status === "active") return membership;
    if (membership.status !== "payment_received") return null;

    const [latest] = await tx.select({ memberId: membershipRequests.memberId })
      .from(membershipRequests)
      .where(isNotNull(membershipRequests.memberId))
      .orderBy(desc(membershipRequests.memberId))
      .limit(1);
    const memberId = membership.memberId ?? nextMemberNumber(latest?.memberId);
    const activatedAt = new Date();
    const expiryDate = addMonths(activatedAt, membership.validityMonths || 12);
    const membershipStartDate = formatISO(activatedAt, { representation: "date" });
    const membershipExpiryDate = formatISO(expiryDate, { representation: "date" });
    const [row] = await tx.update(membershipRequests)
      .set({
        status: "active",
        memberId,
        membershipNumber: memberId,
        membershipStartDate,
        membershipExpiryDate,
        activatedAt,
        activatedBy: actor,
        activationMethod: "APPROVED_AFTER_PAYMENT",
        invoiceStatus: "paid",
        finalMembershipSnapshot: {
          purchase: membership.purchaseSnapshot,
          memberId,
          membershipStartDate,
          membershipExpiryDate,
          activatedAt: activatedAt.toISOString(),
          activatedBy: actor,
        },
      })
      .where(and(eq(membershipRequests.id, id), eq(membershipRequests.status, "payment_received")))
      .returning();
    if (!row) return null;

    const schedule = buildMembershipDeliverySchedule({
      membershipRequestId: membership.id,
      startDate: activatedAt,
      validityMonths: membership.validityMonths || 12,
      deliveriesPerMonth: membership.deliveryDays,
      purchaseSnapshot: membership.purchaseSnapshot as import("@/lib/membership-request").MembershipPurchaseSnapshot | null,
    });
    await tx.insert(membershipDeliveryEntitlements).values(schedule).onConflictDoNothing();
    return row;
  });
}

export async function ensureMembershipDeliverySchedule(membership: MembershipRequest) {
  if (!db || membership.status !== "active" || !membership.membershipStartDate || membership.validityMonths < 1 || membership.deliveryDays < 1) return;
  const existing = await db.select({ id: membershipDeliveryEntitlements.id })
    .from(membershipDeliveryEntitlements)
    .where(eq(membershipDeliveryEntitlements.membershipRequestId, membership.id))
    .limit(1);
  if (existing.length) return;

  const schedule = buildMembershipDeliverySchedule({
    membershipRequestId: membership.id,
    startDate: parseISO(membership.membershipStartDate),
    validityMonths: membership.validityMonths,
    deliveriesPerMonth: membership.deliveryDays,
    purchaseSnapshot: membership.purchaseSnapshot as import("@/lib/membership-request").MembershipPurchaseSnapshot | null,
  });
  await db.insert(membershipDeliveryEntitlements).values(schedule).onConflictDoNothing();
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
