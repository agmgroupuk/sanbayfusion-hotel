import "server-only";
import { and, desc, eq, sql } from "drizzle-orm";
import type Stripe from "stripe";
import { z } from "zod";
import { db } from "@/lib/db";
import { stripe } from "@/lib/stripe";
import { cardVerifications, customerAccounts } from "@/lib/db/schema";
import { AccountError } from "./types";
import { rateLimit } from "./security";

export const stripeObjectId = (value: string | { id: string } | null) => typeof value === "string" ? value : value?.id;
function services() {
  if (!db || !stripe) throw new AccountError("Card verification is currently unavailable.", 503);
  return { database: db, payments: stripe };
}
export async function startCardVerification(accountId: string, requestId: string, customerId: string) {
  const { database, payments } = services();
  if (!z.string().uuid().safeParse(requestId).success) throw new AccountError("Invalid verification request.");
  await rateLimit("card-verification", accountId, 20);
  await database.insert(cardVerifications).values({ id: requestId, accountId, stripeCustomerId: customerId }).onConflictDoNothing();
  return database.transaction(async tx => {
    const [row] = await tx.select().from(cardVerifications).where(eq(cardVerifications.id, requestId)).for("update");
    if (!row || row.accountId !== accountId || row.stripeCustomerId !== customerId) throw new AccountError("Verification not found.", 404);
    let intent: Stripe.PaymentIntent | null = row.paymentIntentId ? await payments.paymentIntents.retrieve(row.paymentIntentId) : null;
    // Recover a remote success after a DB/network interruption, even after Stripe's idempotency retention.
    if (!intent) for await (const candidate of payments.paymentIntents.list({ customer: customerId, limit: 100 })) {
      if (candidate.metadata.verification_id === row.id) { intent = candidate; break; }
    }
    if (!intent) intent = await payments.paymentIntents.create({ amount: 200, currency: "usd", customer: customerId, payment_method_types: ["card"], setup_future_usage: "off_session", description: "Sanbay Fusion card verification — USD 2, automatically refunded", metadata: { purpose: "CARD_VERIFICATION", account_id: accountId, verification_id: row.id } }, { idempotencyKey: `sbf-card-verification-${row.id}` });
    if (intent.livemode || stripeObjectId(intent.customer) !== customerId || intent.amount !== 200 || intent.currency !== "usd") throw new AccountError("Invalid verification payment.");
    await tx.update(cardVerifications).set({ paymentIntentId: intent.id, updatedAt: new Date() }).where(eq(cardVerifications.id, row.id));
    return { clientSecret: intent.client_secret, paymentIntentId: intent.id };
  });
}

/** Both browser completion and signed webhooks retrieve Stripe's current authoritative state. */
export async function reconcileCardVerification(paymentIntentId: string, ownerAccountId?: string) {
  const { database, payments } = services();
  if (!/^pi_[a-zA-Z0-9]+$/.test(paymentIntentId)) throw new AccountError("Invalid verification reference.");
  const intent = await payments.paymentIntents.retrieve(paymentIntentId);
  const accountId = intent.metadata.account_id;
  if (intent.livemode || intent.metadata.purpose !== "CARD_VERIFICATION" || !accountId || (ownerAccountId && accountId !== ownerAccountId)) throw new AccountError("Verification not found.", 404);
  return database.transaction(async tx => {
    await tx.execute(sql`select pg_advisory_xact_lock(hashtextextended(${accountId}, 0))`);
    const [account] = await tx.select().from(customerAccounts).where(eq(customerAccounts.id, accountId)).for("update");
    const [row] = await tx.select().from(cardVerifications).where(and(eq(cardVerifications.id, intent.metadata.verification_id), eq(cardVerifications.accountId, accountId))).for("update");
    if (!row || !account || row.stripeCustomerId !== account.stripeCustomerId || stripeObjectId(intent.customer) !== row.stripeCustomerId || (row.paymentIntentId && row.paymentIntentId !== intent.id) || intent.amount !== 200 || intent.currency !== "usd") throw new AccountError("Verification payment does not match this account.", 409);
    // Retrieve again inside the lock, so an older failed event cannot overwrite success.
    const current = await payments.paymentIntents.retrieve(intent.id);
    if (current.status !== "succeeded") {
      const status = current.last_payment_error || current.status === "canceled" ? "failed" : current.status;
      await tx.update(cardVerifications).set({ paymentIntentId: current.id, status, updatedAt: new Date() }).where(eq(cardVerifications.id, row.id));
      return { verified: false, status };
    }
    if (current.amount_received !== 200 || current.amount !== 200 || current.currency !== "usd") throw new AccountError("Incorrect verification amount.", 409);
    const methodId = stripeObjectId(current.payment_method);
    if (!methodId) throw new AccountError("Verification card missing.");
    const method = await payments.paymentMethods.retrieve(methodId);
    if (method.livemode || !method.card || stripeObjectId(method.customer) !== row.stripeCustomerId) throw new AccountError("Verification card ownership mismatch.", 409);
    // Search first as well as using an idempotency key: refund recovery survives process failure.
    let refund = row.refundId ? await payments.refunds.retrieve(row.refundId) : (await payments.refunds.list({ payment_intent: current.id, limit: 100 })).data.find(item => item.amount === 200 && item.status !== "failed" && item.status !== "canceled");
    if (!refund) refund = await payments.refunds.create({ payment_intent: current.id, amount: 200, metadata: { purpose: "CARD_VERIFICATION_REFUND", verification_id: row.id, account_id: accountId } }, { idempotencyKey: `sbf-card-refund-${row.id}` });
    if (refund.amount !== 200 || refund.currency !== "usd" || stripeObjectId(refund.payment_intent) !== current.id) throw new AccountError("Verification refund mismatch.");
    await tx.update(cardVerifications).set({ paymentIntentId: current.id, paymentMethodId: methodId, status: "verified", refundId: refund.id, refundStatus: refund.status ?? "pending", updatedAt: new Date() }).where(eq(cardVerifications.id, row.id));
    const customer = await payments.customers.retrieve(row.stripeCustomerId);
    if (customer.deleted || customer.livemode) throw new AccountError("Sandbox customer unavailable.");
    const defaultId = stripeObjectId(customer.invoice_settings.default_payment_method);
    const [verifiedDefault] = defaultId ? await tx.select({ id: cardVerifications.id }).from(cardVerifications).where(and(eq(cardVerifications.accountId, accountId), eq(cardVerifications.paymentMethodId, defaultId), eq(cardVerifications.status, "verified"))).limit(1) : [];
    if (!verifiedDefault) await payments.customers.update(customer.id, { invoice_settings: { default_payment_method: methodId } });
    return { verified: true, status: "verified" };
  });
}

export async function verificationRecords(accountId: string) {
  const { database } = services();
  return database.select().from(cardVerifications).where(eq(cardVerifications.accountId, accountId)).orderBy(desc(cardVerifications.createdAt));
}
