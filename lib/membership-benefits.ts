import "server-only";
import { and, desc, eq, inArray, isNull, lt } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/lib/db";
import { membershipBenefitRedemptions, membershipRequests, type CustomerAccount, type MembershipRequest } from "@/lib/db/schema";
import { lockMembershipApplication, membershipsForAccount } from "@/lib/membership-access";
import { ApplicationError } from "@/lib/membership-errors";
import { bangkokDate, serviceMonthPattern } from "@/lib/membership-service-months";
import { validSavedQuote } from "@/lib/membership-quote-integrity";
import type { MembershipPurchaseSnapshot } from "@/lib/membership-request";
import { isMembershipAdmin } from "@/lib/membership-admin";
import { validateStandardMealSlots } from "@/lib/standard-meal";
import { ensureStandardMealEntitlements } from "@/lib/standard-meal-entitlements";

export const benefitRedemptionSchema = z.object({ membershipId: z.string().uuid(), serviceMonth: z.string().regex(serviceMonthPattern), scheduledDate: z.string().date(), scheduledTime: z.string() }).strict();

export function validateBenefitEntitlement(membership: MembershipRequest, month: string, scheduledDate: string, scheduledTime: string, now = new Date()) {
  const purchase = membership.purchaseSnapshot as MembershipPurchaseSnapshot | null;
  if (membership.status !== "active" || membership.invoiceStatus !== "paid" || !purchase || purchase.version !== 4 || !validSavedQuote(purchase) || !purchase.includedBenefit || JSON.stringify(membership.selectedServiceMonths) !== JSON.stringify(purchase.selectedServiceMonths)) throw new ApplicationError("An approved, paid membership is required.", 403);
  if (!membership.selectedServiceMonths?.includes(month) || month < bangkokDate(now).slice(0, 7)) throw new ApplicationError("This benefit is only available for its unexpired selected service month.", 403);
  const error = validateStandardMealSlots([{ serviceMonth: month, deliveryDate: scheduledDate, deliveryTime: scheduledTime }], membership.selectedServiceMonths, now);
  if (error) throw new ApplicationError(error);
  return purchase.includedBenefit;
}

/** Scheduling reserves a delivery preference, never spends the allowance. */
export async function redeemMemberBenefit(account: CustomerAccount, raw: unknown) {
  if (!db) throw new ApplicationError("Membership services are unavailable.", 503);
  const parsed = benefitRedemptionSchema.safeParse(raw);
  if (!parsed.success) throw new ApplicationError("Choose a valid benefit, service date and time.");
  const { membershipId, serviceMonth, scheduledDate, scheduledTime } = parsed.data;
  return db.transaction(async tx => {
    const { row } = await lockMembershipApplication(tx, membershipId, account.id);
    validateBenefitEntitlement(row, serviceMonth, scheduledDate, scheduledTime);
    await ensureStandardMealEntitlements(tx, row);
    const [existing] = await tx.select().from(membershipBenefitRedemptions).where(and(eq(membershipBenefitRedemptions.membershipRequestId, row.id), eq(membershipBenefitRedemptions.serviceMonth, serviceMonth))).limit(1).for("update");
    if (!existing || existing.orderId || !["available", "scheduled"].includes(existing.status)) throw new ApplicationError("This month's meal is already reserved for an order, redeemed or expired.", 409);
    const [saved] = await tx.update(membershipBenefitRedemptions).set({ scheduledDate, scheduledTime, status: "scheduled" }).where(eq(membershipBenefitRedemptions.id, existing.id)).returning();
    return { id: saved.id, status: saved.status, chargedAmount: 0 };
  });
}

export async function benefitRedemptionsForAccount(account: CustomerAccount) {
  if (!db) return [];
  const memberships = await membershipsForAccount(account);
  if (!memberships.length) return [];
  await db.transaction(async tx => {
    for (const row of memberships) await ensureStandardMealEntitlements(tx, row);
    await tx.update(membershipBenefitRedemptions).set({ status: "expired" }).where(and(inArray(membershipBenefitRedemptions.membershipRequestId, memberships.map(row => row.id)), inArray(membershipBenefitRedemptions.status, ["available", "scheduled"]), lt(membershipBenefitRedemptions.serviceMonth, bangkokDate().slice(0, 7)), isNull(membershipBenefitRedemptions.orderId)));
  });
  return db.select().from(membershipBenefitRedemptions).where(inArray(membershipBenefitRedemptions.membershipRequestId, memberships.map(row => row.id)));
}

export async function pendingMemberBenefits(account: CustomerAccount) {
  if (!isMembershipAdmin(account.email)) throw new ApplicationError("Administrator access required.", 403);
  if (!db) throw new ApplicationError("Membership services are unavailable.", 503);
  return db.select({ redemption: membershipBenefitRedemptions, name: membershipRequests.fullName, reference: membershipRequests.requestNumber })
    .from(membershipBenefitRedemptions).innerJoin(membershipRequests, eq(membershipRequests.id, membershipBenefitRedemptions.membershipRequestId))
    .where(and(inArray(membershipBenefitRedemptions.status, ["scheduled", "reserved", "redeemed"]), isNull(membershipBenefitRedemptions.fulfilledAt))).orderBy(desc(membershipBenefitRedemptions.scheduledDate)).limit(100);
}

export async function fulfillMemberBenefit(account: CustomerAccount, id: string) {
  if (!isMembershipAdmin(account.email)) throw new ApplicationError("Administrator access required.", 403);
  if (!db) throw new ApplicationError("Membership services are unavailable.", 503);
  if (!z.string().uuid().safeParse(id).success) throw new ApplicationError("Invalid benefit reference.");
  return db.transaction(async tx => {
    const [benefit] = await tx.select().from(membershipBenefitRedemptions).where(eq(membershipBenefitRedemptions.id, id)).limit(1).for("update");
    const [membership] = benefit ? await tx.select().from(membershipRequests).where(eq(membershipRequests.id, benefit.membershipRequestId)).limit(1) : [];
    // Preserve fulfillment of historical free-meal requests recorded before Standard Meal ordering.
    const legacy = !!membership && (membership.purchaseSnapshot as MembershipPurchaseSnapshot)?.includedBenefit?.kind !== "standard_meal" && benefit?.status === "scheduled" && !benefit.orderId;
    if (!benefit || benefit.fulfilledAt || (benefit.status !== "redeemed" && !legacy)) throw new ApplicationError("Confirm the meal order and any excess payment before fulfillment, or check whether it was already fulfilled.", 409);
    const [row] = await tx.update(membershipBenefitRedemptions).set({ status: "redeemed", redeemedAt: benefit.redeemedAt ?? new Date(), fulfilledAt: new Date(), fulfilledBy: account.email }).where(eq(membershipBenefitRedemptions.id, id)).returning();
    return row;
  });
}
