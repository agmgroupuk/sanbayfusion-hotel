import { activeMembershipForAccount } from "@/lib/membership-access";
import { hasActiveMembership } from "@/lib/membership-term";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { benefitRedemptionsForAccount } from "@/lib/membership-benefits";
import { bangkokDate } from "@/lib/membership-service-months";
import { MemberOrderMenu } from "@/components/orders/member-order-menu";
import { getCurrentAccount } from "@/lib/auth";
import { catalogueCategories } from "@/lib/catalogue";
import { priceCart } from "@/lib/order";




export const metadata: Metadata = { title: "Member Order", description: "Build a Sanbay Fusion food and beverage order.", robots: { index: false, follow: false } };

export default async function MemberOrderPage({ searchParams }: { searchParams: Promise<{ standardMeal?: string; membership?: string }> }) {
  const params = await searchParams;
  const account = await getCurrentAccount();
  if (!account) redirect("/signin?next=/dashboard/order");
  const membership = await activeMembershipForAccount(account);
  if (!membership || !hasActiveMembership(membership)) redirect("/dashboard");
  const meal = params.standardMeal ? (await benefitRedemptionsForAccount(account)).find(row => row.membershipRequestId === membership.id && params.membership === membership.id && row.serviceMonth === params.standardMeal && row.serviceMonth === bangkokDate().slice(0, 7) && row.status === "scheduled" && row.scheduledTime && !row.orderId) : null;
  if (params.standardMeal && !meal) redirect("/dashboard/membership");
  const purchase = membership.purchaseSnapshot && typeof membership.purchaseSnapshot === "object"
    ? membership.purchaseSnapshot as { purchaseMode?: string }
    : null;
  const prepaid = purchase?.purchaseMode === "membership_with_package";
  return <>{prepaid && !meal && <div className="mx-auto max-w-7xl px-5 pt-24 sm:px-8"><p className="border-l-2 border-gold pl-4 text-sm leading-relaxed text-muted-foreground">Place Order is for additional items outside your prepaid package and is charged separately. Your included package deliveries follow the schedule in your membership dashboard and are not charged again.</p></div>}<MemberOrderMenu availableCategories={catalogueCategories.filter(category => category.products[0] && priceCart([{category:category.name,name:category.products[0].name,quantity:1}], membership.planId).ok).map(category=>category.name)} standardMeal={meal ? { membershipId: membership.id, serviceMonth: meal.serviceMonth, allowance: meal.menuValue } : undefined} /></>;
}
