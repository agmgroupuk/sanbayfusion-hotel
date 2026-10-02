import { activeMembershipForAccount } from "@/lib/membership-access";
import { hasActiveMembership } from "@/lib/membership-term";
import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { CheckoutPayment } from "@/components/orders/checkout-payment";
import { getCurrentAccount } from "@/lib/auth";


import { and, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { customerOrders, customerOrderItems } from "@/lib/db/schema";
import { benefitRedemptionsForAccount } from "@/lib/membership-benefits";
import { standardMealAmounts } from "@/lib/standard-meal";
import { catalogueCategories } from "@/lib/catalogue";
import { priceCart } from "@/lib/order";
import { AdditionalCheckout } from "@/components/orders/additional-checkout";
import { addresses, listCards } from "@/lib/account/service";
import { earliestServiceDate } from "@/lib/membership-service-months";
import { hasActiveMembership as eligibleOnDate } from "@/lib/membership-term";
import { stripePublishableKey } from "@/lib/stripe";
import { isBangkokProvince } from "@/lib/delivery";

export const metadata: Metadata = { title: "Checkout", description: "Complete your Sanbay Fusion member order.", robots: { index: false, follow: false } };

export default async function CheckoutPage({ searchParams }: { searchParams: Promise<{ cart?: string; notes?: string; standardMeal?: string; membership?: string; order?: string }> }) {
  const account = await getCurrentAccount();
  if (!account) redirect("/signin?next=/dashboard/checkout");
  const params = await searchParams;
  let rawCart: unknown;
  let initialAttempt: {requestId:string;deliveryDate:string;deliveryTime:string;addressId:string;paymentMethodId:string} | undefined;
  if (params.order && db && /^[0-9a-f-]{36}$/i.test(params.order)) {
    const [saved] = await db.select().from(customerOrders).where(and(eq(customerOrders.id, params.order), eq(customerOrders.accountId, account.id))).limit(1);
    if (!saved) redirect("/dashboard/membership");
    const items = await db.select().from(customerOrderItems).where(eq(customerOrderItems.orderId, saved.id));
    rawCart = items.map(item => ({ category: item.categoryName, name: item.productName, quantity: item.quantity }));
    const details = saved.deliveryDetails as { standardMeal?: { serviceMonth: string }; kind?:string; deliveryDate:string;deliveryTime:string;addressId:string;paymentMethodId:string };
    if (details.kind === "additional_order") {
      if (saved.paymentStatus === "paid" || saved.status === "cancelled") redirect("/dashboard/orders");
      initialAttempt = {requestId:saved.id,deliveryDate:details.deliveryDate,deliveryTime:details.deliveryTime,addressId:details.addressId,paymentMethodId:details.paymentMethodId};
    }
    params.standardMeal = details.standardMeal?.serviceMonth; params.membership = saved.membershipRequestId; params.notes = encodeURIComponent(saved.notes ?? "");
  } else {
    try { rawCart = JSON.parse(decodeURIComponent(params.cart ?? "")); } catch { redirect("/dashboard/order"); }
  }
  const membership = await activeMembershipForAccount(account);
  if (!membership || !hasActiveMembership(membership)) redirect("/dashboard");
  const priced = priceCart(rawCart, membership.planId);
  if (!priced.ok) redirect("/dashboard/order");
  const meal = params.standardMeal ? (await benefitRedemptionsForAccount(account)).find(row => row.membershipRequestId === membership.id && params.membership === membership.id && row.serviceMonth === params.standardMeal && row.scheduledDate && row.scheduledTime && (["scheduled", "reserved"].includes(row.status) || row.orderId === params.order)) : null;
  if (params.standardMeal && (!meal || priced.items.some(item => !catalogueCategories.some(category => category.name === item.category && category.group === "food")))) redirect("/dashboard/membership");
  const amounts = meal ? standardMealAmounts(priced.subtotal, meal.menuValue) : { allowanceApplied: 0, total: priced.total };
  if (!meal) {
    const [savedAddresses, cards] = await Promise.all([addresses(account.id), listCards(account.id)]);
    const dates: string[] = [];
    const day = new Date(`${earliestServiceDate()}T12:00:00+07:00`);
    for (let index = 0; index < 730; index++) {
      if (eligibleOnDate(membership, day)) dates.push(new Intl.DateTimeFormat("en-CA", {timeZone:"Asia/Bangkok",year:"numeric",month:"2-digit",day:"2-digit"}).format(day));
      day.setUTCDate(day.getUTCDate() + 1);
    }
    return <AdditionalCheckout initialAttempt={initialAttempt} items={priced.items} notes={decodeURIComponent(params.notes ?? "").slice(0,2000)} addresses={savedAddresses.filter(row => row.kind === "delivery" && isBangkokProvince(row.details.province))} cards={cards.filter(card => card.verificationStatus === "verified")} dates={dates} publishableKey={stripePublishableKey} />;
  }
  const address = membership.address && typeof membership.address === "object" ? membership.address as Record<string, unknown> : {};
  return <div className="mx-auto max-w-3xl px-5 pb-28 pt-28 sm:px-8 sm:pt-36"><p className="text-eyebrow text-gold">Member checkout</p><h1 className="mt-4 font-display text-5xl font-light italic">Review and pay</h1><p className="mt-4 text-sm text-muted-foreground">Membership fees are separate. This payment covers the food and beverage order below.</p><div className="mt-10"><CheckoutPayment items={priced.items} subtotal={amounts.total} standardMeal={meal ? { membershipId: membership.id, serviceMonth: meal.serviceMonth, allowanceApplied: amounts.allowanceApplied, scheduledDate: meal.scheduledDate!, scheduledTime: meal.scheduledTime! } : undefined} notes={decodeURIComponent(params.notes ?? "").slice(0, 2000)} customer={{ name: account.fullName ?? "", email: account.email, phone: account.phone ?? "" }} membership={{ plan: membership.planName, memberId: membership.membershipNumber ?? "Pending", status: membership.status }} delivery={address} orderNumber="Pending" /></div></div>;
}
