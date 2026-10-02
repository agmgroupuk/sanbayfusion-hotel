import { activeMembershipForAccount } from "@/lib/membership-access";
import { hasActiveMembership } from "@/lib/membership-term";
import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { getCurrentAccount } from "@/lib/auth";
import { db } from "@/lib/db";
import { customerOrderItems, customerOrders } from "@/lib/db/schema";
import { priceCart } from "@/lib/order";
import { stripe } from "@/lib/stripe";
import { createStandardMealOrder } from "@/lib/standard-meal-order";
import { ApplicationError } from "@/lib/membership-errors";
import { hasValidRequestOrigin, originRejection } from "@/lib/request-origin";

function orderNumber() { return `SBF-O-${randomUUID().slice(0, 18)}`; }

export async function POST(request: Request) {
  const account = await getCurrentAccount();
  if (!account) return NextResponse.json({ error: "Please sign in to order." }, { status: 401 });
  if (!hasValidRequestOrigin(request)) return NextResponse.json(originRejection, { status: 403 });
  if (!db || !stripe) return NextResponse.json({ error: "Payment services are not configured." }, { status: 503 });
  const body = await request.json().catch(() => null) as { cart?: unknown; notes?: string; standardMeal?: unknown; expectedTotal?: number } | null;
  if (body?.standardMeal) {
    try { return NextResponse.json(await createStandardMealOrder(account, body.standardMeal, body.cart, typeof body.notes === "string" ? body.notes : undefined, body.expectedTotal)); }
    catch (error) { return NextResponse.json({ error: error instanceof ApplicationError ? error.message : "Unable to prepare your meal order. Your saved order can be retried." }, { status: error instanceof ApplicationError ? error.status : 500 }); }
  }
  const membership = await activeMembershipForAccount(account);
  if (!membership || !hasActiveMembership(membership)) return NextResponse.json({ error: "An active membership is required to place an order." }, { status: 403 });
  const priced = priceCart(body?.cart, membership.planId);
  if (!priced.ok) return NextResponse.json({ error: priced.error }, { status: 400 });
  const number = orderNumber();
  const [order] = await db.insert(customerOrders).values({ orderNumber: number, accountId: account.id, membershipRequestId: membership.id, subtotal: priced.subtotal, total: priced.total, notes: typeof body?.notes === "string" ? body.notes.slice(0, 2000) : null, deliveryDetails: membership.address, }).returning();
  await db.insert(customerOrderItems).values(priced.items.map((item) => ({ orderId: order.id, productName: item.name, categoryName: item.category, unitPrice: item.price, quantity: item.quantity, lineTotal: item.lineTotal })));
  const intent = await stripe.paymentIntents.create({ amount: priced.total * 100, currency: "thb", automatic_payment_methods: { enabled: true }, metadata: { payment_type: "ORDER_PAYMENT", purchase_mode: "EXTRA_ORDER", orderId: order.id, orderNumber: order.orderNumber, accountId: account.id } });
  await db.update(customerOrders).set({ stripePaymentIntentId: intent.id }).where(eq(customerOrders.id, order.id));
  return NextResponse.json({ clientSecret: intent.client_secret, orderNumber: order.orderNumber, total: priced.total });
}
