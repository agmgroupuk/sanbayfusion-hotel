import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { getCurrentAccount } from "@/lib/auth";
import { db } from "@/lib/db";
import { customerOrders } from "@/lib/db/schema";
import { stripe } from "@/lib/stripe";

export async function POST(request: Request) {
  const account = await getCurrentAccount();
  if (!account || !db || !stripe) return NextResponse.json({ error: "Unable to confirm this order." }, { status: 401 });
  const body = await request.json().catch(() => null) as { orderNumber?: string } | null;
  if (!body?.orderNumber) return NextResponse.json({ error: "Order reference is required." }, { status: 400 });
  const order = (await db.select().from(customerOrders).where(and(eq(customerOrders.orderNumber, body.orderNumber), eq(customerOrders.accountId, account.id))).limit(1))[0];
  if (!order?.stripePaymentIntentId) return NextResponse.json({ error: "Order not found." }, { status: 404 });
  const intent = await stripe.paymentIntents.retrieve(order.stripePaymentIntentId);
  if (intent.status !== "succeeded") return NextResponse.json({ error: "Payment has not been completed." }, { status: 402 });
  await db.update(customerOrders).set({ status: "confirmed", paymentStatus: "paid", paidAt: new Date() }).where(and(eq(customerOrders.id, order.id), eq(customerOrders.accountId, account.id)));
  return NextResponse.json({ orderNumber: order.orderNumber, total: order.total });
}