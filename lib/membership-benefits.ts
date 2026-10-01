import "server-only";
import { and, desc, eq, inArray } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/lib/db";
import { membershipBenefitRedemptions, membershipRequests, type CustomerAccount, type MembershipRequest } from "@/lib/db/schema";
import { lockMembershipApplication, membershipsForAccount } from "@/lib/membership-access";
import { ApplicationError } from "@/lib/membership-errors";
import { hasActiveMembership } from "@/lib/membership-term";
import { bangkokDate, earliestServiceDate, serviceMonthPattern } from "@/lib/membership-service-months";
import { validSavedQuote } from "@/lib/membership-quote-integrity";
import type { MembershipPurchaseSnapshot } from "@/lib/membership-request";
import { isMembershipAdmin } from "@/lib/membership-admin";

export const benefitRedemptionSchema = z.object({
  membershipId: z.string().uuid(),
  serviceMonth: z.string().regex(serviceMonthPattern),
  scheduledDate: z.string().date(),
}).strict();

export function validateBenefitEntitlement(membership: MembershipRequest, month: string, scheduledDate: string, now = new Date()) {
  const purchase = membership.purchaseSnapshot as MembershipPurchaseSnapshot | null;
  if (!hasActiveMembership(membership, now) || !purchase || purchase.version !== 4 || !validSavedQuote(purchase) || !purchase.includedBenefit || JSON.stringify(membership.selectedServiceMonths) !== JSON.stringify(purchase.selectedServiceMonths)) throw new ApplicationError("An approved, paid membership in its selected service month is required.", 403);
  if (month !== bangkokDate(now).slice(0, 7) || !membership.selectedServiceMonths?.includes(month)) throw new ApplicationError("This benefit is only available during its selected service month.", 403);
  if (!z.string().date().safeParse(scheduledDate).success || scheduledDate.slice(0, 7) !== month || scheduledDate < earliestServiceDate(now)) throw new ApplicationError("Choose a date in the current selected month with at least three days of advance notice.");
  return purchase.includedBenefit;
}

export async function redeemMemberBenefit(account: CustomerAccount, raw: unknown) {
  if (!db) throw new ApplicationError("Membership services are unavailable.", 503);
  const parsed = benefitRedemptionSchema.safeParse(raw);
  if (!parsed.success) throw new ApplicationError("Choose a valid benefit and service date.");
  const { membershipId, serviceMonth, scheduledDate } = parsed.data;
  return db.transaction(async tx => {
    const { row } = await lockMembershipApplication(tx, membershipId, account.id);
    const benefit = validateBenefitEntitlement(row, serviceMonth, scheduledDate);
    const [existing] = await tx.select().from(membershipBenefitRedemptions).where(and(eq(membershipBenefitRedemptions.membershipRequestId, row.id), eq(membershipBenefitRedemptions.serviceMonth, serviceMonth))).limit(1);
    if (existing) throw new ApplicationError("The complimentary benefit for this month has already been requested or redeemed.", 409);
    const [redemption] = await tx.insert(membershipBenefitRedemptions).values({ membershipRequestId: row.id, serviceMonth, scheduledDate, mealName: benefit.name, menuValue: benefit.menuValue }).returning();
    return { id: redemption.id, status: redemption.status, chargedAmount: 0 };
  });
}

export async function benefitRedemptionsForAccount(account: CustomerAccount) {
  const memberships = await membershipsForAccount(account);
  return memberships.length ? db!.select().from(membershipBenefitRedemptions).where(inArray(membershipBenefitRedemptions.membershipRequestId, memberships.map(row => row.id))) : [];
}

export async function pendingMemberBenefits(account: CustomerAccount) {
  if (!isMembershipAdmin(account.email)) throw new ApplicationError("Administrator access required.", 403);
  if (!db) throw new ApplicationError("Membership services are unavailable.", 503);
  return db.select({ redemption: membershipBenefitRedemptions, name: membershipRequests.fullName, reference: membershipRequests.requestNumber })
    .from(membershipBenefitRedemptions).innerJoin(membershipRequests, eq(membershipRequests.id, membershipBenefitRedemptions.membershipRequestId))
    .where(eq(membershipBenefitRedemptions.status, "requested")).orderBy(desc(membershipBenefitRedemptions.redeemedAt)).limit(100);
}

export async function fulfillMemberBenefit(account: CustomerAccount, id: string) {
  if (!isMembershipAdmin(account.email)) throw new ApplicationError("Administrator access required.", 403);
  if (!db) throw new ApplicationError("Membership services are unavailable.", 503);
  if (!z.string().uuid().safeParse(id).success) throw new ApplicationError("Invalid benefit reference.");
  const [row] = await db.update(membershipBenefitRedemptions).set({ status: "fulfilled", fulfilledAt: new Date(), fulfilledBy: account.email })
    .where(and(eq(membershipBenefitRedemptions.id, id), eq(membershipBenefitRedemptions.status, "requested"))).returning();
  if (!row) throw new ApplicationError("Benefit not found or already fulfilled.", 409);
  return row;
}
