import { addDays, addMonths, formatISO } from "date-fns";
import type { MembershipPurchaseSnapshot } from "@/lib/membership-request";

export type MembershipDeliveryPackageSnapshot = {
  purchaseMode: "membership_only" | "membership_with_package";
  products: Array<{ category: string; group?: string; name: string; productName?: string; variant?: string | null; unitPrice: number; quantity: number }>;
  addOns: Array<{ category: string; name: string; unitPrice: number; quantity: number }>;
};

/** Legacy v1/v2 agreements only. New packages do not imply delivery frequency. */
export function buildMembershipDeliverySchedule({
  membershipRequestId,
  startDate,
  durationMonths,
  deliveriesPerMonth,
  purchaseSnapshot,
}: {
  membershipRequestId: string;
  startDate: Date;
  durationMonths: number;
  deliveriesPerMonth: number;
  purchaseSnapshot: MembershipPurchaseSnapshot | null;
}) {
  if (purchaseSnapshot && purchaseSnapshot.version >= 3) return [];
  const schedule = [];
  const annualDeliveryCount = durationMonths * deliveriesPerMonth;

  for (let monthIndex = 0; monthIndex < durationMonths; monthIndex += 1) {
    const cycleStart = addMonths(startDate, monthIndex);
    const cycleEnd = addDays(addMonths(startDate, monthIndex + 1), -1);

    for (let sequence = 1; sequence <= deliveriesPerMonth; sequence += 1) {
      const annualSequence = monthIndex * deliveriesPerMonth + sequence - 1;
      const packageSnapshot: MembershipDeliveryPackageSnapshot = {
        purchaseMode: purchaseSnapshot?.purchaseMode ?? "membership_only",
        products: purchaseSnapshot?.purchaseMode === "membership_with_package"
          ? purchaseSnapshot.products.map((item) => ({
              category: item.category,
              group: item.group,
              name: item.name,
              productName: item.productName,
              variant: item.variant,
              unitPrice: item.unitPrice,
              quantity: item.quantityPerDelivery ?? 0,
            }))
          : [],
        addOns: purchaseSnapshot?.purchaseMode === "membership_with_package"
          ? purchaseSnapshot.addOns.flatMap((item) => {
              const baseQuantity = Math.floor(item.quantity / annualDeliveryCount);
              const quantity = baseQuantity + (annualSequence < item.quantity % annualDeliveryCount ? 1 : 0);
              return quantity > 0 ? [{ category: item.category, name: item.name, unitPrice: item.unitPrice, quantity }] : [];
            })
          : [],
      };

      schedule.push({
        membershipRequestId,
        cycleStartDate: formatISO(cycleStart, { representation: "date" }),
        cycleEndDate: formatISO(cycleEnd, { representation: "date" }),
        sequence,
        status: "available" as const,
        packageSnapshot,
      });
    }
  }

  return schedule;
}
