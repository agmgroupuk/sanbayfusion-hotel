import { activeMembershipForAccount } from "@/lib/membership-access";
import { hasActiveMembership } from "@/lib/membership-term";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { MemberOrderMenu } from "@/components/orders/member-order-menu";
import { getCurrentAccount } from "@/lib/auth";




export const metadata: Metadata = { title: "Member Order", description: "Build a Sanbay Fusion food and beverage order.", robots: { index: false, follow: false } };

export default async function MemberOrderPage() {
  const account = await getCurrentAccount();
  if (!account) redirect("/signin?next=/dashboard/order");
  const membership = await activeMembershipForAccount(account);
  if (!membership || !hasActiveMembership(membership)) redirect("/dashboard");
  const purchase = membership.purchaseSnapshot && typeof membership.purchaseSnapshot === "object"
    ? membership.purchaseSnapshot as { purchaseMode?: string }
    : null;
  const prepaid = purchase?.purchaseMode === "membership_with_package";
  return <>{prepaid && <div className="mx-auto max-w-7xl px-5 pt-24 sm:px-8"><p className="border-l-2 border-gold pl-4 text-sm leading-relaxed text-muted-foreground">Place Order is for additional items outside your prepaid package and is charged separately. Your included package deliveries follow the schedule in your membership dashboard and are not charged again.</p></div>}<MemberOrderMenu /></>;
}
