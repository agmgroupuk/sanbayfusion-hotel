import "server-only";
import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/lib/db";
import { stripe } from "@/lib/stripe";
import { customerOrders, customerOrderItems, membershipBenefitRedemptions, type CustomerAccount } from "@/lib/db/schema";
import { lockMembershipApplication } from "@/lib/membership-access";
import { ApplicationError } from "@/lib/membership-errors";
import { validateBenefitEntitlement } from "@/lib/membership-benefits";
import { ensureStandardMealEntitlements } from "@/lib/standard-meal-entitlements";
import { bangkokDate, serviceMonthPattern } from "@/lib/membership-service-months";
import { catalogueCategories } from "@/lib/catalogue";
import { priceCart } from "@/lib/order";
import { standardMealAmounts } from "@/lib/standard-meal";
import { recordOrderPayment } from "@/lib/order-payment";

export const standardMealOrderSchema = z.object({ membershipId: z.string().uuid(), serviceMonth: z.string().regex(serviceMonthPattern) }).strict();

/** The membership lock makes one order own this month's allowance, including payment retries. */
export async function createStandardMealOrder(account: CustomerAccount, raw: unknown, cart: unknown, notes?: string, expectedTotal?: number) {
  if (!db) throw new ApplicationError("Ordering is unavailable.", 503);
  const parsed = standardMealOrderSchema.safeParse(raw);
  if (!parsed.success) throw new ApplicationError("Choose an available Standard Meal in your membership dashboard.");
  const { membershipId, serviceMonth } = parsed.data;
  const order = await db.transaction(async tx => {
    const { row: membership } = await lockMembershipApplication(tx, membershipId, account.id);
    if (serviceMonth !== bangkokDate().slice(0, 7)) throw new ApplicationError("Place your included meal order during its selected service month. Future meals can be scheduled in your dashboard.", 403);
    await ensureStandardMealEntitlements(tx, membership);
    const [benefit] = await tx.select().from(membershipBenefitRedemptions).where(and(eq(membershipBenefitRedemptions.membershipRequestId, membership.id), eq(membershipBenefitRedemptions.serviceMonth, serviceMonth))).limit(1).for("update");
    if (!benefit?.scheduledDate || !benefit.scheduledTime) throw new ApplicationError("Schedule this month's Standard Meal date and time in your dashboard first.");
    const allowance = validateBenefitEntitlement(membership, serviceMonth, benefit.scheduledDate, benefit.scheduledTime);
    const priced = priceCart(cart, membership.planId);
    if (!priced.ok) throw new ApplicationError(priced.error);
    if (priced.items.some(item => !catalogueCategories.some(category => category.name === item.category && category.group === "food"))) throw new ApplicationError("The Standard Meal allowance applies to eligible food only. Order other items separately.");
    const { allowanceApplied, total } = standardMealAmounts(priced.subtotal, allowance.menuValue);
    if (expectedTotal !== undefined && expectedTotal !== total) throw new ApplicationError("Your order price changed. Reload checkout and review the updated amount.", 409);
    if (benefit.orderId) {
      const [existing] = await tx.select().from(customerOrders).where(and(eq(customerOrders.id, benefit.orderId), eq(customerOrders.accountId, account.id)));
      const existingItems = existing ? await tx.select().from(customerOrderItems).where(eq(customerOrderItems.orderId, existing.id)) : [];
      if (!existing || existing.status === "cancelled" || existing.subtotal !== priced.subtotal || existing.total !== total || existingItems.length !== priced.items.length || priced.items.some(item => !existingItems.some(saved => saved.categoryName === item.category && saved.productName === item.name && saved.quantity === item.quantity && saved.unitPrice === item.price))) throw new ApplicationError("This month's allowance is already assigned to another order. Resume that order or place a separately paid order.", 409);
      return existing;
    }
    if (!["available", "scheduled"].includes(benefit.status)) throw new ApplicationError("This month's Standard Meal has already been used or expired. Additional orders are paid separately.", 409);
    const [created] = await tx.insert(customerOrders).values({ orderNumber: `SBF-O-${crypto.randomUUID().slice(0, 18)}`, accountId: account.id, membershipRequestId: membership.id,
      subtotal: priced.subtotal, total, notes: notes?.slice(0, 2000) ?? null,
      deliveryDetails: { ...(membership.address as object), standardMeal: { serviceMonth, scheduledDate: benefit.scheduledDate, scheduledTime: benefit.scheduledTime, allowanceApplied } },
      ...(total === 0 ? { status: "confirmed" as const, paymentStatus: "paid" as const, paidAt: new Date() } : {}),
    }).returning();
    await tx.insert(customerOrderItems).values(priced.items.map(item => ({ orderId: created.id, productName: item.name, categoryName: item.category, unitPrice: item.price, quantity: item.quantity, lineTotal: item.lineTotal })));
    await tx.update(membershipBenefitRedemptions).set({ orderId: created.id, status: total === 0 ? "redeemed" : "reserved", redeemedAt: total === 0 ? new Date() : null }).where(eq(membershipBenefitRedemptions.id, benefit.id));
    return created;
  });
  if (order.paymentStatus === "paid") return { confirmed: true, orderNumber: order.orderNumber, total: order.total };
  if (!stripe) throw new ApplicationError("Payment services are unavailable. Your meal order is saved; retry to complete it.", 503);
  const intent = order.stripePaymentIntentId ? await stripe.paymentIntents.retrieve(order.stripePaymentIntentId) : await stripe.paymentIntents.create({
    amount: order.total * 100, currency: "thb", automatic_payment_methods: { enabled: true },
    metadata: { payment_type: "ORDER_PAYMENT", purchase_mode: "STANDARD_MEAL_EXCESS", orderId: order.id, orderNumber: order.orderNumber, accountId: account.id },
  }, { idempotencyKey: `sbf-standard-meal-${order.id}` });
  if (intent.livemode || intent.amount !== order.total * 100 || intent.currency !== "thb" || intent.metadata.orderId !== order.id) throw new ApplicationError("This order payment needs review.", 409);
  await db.update(customerOrders).set({ stripePaymentIntentId: intent.id }).where(eq(customerOrders.id, order.id));
  if (intent.status === "succeeded") {
    if (!await recordOrderPayment(intent)) throw new ApplicationError("Payment confirmation is still processing. Please retry.", 409);
    return { confirmed: true, orderNumber: order.orderNumber, total: order.total };
  }
  return { clientSecret: intent.client_secret, orderNumber: order.orderNumber, total: order.total };
}
