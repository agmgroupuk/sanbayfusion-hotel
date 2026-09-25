import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { desc, eq } from "drizzle-orm";
import { CheckoutPayment } from "@/components/orders/checkout-payment";
import { getCurrentAccount } from "@/lib/auth";
import { db } from "@/lib/db";
import { membershipRequests } from "@/lib/db/schema";
import { priceCart } from "@/lib/order";

export const metadata: Metadata = { title: "Checkout", description: "Complete your Sanbay Fusion member order.", robots: { index: false, follow: false } };

export default async function CheckoutPage({ searchParams }: { searchParams: Promise<{ cart?: string; notes?: string }> }) {
  const account = await getCurrentAccount();
  if (!account) redirect("/signin?next=/dashboard/checkout");
  const params = await searchParams;
  let rawCart: unknown;
  try { rawCart = JSON.parse(decodeURIComponent(params.cart ?? "")); } catch { redirect("/dashboard/order"); }
  const priced = priceCart(rawCart);
  if (!priced.ok) redirect("/dashboard/order");
  const membership = db ? (await db.select().from(membershipRequests).where(eq(membershipRequests.email, account.email)).orderBy(desc(membershipRequests.createdAt)).limit(1))[0] ?? null : null;
  if (!membership || membership.status !== "active") redirect("/dashboard");
  const address = membership.address && typeof membership.address === "object" ? membership.address as Record<string, unknown> : {};
  return <div className="mx-auto max-w-3xl px-5 pb-28 pt-28 sm:px-8 sm:pt-36"><p className="text-eyebrow text-gold">Member checkout</p><h1 className="mt-4 font-display text-5xl font-light italic">Review and pay</h1><p className="mt-4 text-sm text-muted-foreground">Membership fees are separate. This payment covers the food and beverage order below.</p><div className="mt-10"><CheckoutPayment items={priced.items} subtotal={priced.total} notes={decodeURIComponent(params.notes ?? "").slice(0, 2000)} customer={{ name: account.fullName ?? "", email: account.email, phone: account.phone ?? "" }} membership={{ plan: membership.planName, memberId: membership.membershipNumber ?? "Pending", status: membership.status }} delivery={address} orderNumber="Pending" /></div></div>;
}