import "server-only";
import { z } from "zod";
import type Stripe from "stripe";
import { and, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { stripe } from "@/lib/stripe";
import { accountAddresses, cardVerifications, customerAccounts, membershipRequests, type CustomerAccount, type MembershipRequest } from "@/lib/db/schema";
import { addressSchema, profileSchema, type SafeCard } from "@/lib/account/types";
import { stripeObjectId } from "@/lib/account/card-verification";
import { applicationDetailsSchema, applicationConsentVersion, billingAddressSchema, deliveryAddressSchema, chargeAuthorization, submitApplicationSchema, type ApplicationSnapshot } from "@/lib/membership-application-types";
import type { MembershipAccountReview } from "@/lib/membership-review-types";
import { validateMembershipConfiguration } from "@/lib/membership-request";
import { validateServiceMonths } from "@/lib/membership-service-months";
import { hashPurchaseSnapshot } from "@/lib/membership-snapshot-hash";
import { validSavedQuote } from "@/lib/membership-quote-integrity";
import { assertMembershipPurchaseAllowed, lockMembershipAccount, lockMembershipApplication, membershipsForAccount } from "@/lib/membership-access";
import { ApplicationError } from "@/lib/membership-errors";
import { activateMembershipRequest } from "@/lib/membership-activation";
import { deliveryEligibility, declineApplication as declineLegacy } from "@/lib/membership-application";
import { sendApplicationNotifications } from "@/lib/email/membership-application";
import { containsMembershipAlcohol, membershipAlcoholMessage } from "@/lib/membership-food";
import { membershipEligibilityInput, membershipEligibilityError, membershipEligibilityDeclaration, hasMembershipEligibilityDeclaration } from "@/lib/membership-eligibility";

function services() { if (!db || !stripe) throw new ApplicationError("Membership services are currently unavailable.", 503); return { database: db, payments: stripe }; }
type Reader = Pick<NonNullable<typeof db>, "select">;
export async function membershipAccountReview(accountId: string, reader: Reader = services().database): Promise<MembershipAccountReview> {
  const { payments } = services();
  const [profile] = await reader.select().from(customerAccounts).where(eq(customerAccounts.id, accountId));
  if (!profile) throw new ApplicationError("Please sign in again.", 401);
  const saved = await reader.select().from(accountAddresses).where(and(eq(accountAddresses.accountId, accountId), eq(accountAddresses.isDefault, true)));
  const validAddress = (kind: "billing" | "delivery") => { const row = saved.find(item => item.kind === kind); return row ? addressSchema.safeParse(row) : null; };
  const billing = validAddress("billing"), delivery = validAddress("delivery");
  const verified = await reader.select().from(cardVerifications).where(and(eq(cardVerifications.accountId, accountId), eq(cardVerifications.status, "verified")));
  const cards: SafeCard[] = [];
  if (profile.stripeCustomerId) {
    const customer = await payments.customers.retrieve(profile.stripeCustomerId);
    if (customer.deleted || customer.livemode) throw new ApplicationError("Your payment account needs review.", 409);
    for await (const method of payments.paymentMethods.list({ customer: customer.id, type: "card", limit: 100 })) {
      if (method.livemode || !method.card || stripeObjectId(method.customer) !== customer.id || !verified.some(item => item.paymentMethodId === method.id && item.stripeCustomerId === customer.id)) continue;
      cards.push({ id: method.id, brand: method.card.brand, last4: method.card.last4, expMonth: method.card.exp_month, expYear: method.card.exp_year, isDefault: stripeObjectId(customer.invoice_settings.default_payment_method) === method.id, verificationStatus: "verified" });
    }
  }
  const customer = { fullName: profile.fullName ?? "", email: profile.email, phone: profile.phone ?? "" };
  const requirements: MembershipAccountReview["requirements"] = [
    { label: "Personal information", complete: profileSchema.safeParse({ ...customer, displayName: profile.displayName ?? "" }).success && !!customer.email, section: "personal" },
    { label: "Default billing address", complete: !!billing?.success, section: "addresses" },
    { label: "Default Thailand delivery address", complete: !!delivery?.success, section: "addresses" },
    { label: "Verified saved payment method", complete: cards.length > 0, section: "payment-methods" },
    { label: "Default verified payment method", complete: cards.some(card => card.isDefault), section: "payment-methods" },
  ];
  return { customer, billingAddress: billing?.success ? billingAddressSchema.parse(billing.data.details) : null, deliveryAddress: delivery?.success ? deliveryAddressSchema.parse({ ...delivery.data.details, country: "Thailand" }) : null, cards, requirements, complete: requirements.every(item => item.complete) };
}
export async function prepareInvoiceApplication(account: CustomerAccount, configuration: unknown) {
  const { database } = services();
  const quote = validateMembershipConfiguration(configuration);
  if (!quote.ok) throw new ApplicationError(quote.error);
  return database.transaction(async tx => {
    const profile = await lockMembershipAccount(tx, account.id);
    await assertMembershipPurchaseAllowed(tx, profile);
    let draft = (await membershipsForAccount(profile, tx)).find(item => item.status === "application_draft");
    if (draft?.submittedAt) {
      const snapshot = invoiceApplicationSnapshot(draft);
      const review: MembershipAccountReview = { customer: snapshot.customer, billingAddress: snapshot.billingAddress, deliveryAddress: snapshot.deliveryAddress, cards: [{ ...snapshot.paymentMethod, id: snapshot.stripePaymentMethodId, isDefault: true, verificationStatus: "verified" }], requirements: [], complete: true };
      return { review, purchaseSnapshot: snapshot.purchase, applicationId: draft.id, quoteHash: hashPurchaseSnapshot(snapshot.purchase), reviewHash: hashPurchaseSnapshot(review) };
    }
    const review = await membershipAccountReview(account.id, tx);
    if (!review.complete) return { review, purchaseSnapshot: quote.purchaseSnapshot, applicationId: null, quoteHash: "", reviewHash: "" };
    const details = applicationDetailsSchema.parse({ customer: review.customer, billingAddress: review.billingAddress, deliveryAddress: review.deliveryAddress });
    const eligibility = await deliveryEligibility(details.deliveryAddress);
    const values = { customerAccountId: account.id, planId: quote.plan.id, planName: quote.plan.name, planSnapshot: quote.purchaseSnapshot.plan, annualFee: quote.membershipFee, addOnTotal: quote.packageSubtotal, estimatedTotal: quote.total, durationMonths: quote.plan.durationMonths, deliveryDays: 0, annualDeliveryDays: 0, fullName: review.customer.fullName, email: review.customer.email, phone: review.customer.phone, address: { billing: details.billingAddress, delivery: details.deliveryAddress, eligibility }, contactPreferences: { email: true }, configuration: quote.configuration, selectedServiceMonths: quote.configuration.selectedServiceMonths, purchaseSnapshot: quote.purchaseSnapshot, stripeCustomerId: profile.stripeCustomerId, status: "application_draft" as const };
    if (draft) [draft] = await tx.update(membershipRequests).set(values).where(eq(membershipRequests.id, draft.id)).returning();
    else [draft] = await tx.insert(membershipRequests).values({ ...values, requestNumber: `SBF-${crypto.randomUUID().slice(0, 23)}` }).returning();
    return { review, purchaseSnapshot: quote.purchaseSnapshot, applicationId: draft.id, quoteHash: hashPurchaseSnapshot(quote.purchaseSnapshot), reviewHash: hashPurchaseSnapshot(review) };
  });
}

export async function submitInvoiceApplication(account: CustomerAccount, raw: unknown) {
  if (!membershipEligibilityInput.safeParse(raw).success) throw new ApplicationError(membershipEligibilityError);
  const { database } = services();
  const input = submitApplicationSchema.extend({ paymentMethodId: z.string().regex(/^pm_[a-zA-Z0-9]+$/), reviewHash: z.string().length(64) }).safeParse(raw);
  if (!input.success) throw new ApplicationError("Review your account, select a verified card and accept all agreements.");
  const id = await database.transaction(async tx => {
    const { row, account: profile } = await lockMembershipApplication(tx, input.data.applicationId, account.id);
    if (row.applicationSnapshot && row.submittedAt) {
      if ((row.applicationSnapshot as ApplicationSnapshot).version !== 2) throw new ApplicationError("This historical application uses a different payment flow.", 409);
      if (input.data.paymentMethodId !== row.stripePaymentMethodId || input.data.quoteHash !== hashPurchaseSnapshot(row.purchaseSnapshot)) throw new ApplicationError("This submitted agreement is fixed. Reload its saved review to finish creating the invoice.", 409);
      return row.id;
    }
    await assertMembershipPurchaseAllowed(tx, profile!, row.id);
    if (row.status !== "application_draft" || row.stripePaymentIntentId) throw new ApplicationError("Application cannot be submitted.", 409);
    const quote = validateMembershipConfiguration(row.configuration);
    if (!quote.ok || hashPurchaseSnapshot(quote.purchaseSnapshot) !== input.data.quoteHash || hashPurchaseSnapshot(row.purchaseSnapshot) !== input.data.quoteHash) throw new ApplicationError("Your quote changed. Review and accept the latest total.", 409);
    const review = await membershipAccountReview(account.id, tx);
    if (!review.complete) throw new ApplicationError("Complete the missing information in your Dashboard before submitting.", 409);
    if (hashPurchaseSnapshot(review) !== input.data.reviewHash) throw new ApplicationError("Your Dashboard details changed. Reload the final review before submitting.", 409);
    const card = review.cards.find(item => item.id === input.data.paymentMethodId);
    if (!card) throw new ApplicationError("Select a verified card belonging to your account.", 409);
    const details = applicationDetailsSchema.parse({ customer: review.customer, billingAddress: review.billingAddress, deliveryAddress: review.deliveryAddress });
    const eligibility = await deliveryEligibility(details.deliveryAddress);
    const now = new Date();
    const summary = { brand: card.brand, last4: card.last4, expMonth: card.expMonth, expYear: card.expYear };
    const snapshot: ApplicationSnapshot = { membershipEligibility: membershipEligibilityDeclaration(now), version: 2, reference: row.requestNumber, accountId: account.id, accountCreatedAt: profile!.createdAt.toISOString(), customer: review.customer, purchase: quote.purchaseSnapshot, expectedAmount: quote.total, currency: "thb", billingAddress: details.billingAddress, deliveryAddress: details.deliveryAddress, deliveryEligibility: eligibility, stripeCustomerId: profile!.stripeCustomerId!, stripePaymentMethodId: card.id, paymentMethod: summary, submittedAt: now.toISOString(), consent: { version: applicationConsentVersion, acceptedAt: now.toISOString(), authorization: chargeAuthorization, amount: quote.total, currency: "thb", terms: true, privacy: true, reference: row.requestNumber } };
    // Commit the immutable authorization before external invoice creation, so retries recover the same record.
    await tx.update(membershipRequests).set({ applicationSnapshot: snapshot, stripePaymentMethodId: card.id, paymentMethodSummary: summary, submittedAt: now, applicationState: "submitting", invoiceStatus: "awaiting_payment" }).where(eq(membershipRequests.id, row.id));
    return row.id;
  });
  const row = await ensureDraftInvoice(id, account.id);
  await sendApplicationNotifications(row);
  return { applicationId: row.id, requestNumber: row.requestNumber };
}

export function invoiceApplicationSnapshot(row: MembershipRequest) {
  const s = row.applicationSnapshot as ApplicationSnapshot | null;
  if (!s || s.version !== 2 || !validSavedQuote(s.purchase) || s.accountId !== row.customerAccountId || s.reference !== row.requestNumber || s.stripeCustomerId !== row.stripeCustomerId || s.stripePaymentMethodId !== row.stripePaymentMethodId || s.currency !== "thb" || s.expectedAmount !== row.estimatedTotal || s.purchase.total !== row.estimatedTotal || hashPurchaseSnapshot(s.purchase) !== hashPurchaseSnapshot(row.purchaseSnapshot) || JSON.stringify(s.purchase.selectedServiceMonths) !== JSON.stringify(row.selectedServiceMonths) || s.consent.version !== applicationConsentVersion || s.consent.authorization !== chargeAuthorization || !s.consent.terms || !s.consent.privacy || s.consent.amount !== s.expectedAmount || !s.consent.acceptedAt) throw new ApplicationError("Saved invoice agreement is invalid.", 409);
  return s;
}
function invoiceLines(s: ApplicationSnapshot) {
  if (containsMembershipAlcohol([...s.purchase.products, ...s.purchase.addOns])) throw new ApplicationError(membershipAlcoholMessage, 409);
  const lines = [{ description: `${s.purchase.plan.name} — ${s.purchase.selectedServiceMonths!.join(", ")}`, amount: s.purchase.membershipFee * 100 }];
  const products = [...s.purchase.products, ...s.purchase.addOns];
  if (products.length <= 35) for (const item of products) lines.push({ description: `${item.name} — ${item.totalTermQuantity ?? ("quantity" in item ? item.quantity : item.monthlyQuantity) ?? 1} total units${item.pricingType === "MONTHLY" ? ` across ${s.purchase.plan.durationMonths} selected service months` : " (one-time)"}`, amount: item.lineTotal * 100 });
  else {
    const groups = new Map<string, number>();
    for (const item of products) groups.set(item.category, (groups.get(item.category) ?? 0) + item.lineTotal * 100);
    for (const [category, amount] of groups) lines.push({ description: `Prepaid package — ${category} (full itemization in application ${s.reference})`, amount });
  }
  for (const charge of s.purchase.charges ?? []) if (charge.amount) lines.push({ description: charge.label, amount: charge.amount * 100 });
  if (lines.reduce((sum, line) => sum + line.amount, 0) !== s.expectedAmount * 100) throw new ApplicationError("Invoice line total mismatch.", 409);
  return lines;
}
function checkInvoice(invoice: Stripe.Invoice, row: MembershipRequest, s: ApplicationSnapshot, checkTotal = true) {
  if (invoice.livemode || stripeObjectId(invoice.customer) !== s.stripeCustomerId || invoice.currency !== "thb" || invoice.metadata?.application_id !== row.id || invoice.metadata?.account_id !== row.customerAccountId || invoice.metadata?.application_hash !== hashPurchaseSnapshot(s) || stripeObjectId(invoice.default_payment_method) !== s.stripePaymentMethodId || (checkTotal && (invoice.total !== s.expectedAmount * 100 || invoice.amount_due !== s.expectedAmount * 100))) throw new ApplicationError("Stripe invoice does not match the submitted agreement.", 409);
}
export async function ensureDraftInvoice(id: string, accountId: string) {
  const { database, payments } = services();
  return database.transaction(async tx => {
    const { row } = await lockMembershipApplication(tx, id, accountId);
    if (row.applicationState !== "submitting") return row;
    const s = invoiceApplicationSnapshot(row);
    if (!hasMembershipEligibilityDeclaration(s.membershipEligibility)) throw new ApplicationError("A new application with international-visitor eligibility confirmation is required before invoice creation or approval. Contact the team.", 409);
    if (containsMembershipAlcohol([...s.purchase.products, ...s.purchase.addOns])) throw new ApplicationError(membershipAlcoholMessage, 409);
    let invoice: Stripe.Invoice | null = row.stripeInvoiceId ? await payments.invoices.retrieve(row.stripeInvoiceId) : null;
    if (!invoice) for await (const candidate of payments.invoices.list({ customer: s.stripeCustomerId, limit: 100 })) {
      if (candidate.metadata?.application_id === row.id) { invoice = candidate; break; }
    }
    if (!invoice) {
      const billing = s.billingAddress;
      await payments.customers.update(s.stripeCustomerId, { name: s.customer.fullName, email: s.customer.email, phone: s.customer.phone, address: { line1: billing.line1, line2: billing.line2, city: billing.city, state: billing.state, postal_code: billing.postalCode, country: billing.country } });
      invoice = await payments.invoices.create({ customer: s.stripeCustomerId, currency: "thb", auto_advance: false, collection_method: "charge_automatically", default_payment_method: s.stripePaymentMethodId, pending_invoice_items_behavior: "exclude", automatic_tax: { enabled: false }, default_tax_rates: [], discounts: [], payment_settings: { payment_method_types: ["card"] }, description: `PENDING REVIEW — DO NOT COLLECT — ${s.reference}`, custom_fields: [{ name: "Application", value: s.reference }], metadata: { purpose: "MEMBERSHIP_INVOICE", application_id: row.id, account_id: accountId, application_hash: hashPurchaseSnapshot(s), approval: "pending_review" } }, { idempotencyKey: `sbf-invoice-${row.id}` });
    }
    checkInvoice(invoice, row, s, false);
    if (invoice.status !== "draft" || invoice.auto_advance) throw new ApplicationError("Invoice advanced before approval. Staff review is required.", 409);
    const existing: Stripe.InvoiceLineItem[] = [];
    for await (const line of payments.invoices.listLineItems(invoice.id, { limit: 100 })) existing.push(line);
    const expected = invoiceLines(s);
    for (let i = 0; i < expected.length; i++) {
      const saved = existing.filter(line => line.metadata.sbf_line === String(i));
      if (saved.length > 1 || saved.some(line => line.amount !== expected[i].amount)) throw new ApplicationError("Invoice lines need staff review.", 409);
      if (!saved.length) await payments.invoiceItems.create({ customer: s.stripeCustomerId, invoice: invoice.id, currency: "thb", ...expected[i], discountable: false, tax_rates: [], metadata: { application_id: row.id, sbf_line: String(i) } }, { idempotencyKey: `sbf-invoice-line-${row.id}-${i}` });
    }
    invoice = await payments.invoices.retrieve(invoice.id);
    checkInvoice(invoice, row, s);
    const [updated] = await tx.update(membershipRequests).set({ stripeInvoiceId: invoice.id, stripeInvoiceStatus: "draft", applicationState: "pending_review", status: "pending_review" }).where(eq(membershipRequests.id, row.id)).returning();
    return updated;
  });
}

export async function approveInvoiceApplication(id: string, actor: string) {
  const { database, payments } = services();
  const [existing] = await database.select().from(membershipRequests).where(eq(membershipRequests.id, id));
  if (!existing?.applicationState) throw new ApplicationError("This historical application needs a new Dashboard-verified card agreement and draft invoice before approval. Contact the customer to reapply.", 409);
  return database.transaction(async tx => {
    const { row, account } = await lockMembershipApplication(tx, id);
    if (row.applicationState === "approved" || row.applicationState === "completed") return row;
    if (row.status !== "pending_review" || !row.stripeInvoiceId) throw new ApplicationError("Only pending draft invoices can be approved.", 409);
    await assertMembershipPurchaseAllowed(tx, account!, row.id);
    const s = invoiceApplicationSnapshot(row);
    if (!hasMembershipEligibilityDeclaration(s.membershipEligibility)) throw new ApplicationError("International-visitor eligibility confirmation is missing. Decline this pending application and ask the customer to reapply with the current eligibility declaration.", 409);
    if (containsMembershipAlcohol([...s.purchase.products, ...s.purchase.addOns])) throw new ApplicationError(membershipAlcoholMessage, 409);
    const monthError = validateServiceMonths(row.selectedServiceMonths, row.durationMonths, new Date());
    if (monthError) throw new ApplicationError(monthError, 409);
    await deliveryEligibility(s.deliveryAddress);
    const invoice = await payments.invoices.retrieve(row.stripeInvoiceId);
    checkInvoice(invoice, row, s);
    if (invoice.status !== "draft" || invoice.auto_advance) throw new ApplicationError("Invoice must be a draft with automatic collection disabled.", 409);
    const method = await payments.paymentMethods.retrieve(s.stripePaymentMethodId);
    if (method.livemode || stripeObjectId(method.customer) !== s.stripeCustomerId) throw new ApplicationError("Submitted card is no longer available.", 409);
    await payments.invoices.update(invoice.id, { auto_advance: false, description: `APPROVED — READY FOR STAFF COLLECTION — ${s.reference}`, metadata: { approval: "approved" } });
    const [updated] = await tx.update(membershipRequests).set({ applicationState: "approved", status: "approved_payment_pending", approvedAt: new Date(), reviewedBy: actor }).where(eq(membershipRequests.id, row.id)).returning();
    return updated;
  });
}
export async function declineInvoiceApplication(id: string, actor: string) {
  const { database, payments } = services();
  const [existing] = await database.select().from(membershipRequests).where(eq(membershipRequests.id, id));
  if (!existing?.applicationState) return declineLegacy(id, actor);
  return database.transaction(async tx => {
    const { row } = await lockMembershipApplication(tx, id);
    if (row.applicationState === "declined") return row;
    if (row.status !== "pending_review" || !row.stripeInvoiceId) throw new ApplicationError("Only pending applications can be declined.", 409);
    let invoice;
    try { invoice = await payments.invoices.retrieve(row.stripeInvoiceId); } catch (error) { if ((error as { code?: string }).code !== "resource_missing") throw error; }
    if (invoice) {
      checkInvoice(invoice, row, invoiceApplicationSnapshot(row));
      if (invoice.status === "draft") await payments.invoices.del(invoice.id);
      else if (invoice.status === "open" || invoice.status === "uncollectible") await payments.invoices.voidInvoice(invoice.id);
      else if (invoice.status !== "void") throw new ApplicationError("Invoice was already paid. Review this unexpected payment before declining.", 409);
    }
    const [updated] = await tx.update(membershipRequests).set({ applicationState: "declined", status: "declined", reviewedBy: actor, stripeInvoiceStatus: !invoice || invoice.status === "draft" ? "deleted" : "void", invoiceStatus: "cancelled_by_admin" }).where(eq(membershipRequests.id, row.id)).returning();
    return updated;
  });
}

/** A paid label alone (including an out-of-band mark) is never proof of a card payment. */
export async function reconcileMembershipInvoice(invoiceId: string) {
  const { database, payments } = services();
  const [linked] = await database.select().from(membershipRequests).where(eq(membershipRequests.stripeInvoiceId, invoiceId));
  if (!linked?.applicationState) return null;
  const result = await database.transaction(async tx => {
    const { row } = await lockMembershipApplication(tx, linked.id);
    if (row.applicationState === "declined") return row;
    const s = invoiceApplicationSnapshot(row);
    const invoice = await payments.invoices.retrieve(invoiceId);
    const refuseActivation = async (message: string) => {
      const [updated] = await tx.update(membershipRequests).set({ stripeInvoiceStatus: invoice.status, paymentFailure: message, status: row.approvedAt && !row.activatedAt ? "approved_payment_failed" : row.status }).where(eq(membershipRequests.id, row.id)).returning();
      return updated;
    };
    try { checkInvoice(invoice, row, s); } catch (error) {
      if (!(error instanceof ApplicationError)) throw error;
      return refuseActivation("The Stripe invoice differs from your authorized application. Contact our team for payment review.");
    }
    let status = row.status, paymentStatus = row.invoiceStatus, failure = row.paymentFailure, paymentId = row.stripePaymentIntentId;
    if (!row.approvedAt || !["approved", "completed"].includes(row.applicationState!)) {
      if (invoice.status !== "draft") return refuseActivation("The invoice changed before application approval. Our team must review the payment; membership has not been activated.");
    } else if (!["active", "expired", "cancelled", "cancellation_requested"].includes(row.status)) {
      let successful: Stripe.PaymentIntent | null = null;
      let latest: Stripe.PaymentIntent | null = null;
      for await (const payment of payments.invoicePayments.list({ invoice: invoiceId, limit: 100 })) {
        if (payment.payment.type !== "payment_intent" || !payment.payment.payment_intent) continue;
        const intent = await payments.paymentIntents.retrieve(stripeObjectId(payment.payment.payment_intent)!);
        if (intent.livemode || stripeObjectId(intent.customer) !== s.stripeCustomerId || intent.currency !== "thb" || intent.amount !== s.expectedAmount * 100) return refuseActivation("The invoice payment does not match your authorized application. Contact our team for payment review.");
        latest = intent;
        if (payment.status === "paid" && payment.amount_paid === s.expectedAmount * 100 && intent.status === "succeeded" && intent.amount_received === s.expectedAmount * 100 && stripeObjectId(intent.payment_method) === s.stripePaymentMethodId) successful = intent;
      }
      if (invoice.status === "paid") {
        if (!successful || invoice.amount_paid !== s.expectedAmount * 100) return refuseActivation("Stripe has marked this invoice paid, but no matching authorized card payment was confirmed. Contact our team; membership has not been activated.");
        status = "payment_received"; paymentStatus = "paid"; paymentId = successful.id; failure = null;
      } else if (latest?.status === "requires_action" || latest?.last_payment_error?.code === "authentication_required") {
        status = "approved_payment_action_required"; failure = "Your bank requires authentication. Open the approved invoice payment page.";
      } else if (latest?.last_payment_error || ["void", "uncollectible"].includes(invoice.status ?? "")) {
        status = "approved_payment_failed"; failure = "Membership payment has not succeeded. Contact the team to retry the same approved invoice.";
      }
    }
    const [updated] = await tx.update(membershipRequests).set({ status, invoiceStatus: paymentStatus, stripeInvoiceStatus: invoice.status, paymentFailure: failure, stripePaymentIntentId: paymentId, invoiceNumber: invoice.number, hostedInvoiceUrl: invoice.hosted_invoice_url, invoicePdf: invoice.invoice_pdf }).where(eq(membershipRequests.id, row.id)).returning();
    return updated;
  });
  if (result.status === "payment_received" && result.approvedAt) {
    const active = await activateMembershipRequest({ id: result.id, actor: "stripe-invoice-webhook" });
    return active ?? result;
  }
  return result;
}

export async function invoiceRecovery(id: string, accountId: string) {
  const { database, payments } = services();
  const [owned] = await database.select().from(membershipRequests).where(and(eq(membershipRequests.id, id), eq(membershipRequests.customerAccountId, accountId)));
  if (!owned?.approvedAt || !owned.stripeInvoiceId || !owned.applicationState) throw new ApplicationError("Approved invoice not found.", 404);
  const row = await reconcileMembershipInvoice(owned.stripeInvoiceId) ?? owned;
  let clientSecret: string | null = null;
  if (row.status === "approved_payment_action_required") {
    for await (const payment of payments.invoicePayments.list({ invoice: owned.stripeInvoiceId, limit: 100 })) {
      if (payment.payment.type !== "payment_intent" || !payment.payment.payment_intent) continue;
      const intent = await payments.paymentIntents.retrieve(stripeObjectId(payment.payment.payment_intent)!);
      if (intent.status === "requires_action" && stripeObjectId(intent.customer) === row.stripeCustomerId && stripeObjectId(intent.payment_method) === row.stripePaymentMethodId && intent.amount === row.estimatedTotal * 100 && intent.currency === "thb") clientSecret = intent.client_secret;
    }
  }
  return { status: row.status, invoiceStatus: row.stripeInvoiceStatus, paymentConfirmed: row.invoiceStatus === "paid", clientSecret, failure: row.paymentFailure, invoicePdf: row.invoiceStatus === "paid" ? row.invoicePdf : null };
}
