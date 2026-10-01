import "server-only";
import { and, desc, eq, inArray, isNotNull, isNull, or, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { stripe } from "@/lib/stripe";
import { customerAccounts, accountAddresses, accountEmailChanges, customerSessions, membershipRequests, customerOrders, cardVerifications } from "@/lib/db/schema";
import { randomBytes } from "node:crypto";
import { z } from "zod";
import { startCardVerification, reconcileCardVerification, verificationRecords } from "./card-verification";
import { resend, FROM_EMAIL } from "@/lib/email/client";
import { AccountError, addressSchema, profileSchema, type SavedAddress, type SafeCard } from "./types";
import { audit, digest, rateLimit, reauthenticate } from "./security";
import { isMembershipAdmin } from "@/lib/membership-admin";
const payments = () => { if (!stripe) throw new AccountError("Sandbox payment methods are currently unavailable.", 503); return stripe; };
const ownerId = (value: string | { id: string } | null) => typeof value === "string" ? value : value?.id;
export async function stripeCustomer(accountId: string, create = false) {
  if (!db) throw new AccountError("Account services unavailable.", 503);
  const provider = payments();
  return db.transaction(async tx => {
    await tx.execute(sql`select pg_advisory_xact_lock(hashtextextended(${accountId}, 0))`);
    const [account] = await tx.select().from(customerAccounts).where(eq(customerAccounts.id, accountId)).limit(1).for("update");
    if (!account) throw new AccountError("Sign in again.", 401);
    if (!account.stripeCustomerId) {
      const linked = await tx.selectDistinct({ id: membershipRequests.stripeCustomerId }).from(membershipRequests).where(and(eq(membershipRequests.customerAccountId, accountId), isNotNull(membershipRequests.stripeCustomerId)));
      if (linked.length > 1) throw new AccountError("Your historical payment accounts need review. Contact the team before adding a card.", 409);
      if (linked[0]?.id) {
        account.stripeCustomerId = linked[0].id;
        await tx.update(customerAccounts).set({ stripeCustomerId: linked[0].id }).where(eq(customerAccounts.id, accountId));
      }
    }
    if (account.stripeCustomerId) {
      const customer = await provider.customers.retrieve(account.stripeCustomerId);
      if (customer.deleted || customer.livemode) throw new AccountError("The saved payment account is unavailable. Contact the team.");
      if (customer.email !== account.email || customer.name !== account.fullName || customer.phone !== account.phone) {
        return provider.customers.update(customer.id, { email: account.email, name: account.fullName ?? "", phone: account.phone ?? "" });
      }
      return customer;
    }
    if (!create) return null;
    const customer = await provider.customers.create({ name: account.fullName ?? undefined, email: account.email, phone: account.phone ?? undefined, metadata: { sanbayAccountId: accountId } }, { idempotencyKey: `sbf-customer-${accountId}` });
    if (customer.livemode) throw new AccountError("Sandbox customer required.");
    await tx.update(customerAccounts).set({ stripeCustomerId: customer.id, updatedAt: new Date() }).where(eq(customerAccounts.id, accountId));
    return customer;
  });
}
export async function listCards(accountId: string): Promise<SafeCard[]> {
  const customer = await stripeCustomer(accountId); if (!customer) return [];
  const records = await verificationRecords(accountId);
  // Reconcile interrupted browser completions and refunds on the next Dashboard visit.
  for (const record of records.filter(item => item.paymentIntentId && (["pending", "processing", "requires_action"].includes(item.status) || item.refundStatus === "pending")).slice(0, 5)) await reconcileCardVerification(record.paymentIntentId!, accountId);
  const current = await verificationRecords(accountId);
  const freshCustomer = await payments().customers.retrieve(customer.id);
  const defaultId = freshCustomer.deleted ? null : ownerId(freshCustomer.invoice_settings.default_payment_method);
  const cards: SafeCard[] = [];
  for await (const method of payments().paymentMethods.list({ customer: customer.id, type: "card", limit: 100 })) {
    if (method.livemode || ownerId(method.customer) !== customer.id || !method.card) continue;
    const verification = current.find(item => item.paymentMethodId === method.id && item.status === "verified");
    cards.push({ verificationStatus: verification ? "verified" : "unverified", refundStatus: verification?.refundStatus, verificationPaymentId: verification?.paymentIntentId, id: method.id, brand: method.card.brand, last4: method.card.last4, expMonth: method.card.exp_month, expYear: method.card.exp_year, isDefault: defaultId === method.id });
  }
  return cards;
}
export async function addCardSetup(accountId: string, requestId: string) {
  const customer = await stripeCustomer(accountId, true);
  return startCardVerification(accountId, requestId, customer!.id);
}
export async function completeCardSetup(accountId: string, paymentIntentId: string) {
  const result = await reconcileCardVerification(paymentIntentId, accountId);
  if (!result.verified) throw new AccountError("The USD $2 card verification has not succeeded. Complete authentication or try another card.");
  await audit(accountId, "payment_method_verified");
  return listCards(accountId);
}
export async function changeCard(accountId: string, methodId: string, action: "default" | "remove" | "ensure-default") {
  if (!db) throw new AccountError("Account services unavailable.", 503);
  if (!/^pm_[a-zA-Z0-9]+$/.test(methodId)) throw new AccountError("Invalid payment method.");
  const provider = payments();
  await db.transaction(async tx => {
    await tx.execute(sql`select pg_advisory_xact_lock(hashtextextended(${accountId}, 0))`);
    const [account] = await tx.select().from(customerAccounts).where(eq(customerAccounts.id, accountId)).limit(1).for("update");
    if (!account?.stripeCustomerId) throw new AccountError("Payment account not found.");
    const customer = await provider.customers.retrieve(account.stripeCustomerId);
    const method = await provider.paymentMethods.retrieve(methodId);
    if (customer.deleted || customer.livemode || method.livemode || ownerId(method.customer) !== customer.id || !method.card) throw new AccountError("Payment method not found.", 404);
    const currentDefault = ownerId(customer.invoice_settings.default_payment_method);
    const verified = await tx.select().from(cardVerifications).where(and(eq(cardVerifications.accountId, accountId), eq(cardVerifications.status, "verified")));
    if (action !== "remove" && !verified.some(item => item.paymentMethodId === methodId)) throw new AccountError("Verify this card with the USD $2 Dashboard transaction first.", 409);
    if (action === "remove") {
      const pending = await tx.select({ id: membershipRequests.id }).from(membershipRequests).where(and(eq(membershipRequests.customerAccountId, accountId), eq(membershipRequests.stripePaymentMethodId, methodId), or(eq(membershipRequests.applicationState, "submitting"), inArray(membershipRequests.status, ["pending_review", "approved_payment_pending", "approved_payment_action_required", "approved_payment_failed"])))).limit(1);
      if (pending.length) throw new AccountError("This card is linked to an unfinished membership application. Resolve that application before removing it.", 409);
      if (currentDefault === methodId) {
        const alternatives = await provider.paymentMethods.list({ customer: customer.id, type: "card", limit: 100 });
        await provider.customers.update(customer.id, { invoice_settings: { default_payment_method: alternatives.data.find(card => card.id !== methodId && verified.some(item => item.paymentMethodId === card.id))?.id ?? "" } });
      }
      await provider.paymentMethods.detach(methodId);
    } else if (action === "default" || !currentDefault) await provider.customers.update(customer.id, { invoice_settings: { default_payment_method: methodId } });
  });
  if (action !== "ensure-default") await audit(accountId, action === "remove" ? "payment_method_removed" : "default_payment_method_changed");
}
export async function updateProfile(accountId: string, raw: unknown) {
  const parsed = profileSchema.safeParse(raw); if (!parsed.success) throw new AccountError(parsed.error.issues[0].message);
  await db!.update(customerAccounts).set({ ...parsed.data, updatedAt: new Date() }).where(eq(customerAccounts.id, accountId));
  await audit(accountId, "profile_updated");
}
export async function addresses(accountId: string): Promise<SavedAddress[]> {
  const rows = await db!.select().from(accountAddresses).where(eq(accountAddresses.accountId, accountId)).orderBy(desc(accountAddresses.isDefault), desc(accountAddresses.updatedAt));
  return rows.map(row => ({ id: row.id, kind: row.kind as "billing" | "delivery", isDefault: row.isDefault, details: row.details as SavedAddress["details"] }));
}
export async function saveAddress(accountId: string, raw: unknown) {
  const input = addressSchema.safeParse(raw); if (!input.success) throw new AccountError(input.error.issues[0].message);
  const { id, ...value } = input.data;
  await db!.transaction(async tx => {
    await tx.execute(sql`select pg_advisory_xact_lock(hashtextextended(${accountId}, 0))`);
    const rows = await tx.select().from(accountAddresses).where(and(eq(accountAddresses.accountId, accountId), eq(accountAddresses.kind, value.kind)));
    if (id && !rows.some(row => row.id === id)) throw new AccountError("Address not found.", 404);
    const isDefault = value.isDefault || rows.length === 0 || !!rows.find(row => row.id === id)?.isDefault;
    if (isDefault) await tx.update(accountAddresses).set({ isDefault: false }).where(and(eq(accountAddresses.accountId, accountId), eq(accountAddresses.kind, value.kind)));
    if (id) await tx.update(accountAddresses).set({ ...value, isDefault, updatedAt: new Date() }).where(and(eq(accountAddresses.id, id), eq(accountAddresses.accountId, accountId)));
    else await tx.insert(accountAddresses).values({ ...value, isDefault, accountId });
  });
  await audit(accountId, "address_saved");
}
export async function changeAddress(accountId: string, id: string, remove: boolean) {
  if (!z.string().uuid().safeParse(id).success) throw new AccountError("Invalid address.");
  await db!.transaction(async tx => {
    await tx.execute(sql`select pg_advisory_xact_lock(hashtextextended(${accountId}, 0))`);
    const [row] = await tx.select().from(accountAddresses).where(and(eq(accountAddresses.id, id), eq(accountAddresses.accountId, accountId))).limit(1);
    if (!row) throw new AccountError("Address not found.", 404);
    if (remove) {
      await tx.delete(accountAddresses).where(and(eq(accountAddresses.id, id), eq(accountAddresses.accountId, accountId)));
      if (row.isDefault) {
        const [next] = await tx.select().from(accountAddresses).where(and(eq(accountAddresses.accountId, accountId), eq(accountAddresses.kind, row.kind))).orderBy(desc(accountAddresses.updatedAt)).limit(1);
        if (next) await tx.update(accountAddresses).set({ isDefault: true }).where(eq(accountAddresses.id, next.id));
      }
    } else {
      await tx.update(accountAddresses).set({ isDefault: false }).where(and(eq(accountAddresses.accountId, accountId), eq(accountAddresses.kind, row.kind)));
      await tx.update(accountAddresses).set({ isDefault: true }).where(eq(accountAddresses.id, id));
    }
  });
  await audit(accountId, remove ? "address_deleted" : "default_address_changed");
}
export async function requestEmailChange(accountId: string, rawEmail: string, password: string, code: string) {
  await rateLimit("email-change", accountId, 3);
  const parsed = z.string().trim().toLowerCase().email().max(200).safeParse(rawEmail);
  if (!parsed.success || isMembershipAdmin(parsed.data)) throw new AccountError("Choose a valid customer email address.");
  const account = await reauthenticate(accountId, password, code);
  if (account.email === parsed.data) throw new AccountError("This is already your email address.");
  if (!resend) throw new AccountError("Email verification is currently unavailable. Your email has not changed.", 503);
  const token = randomBytes(32).toString("base64url");
  const change = { newEmail: parsed.data, tokenHash: digest(token), expiresAt: new Date(Date.now() + 30 * 60_000) };
  await db!.insert(accountEmailChanges).values({ accountId, ...change }).onConflictDoUpdate({ target: accountEmailChanges.accountId, set: change });
  const origin = process.env.NEXT_PUBLIC_SITE_URL ?? "https://sanbayfusion.com";
  const result = await resend.emails.send({ from: FROM_EMAIL, to: parsed.data, subject: "Confirm your Sanbay Fusion email change", text: `Confirm your new email while signed in to your existing Sanbay Fusion account: ${origin}/dashboard/personal?emailToken=${encodeURIComponent(token)}\nThis link expires in 30 minutes. If you did not request this change, ignore it. Your current email remains unchanged.` });
  if (result.error) throw new AccountError("Verification email could not be sent. Your email has not changed.", 503);
  await audit(accountId, "email_change_requested");
}
export async function confirmEmailChange(accountId: string, token: string) {
  await rateLimit("email-confirm", accountId);
  if (!/^[a-zA-Z0-9_-]{43}$/.test(token)) throw new AccountError("This email confirmation is invalid or expired.");
  await db!.transaction(async tx => {
    const [change] = await tx.select().from(accountEmailChanges).where(eq(accountEmailChanges.accountId, accountId)).limit(1).for("update");
    if (!change || change.expiresAt.getTime() < Date.now() || digest(token) !== change.tokenHash) throw new AccountError("This email confirmation is invalid or expired.");
    const existing = await tx.select({ id: customerAccounts.id }).from(customerAccounts).where(eq(customerAccounts.email, change.newEmail)).limit(1);
    if (existing.length) throw new AccountError("That email is unavailable. Request a different address.");
    const [profile] = await tx.select({ stripeCustomerId: customerAccounts.stripeCustomerId }).from(customerAccounts).where(eq(customerAccounts.id, accountId)).limit(1).for("update");
    await tx.update(customerAccounts).set({ email: change.newEmail, updatedAt: new Date() }).where(eq(customerAccounts.id, accountId));
    // Update contact lookup only; immutable purchase/application snapshots remain untouched.
    await tx.update(membershipRequests).set({ email: change.newEmail, customerAccountId: accountId }).where(membershipOwner(accountId, profile.stripeCustomerId));
    await tx.delete(accountEmailChanges).where(eq(accountEmailChanges.accountId, accountId));
    await tx.delete(customerSessions).where(eq(customerSessions.accountId, accountId));
  });
  const { createCustomerSession } = await import("@/lib/auth"); await createCustomerSession(accountId);
  await audit(accountId, "email_changed");
  const customer = await stripeCustomer(accountId).catch(() => null);
  if (customer) {
    const [account] = await db!.select().from(customerAccounts).where(eq(customerAccounts.id, accountId)).limit(1);
    await payments().customers.update(customer.id, { email: account.email }).catch(() => undefined);
  }
}
function membershipOwner(accountId: string, stripeCustomerId: string | null) {
  const direct = eq(membershipRequests.customerAccountId, accountId);
  // Legacy records may lack an account FK. Only an existing server-owned Stripe
  // mapping can establish that link; email matching alone is insufficient.
  return stripeCustomerId ? or(direct, and(isNull(membershipRequests.customerAccountId), eq(membershipRequests.stripeCustomerId, stripeCustomerId)))! : direct;
}
export async function accountMemberships(accountId: string) {
  const [profile] = await db!.select({ stripeCustomerId: customerAccounts.stripeCustomerId }).from(customerAccounts).where(eq(customerAccounts.id, accountId)).limit(1);
  if (!profile) return [];
  return db!.select().from(membershipRequests).where(membershipOwner(accountId, profile.stripeCustomerId)).orderBy(desc(membershipRequests.createdAt));
}
export async function accountPayments(accountId: string) {
  const [memberships, orders] = await Promise.all([accountMemberships(accountId), db!.select().from(customerOrders).where(eq(customerOrders.accountId, accountId)).orderBy(desc(customerOrders.createdAt)).limit(100)]);
  const verifications = await db!.select().from(cardVerifications).where(eq(cardVerifications.accountId, accountId)).orderBy(desc(cardVerifications.createdAt)).limit(100);
  return [...verifications.filter(row => row.paymentIntentId).map(row => ({ date: row.createdAt.toISOString(), reference: row.paymentIntentId!, description: "Card verification (separate from membership)", amount: row.amount / 100, currency: "USD", status: `${row.status} · refund ${row.refundStatus === "succeeded" ? "refunded" : row.refundStatus ?? "not initiated"}` })), ...memberships.filter(row => row.stripePaymentIntentId || row.stripeInvoiceId || row.invoiceNumber).map(row => ({ date: row.createdAt.toISOString(), reference: row.invoiceNumber ?? row.requestNumber, description: `Membership: ${row.planName}`, amount: row.estimatedTotal, currency: "THB", status: row.invoiceStatus ?? "unpaid" })), ...orders.map(row => ({ date: row.createdAt.toISOString(), reference: row.orderNumber, description: "Food / beverage order", amount: row.total, currency: "THB", status: row.paymentStatus }))].sort((a, b) => b.date.localeCompare(a.date));
}

/** Future checkout can call this with its authenticated session account ID. */
export async function accountDefaults(accountId: string) {
  const [account] = await db!.select({ fullName: customerAccounts.fullName, email: customerAccounts.email, phone: customerAccounts.phone }).from(customerAccounts).where(eq(customerAccounts.id, accountId)).limit(1);
  if (!account) throw new AccountError("Account not found.", 404);
  const [saved, cards] = await Promise.all([addresses(accountId), listCards(accountId)]);
  return { ...account, billingAddress: saved.find(row => row.kind === "billing" && row.isDefault) ?? null, deliveryAddress: saved.find(row => row.kind === "delivery" && row.isDefault) ?? null, paymentMethod: cards.find(card => card.isDefault && card.verificationStatus === "verified") ?? null };
}
