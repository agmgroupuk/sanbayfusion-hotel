import "server-only";
import { membershipBenefitRedemptions, type MembershipRequest } from "@/lib/db/schema";
import type { MembershipTransaction } from "@/lib/membership-access";
import type { MembershipPurchaseSnapshot } from "@/lib/membership-request";
import { validSavedQuote } from "@/lib/membership-quote-integrity";
import { earliestServiceDate, bangkokDate } from "@/lib/membership-service-months";

export function standardMealEntitlementRows(membership: MembershipRequest, now = new Date()) {
  const purchase = membership.purchaseSnapshot as MembershipPurchaseSnapshot | null;
  if (membership.status !== "active" || membership.invoiceStatus !== "paid" || !purchase || purchase.version !== 4 || !validSavedQuote(purchase) || !purchase.includedBenefit) return [];
  return (purchase.selectedServiceMonths ?? []).map(serviceMonth => {
    const slot = purchase.standardMealSlots?.find(item => item.serviceMonth === serviceMonth);
    const scheduled = !!slot?.deliveryDate && !!slot.deliveryTime && slot.deliveryDate >= earliestServiceDate(now);
    return { membershipRequestId: membership.id, serviceMonth, mealName: purchase.includedBenefit!.name, menuValue: purchase.includedBenefit!.menuValue,
      scheduledDate: scheduled ? slot!.deliveryDate : null, scheduledTime: scheduled ? slot!.deliveryTime : null,
      status: serviceMonth < bangkokDate(now).slice(0, 7) ? "expired" : scheduled ? "scheduled" : "available" };
  });
}

export async function ensureStandardMealEntitlements(tx: MembershipTransaction, membership: MembershipRequest) {
  const rows = standardMealEntitlementRows(membership);
  if (rows.length) await tx.insert(membershipBenefitRedemptions).values(rows).onConflictDoNothing();
}
