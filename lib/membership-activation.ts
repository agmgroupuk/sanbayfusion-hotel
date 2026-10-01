import "server-only";

import { hashPurchaseSnapshot } from "@/lib/membership-snapshot-hash";
import { parseISO } from "date-fns";
import { membershipTerm } from "@/lib/membership-term";
import { and, desc, eq, isNotNull, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { membershipDeliveryEntitlements, membershipRequests, type MembershipRequest } from "@/lib/db/schema";
import { sendMembershipPaymentReviewEmail } from "@/lib/email/membership-request";
import { buildMembershipDeliverySchedule } from "@/lib/membership-delivery";
import { lockMembershipApplication, assertMembershipPurchaseAllowed } from "@/lib/membership-access";
import { serviceMonthBounds, validateServiceMonths } from "@/lib/membership-service-months";
import { ApplicationError } from "@/lib/membership-errors";
import type { MembershipPurchaseSnapshot } from "@/lib/membership-request";
import { validSavedQuote } from "@/lib/membership-quote-integrity";

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
  snapshotHash,
}: {
  id: string;
  stripeCustomerId: string;
  paymentIntentId: string;
  amount: number;
  currency: string;
  purchaseMode: string;
  snapshotHash?: string;
}) {
  if (!db || currency !== "thb") return null;
  let notifyStaff = false;
  const row = await db.transaction(async tx => {
    const membership = (await tx.select().from(membershipRequests).where(eq(membershipRequests.id, id)).limit(1).for("update"))[0];
    if (!membership || membership.stripeCustomerId !== stripeCustomerId || amount !== membership.estimatedTotal * 100) return null;
    const snapshot = membership.purchaseSnapshot as { version?: number; purchaseMode?: string } | null;
    const expectedMode = snapshot?.purchaseMode === "membership_with_package" ? "MEMBERSHIP_WITH_PACKAGE" : "MEMBERSHIP_ONLY";
    if (purchaseMode !== expectedMode) return null;
    if (snapshot?.version && snapshot.version >= 3 && (membership.stripePaymentIntentId !== paymentIntentId || snapshotHash !== hashPurchaseSnapshot(snapshot))) return null;
    if (membership.invoiceStatus === "paid") return membership.stripePaymentIntentId === paymentIntentId ? membership : null;
    if (membership.status !== "payment_pending") return null;
    const [paid] = await tx.update(membershipRequests)
      .set({ status: "payment_received", invoiceStatus: "paid", stripePaymentIntentId: paymentIntentId })
      .where(and(eq(membershipRequests.id, id), eq(membershipRequests.status, "payment_pending")))
      .returning();
    notifyStaff = !!paid;
    return paid ?? null;
  });
  if (row && notifyStaff) {
    const purchase = row.purchaseSnapshot as { purchaseMode?: string; membershipFee?: number; packageSubtotal?: number } | null;
    try {
      await sendMembershipPaymentReviewEmail({
        customerName: row.fullName,
        customerEmail: row.email,
        customerPhone: row.phone,
        requestNumber: row.requestNumber,
        planName: row.planName,
        purchaseMode: purchase?.purchaseMode === "membership_with_package" ? "Membership + prepaid package" : "Membership only",
        membershipFee: purchase?.membershipFee ?? row.annualFee,
        packageSubtotal: purchase?.packageSubtotal ?? row.addOnTotal,
        totalPaid: row.estimatedTotal,
        durationMonths: row.durationMonths,
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
    const { row: membership, account } = await lockMembershipApplication(tx, id);
    await tx.execute(sql`select pg_advisory_xact_lock(731946201)`);
    if (membership.status === "active") return membership;
    if (membership.status !== "payment_received" || membership.invoiceStatus !== "paid") return null;
    if (membership.applicationSnapshot && !membership.approvedAt) return null;
    if (account) await assertMembershipPurchaseAllowed(tx, account, id);
    const purchase = membership.purchaseSnapshot as MembershipPurchaseSnapshot | null;
    if (purchase?.version === 4 && (!validSavedQuote(purchase) || validateServiceMonths(membership.selectedServiceMonths, membership.durationMonths) || JSON.stringify(purchase.selectedServiceMonths) !== JSON.stringify(membership.selectedServiceMonths))) throw new ApplicationError("The saved service months or benefit are invalid.", 409);

    const [latest] = await tx.select({ memberId: membershipRequests.memberId })
      .from(membershipRequests)
      .where(isNotNull(membershipRequests.memberId))
      .orderBy(desc(membershipRequests.memberId))
      .limit(1);
    const memberId = membership.memberId ?? nextMemberNumber(latest?.memberId);
    const activatedAt = new Date();
    const { startDate: membershipStartDate, expiryDate: membershipExpiryDate } = purchase?.version === 4
      ? serviceMonthBounds(membership.selectedServiceMonths!)
      : membershipTerm(activatedAt, membership.durationMonths);
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
      durationMonths: membership.durationMonths,
      deliveriesPerMonth: membership.deliveryDays,
      purchaseSnapshot: membership.purchaseSnapshot as import("@/lib/membership-request").MembershipPurchaseSnapshot | null,
    });
    if (schedule.length) await tx.insert(membershipDeliveryEntitlements).values(schedule).onConflictDoNothing();
    return row;
  });
}

export async function ensureMembershipDeliverySchedule(membership: MembershipRequest) {
  if (!db || membership.status !== "active" || !membership.membershipStartDate || membership.durationMonths < 1 || membership.deliveryDays < 1) return;
  const existing = await db.select({ id: membershipDeliveryEntitlements.id })
    .from(membershipDeliveryEntitlements)
    .where(eq(membershipDeliveryEntitlements.membershipRequestId, membership.id))
    .limit(1);
  if (existing.length) return;

  const schedule = buildMembershipDeliverySchedule({
    membershipRequestId: membership.id,
    startDate: parseISO(membership.membershipStartDate),
    durationMonths: membership.durationMonths,
    deliveriesPerMonth: membership.deliveryDays,
    purchaseSnapshot: membership.purchaseSnapshot as import("@/lib/membership-request").MembershipPurchaseSnapshot | null,
  });
  if (schedule.length) await db.insert(membershipDeliveryEntitlements).values(schedule).onConflictDoNothing();
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
