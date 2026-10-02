import "server-only";
import { and, eq, inArray } from "drizzle-orm";
import type Stripe from "stripe";
import { db } from "@/lib/db";
import { customerOrders, membershipBenefitRedemptions } from "@/lib/db/schema";
import type { AdditionalOrderSnapshot } from "./additional-order";
import { lockMembershipApplication } from "./membership-access";
import { validateOrderSchedule } from "./order-schedule";
import { stripe } from "./stripe";

/** Re-read current Stripe state so out-of-order events cannot regress a payment. */
export async function reconcileOrderPayment(intentId: string) {
  if (!stripe || !db) return null;
  const intent = await stripe.paymentIntents.retrieve(intentId);
  if (intent.livemode || intent.metadata.payment_type !== "ORDER_PAYMENT") return null;
  if (intent.status === "succeeded") return recordOrderPayment(intent);
  const [order] = await db.select().from(customerOrders).where(eq(customerOrders.stripePaymentIntentId,intent.id)).limit(1);
  if (!order || order.id !== intent.metadata.orderId || order.accountId !== intent.metadata.accountId || intent.amount !== order.total * 100 || intent.currency !== "thb") return null;
  const details = order.deliveryDetails as Partial<AdditionalOrderSnapshot>;
  if (details.kind !== "additional_order") return null;
  await db.update(customerOrders).set({ paymentStatus: intent.status === "requires_payment_method" || intent.status === "canceled" ? "failed" : "pending", ...(intent.status === "canceled" ? {status:"cancelled" as const} : {}), deliveryDetails: {...details,paymentState:intent.status} }).where(and(eq(customerOrders.id,order.id),eq(customerOrders.status,"pending_payment"),inArray(customerOrders.paymentStatus,["pending","failed"])));
  return null;
}

/** Finalize a previously authorized order after its verified payment succeeds. */
export async function recordOrderPayment(intent: Stripe.PaymentIntent) {
  if (!db || intent.livemode || intent.status !== "succeeded" || intent.currency !== "thb" || intent.metadata.payment_type !== "ORDER_PAYMENT") return null;
  const [order] = await db.select().from(customerOrders).where(eq(customerOrders.stripePaymentIntentId, intent.id)).limit(1);
  if (!order || order.id !== intent.metadata.orderId || order.accountId !== intent.metadata.accountId || order.total * 100 !== intent.amount || order.status === "cancelled") return null;
  if (order.paymentStatus === "paid") return order;
  return db.transaction(async tx => {
    const details = order.deliveryDetails as Partial<AdditionalOrderSnapshot>;
    if (details.kind === "additional_order") {
      const id = (value: string | { id: string } | null) => typeof value === "string" ? value : value?.id;
      if (intent.amount_received !== order.total * 100 || id(intent.customer) !== details.stripeCustomerId || id(intent.payment_method) !== details.paymentMethodId) return null;
      const { row: membership, account } = await lockMembershipApplication(tx, order.membershipRequestId);
      if (account?.id !== order.accountId || account.stripeCustomerId !== details.stripeCustomerId) return null;
      // A delayed payment cannot authorize fulfillment after eligibility/cutoff changes.
      // Record the money received while leaving the order unconfirmed for staff review.
      if (validateOrderSchedule(membership, details.deliveryDate ?? "", details.deliveryTime ?? "")) {
        const [review] = await tx.update(customerOrders).set({ paymentStatus: "paid", paidAt: new Date(), deliveryDetails: {...details,paymentState:"succeeded",reviewRequired:true,chargeId:typeof intent.latest_charge === "string" ? intent.latest_charge : intent.latest_charge?.id} }).where(and(eq(customerOrders.id, order.id), eq(customerOrders.status, "pending_payment"), inArray(customerOrders.paymentStatus, ["pending","failed"]))).returning();
        if (review) return review;
        return (await tx.select().from(customerOrders).where(and(eq(customerOrders.id,order.id),eq(customerOrders.paymentStatus,"paid"))).limit(1))[0] ?? null;
      }
    }
    const [paid] = await tx.update(customerOrders).set({ status: "confirmed", paymentStatus: "paid", paidAt: new Date(), ...(details.kind === "additional_order" ? {deliveryDetails:{...details,paymentState:"succeeded",chargeId:typeof intent.latest_charge === "string" ? intent.latest_charge : intent.latest_charge?.id}} : {}) }).where(and(eq(customerOrders.id, order.id), eq(customerOrders.status, "pending_payment"), inArray(customerOrders.paymentStatus, ["pending","failed"]))).returning();
    if (paid) await tx.update(membershipBenefitRedemptions).set({ status: "redeemed", redeemedAt: new Date() }).where(and(eq(membershipBenefitRedemptions.orderId, paid.id), eq(membershipBenefitRedemptions.status, "reserved")));
    if (paid) return paid;
    return (await tx.select().from(customerOrders).where(and(eq(customerOrders.id,order.id),eq(customerOrders.paymentStatus,"paid"))).limit(1))[0] ?? null;
  });
}
