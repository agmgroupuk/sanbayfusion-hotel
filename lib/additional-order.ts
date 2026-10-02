import "server-only";
import { createHash } from "node:crypto";
import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "./db";
import { customerOrders, customerOrderItems, type CustomerAccount } from "./db/schema";
import { stripe } from "./stripe";
import { addresses, listCards, stripeCustomer } from "./account/service";
import { addressSchema } from "./account/types";
import { lockMembershipApplication } from "./membership-access";
import { ApplicationError } from "./membership-errors";
import { priceCart } from "./order";
import { validateOrderSchedule } from "./order-schedule";
import { checkDeliveryEligibility } from "./delivery";
import { recordOrderPayment } from "./order-payment";

const inputSchema = z.object({ requestId: z.string().uuid(), cart: z.unknown(), notes: z.string().max(2000).default(""), deliveryDate: z.string(), deliveryTime: z.string(), addressId: z.string().uuid(), paymentMethodId: z.string().regex(/^pm_[a-zA-Z0-9]+$/) });
export type AdditionalOrderSnapshot = { kind: "additional_order"; version: 1; address: z.infer<typeof addressSchema>["details"]; addressId: string; deliveryDate: string; deliveryTime: string; timezone: "Asia/Bangkok"; stripeCustomerId: string; paymentMethodId: string; fingerprint: string };

export async function createAdditionalOrder(account: CustomerAccount, membershipId: string, raw: unknown) {
  if (!db || !stripe) throw new ApplicationError("Ordering is temporarily unavailable.", 503);
  const parsed = inputSchema.safeParse(raw);
  if (!parsed.success) throw new ApplicationError("Choose your delivery schedule, saved address and verified payment method.");
  const input = parsed.data;
  const [customer, saved, cards] = await Promise.all([stripeCustomer(account.id), addresses(account.id), listCards(account.id)]);
  const address = saved.find(row => row.id === input.addressId && row.kind === "delivery");
  const card = cards.find(row => row.id === input.paymentMethodId && row.verificationStatus === "verified");
  if (!customer || !card) throw new ApplicationError("Choose a verified saved card from your Account Center.", 403);
  if (!address || !addressSchema.safeParse(address).success) throw new ApplicationError("Choose a complete saved delivery address.");
  const coverage = checkDeliveryEligibility({ ...address.details, placeId: address.id, formattedAddress: address.details.line1 });
  if (coverage.status !== "available") throw new ApplicationError("This delivery address is outside the current delivery area.");
  const order = await db.transaction(async tx => {
    const { row: membership, account: lockedAccount } = await lockMembershipApplication(tx, membershipId);
    if (lockedAccount?.id !== account.id || lockedAccount.stripeCustomerId !== customer.id) throw new ApplicationError("Your payment account changed. Please reload checkout.", 409);
    const scheduleError = validateOrderSchedule(membership, input.deliveryDate, input.deliveryTime);
    if (scheduleError) throw new ApplicationError(scheduleError, 403);
    const priced = priceCart(input.cart, membership.planId);
    if (!priced.ok) throw new ApplicationError(priced.error);
    const fingerprint = createHash("sha256").update(JSON.stringify({ items: priced.items, notes: input.notes, deliveryDate: input.deliveryDate, deliveryTime: input.deliveryTime, address: address.details, paymentMethodId: card.id })).digest("hex");
    const [existing] = await tx.select().from(customerOrders).where(eq(customerOrders.id, input.requestId)).limit(1);
    if (existing) {
      if (existing.accountId !== account.id || (existing.deliveryDetails as AdditionalOrderSnapshot).fingerprint !== fingerprint || existing.status === "cancelled") throw new ApplicationError("This checkout attempt has changed. Start a new order from your cart.", 409);
      return existing;
    }
    const deliveryDetails: AdditionalOrderSnapshot = { kind: "additional_order", version: 1, address: address.details, addressId: address.id, deliveryDate: input.deliveryDate, deliveryTime: input.deliveryTime, timezone: "Asia/Bangkok", stripeCustomerId: customer.id, paymentMethodId: card.id, fingerprint };
    const [created] = await tx.insert(customerOrders).values({ id: input.requestId, orderNumber: `SBF-O-${input.requestId.slice(0, 18)}`, accountId: account.id, membershipRequestId: membership.id, subtotal: priced.subtotal, total: priced.total, notes: input.notes, deliveryDetails }).returning();
    await tx.insert(customerOrderItems).values(priced.items.map(item => ({ orderId: created.id, productName: item.name, categoryName: item.category, quantity: item.quantity, unitPrice: item.price, lineTotal: item.lineTotal })));
    return created;
  });
  const intent = order.stripePaymentIntentId ? await stripe.paymentIntents.retrieve(order.stripePaymentIntentId) : await stripe.paymentIntents.create({ amount: order.total * 100, currency: "thb", customer: customer.id, payment_method: card.id, payment_method_types: ["card"], metadata: { payment_type: "ORDER_PAYMENT", purchase_mode: "EXTRA_ORDER", orderId: order.id, orderNumber: order.orderNumber, accountId: account.id } }, { idempotencyKey: `sbf-additional-order-${order.id}` });
  if (intent.livemode || intent.amount !== order.total * 100 || intent.currency !== "thb" || intent.customer !== customer.id || intent.metadata.orderId !== order.id) throw new ApplicationError("This payment needs review. Contact support.", 409);
  await db.update(customerOrders).set({ stripePaymentIntentId: intent.id }).where(and(eq(customerOrders.id, order.id), eq(customerOrders.accountId, account.id)));
  if (intent.status === "succeeded") await recordOrderPayment(intent);
  return { clientSecret: intent.client_secret, orderNumber: order.orderNumber, total: order.total, paymentStatus: intent.status };
}
