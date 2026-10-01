import "server-only";
import { and, eq } from "drizzle-orm";
import type Stripe from "stripe";
import { db } from "@/lib/db";
import { customerOrders } from "@/lib/db/schema";

/** Finalize a previously authorized order after its verified payment succeeds. */
export async function recordOrderPayment(intent: Stripe.PaymentIntent) {
  if (!db || intent.livemode || intent.status !== "succeeded" || intent.currency !== "thb" || intent.metadata.payment_type !== "ORDER_PAYMENT") return null;
  const [order] = await db.select().from(customerOrders).where(eq(customerOrders.stripePaymentIntentId, intent.id)).limit(1);
  if (!order || order.id !== intent.metadata.orderId || order.accountId !== intent.metadata.accountId || order.total * 100 !== intent.amount || order.status === "cancelled") return null;
  if (order.paymentStatus === "paid") return order;
  const [paid] = await db.update(customerOrders).set({ status: "confirmed", paymentStatus: "paid", paidAt: new Date() }).where(and(eq(customerOrders.id, order.id), eq(customerOrders.status, "pending_payment"), eq(customerOrders.paymentStatus, "pending"))).returning();
  return paid ?? null;
}
