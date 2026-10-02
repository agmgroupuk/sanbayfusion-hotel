import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { getCurrentAccount } from "@/lib/auth";
import { db } from "@/lib/db";
import { customerOrders } from "@/lib/db/schema";
import { stripe } from "@/lib/stripe";
import { recordOrderPayment } from "@/lib/order-payment";
import { hasValidRequestOrigin, originRejection } from "@/lib/request-origin";

export async function POST(request: Request) {
  const account = await getCurrentAccount();
  if (!account || !db || !stripe) return NextResponse.json({ error: "Unable to confirm this order." }, { status: 401 });
  if (!hasValidRequestOrigin(request)) return NextResponse.json(originRejection, { status: 403 });
  const body = await request.json().catch(() => null) as { orderNumber?: string } | null;
  if (!body?.orderNumber) return NextResponse.json({ error: "Order reference is required." }, { status: 400 });
  const order = (await db.select().from(customerOrders).where(and(eq(customerOrders.orderNumber, body.orderNumber), eq(customerOrders.accountId, account.id))).limit(1))[0];
  if (!order?.stripePaymentIntentId) return NextResponse.json({ error: "Order not found." }, { status: 404 });
  const intent = await stripe.paymentIntents.retrieve(order.stripePaymentIntentId);
  if (intent.status !== "succeeded") return NextResponse.json({ error: "Payment has not been completed." }, { status: 402 });
  const paid = await recordOrderPayment(intent);
  if (!paid) return NextResponse.json({ error: "Payment did not match this order." }, { status: 409 });
  if (paid.status !== "confirmed") return NextResponse.json({ error: "Payment was received. Your delivery eligibility changed, so this order needs staff review before confirmation. Please contact support." }, { status: 409 });
  return NextResponse.json({ orderNumber: order.orderNumber, total: order.total });
}
