import { membershipEligibilityInput, membershipEligibilityError, membershipEligibilityDeclaration, hasMembershipEligibilityDeclaration } from "@/lib/membership-eligibility";
import "server-only";
import Stripe from "stripe";
import { and, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { stripe } from "@/lib/stripe";
import { customerAccounts, membershipRequests, type CustomerAccount, type MembershipRequest } from "@/lib/db/schema";
import { applicationConsentVersion, applicationDetailsSchema, chargeAuthorization, submitApplicationSchema, type ApplicationDetails, type ApplicationSnapshot, type PaymentMethodSummary } from "@/lib/membership-application-types";
import { validateMembershipConfiguration, type MembershipPurchaseSnapshot } from "@/lib/membership-request";
import { hashPurchaseSnapshot } from "@/lib/membership-snapshot-hash";
import { checkDeliveryEligibility } from "@/lib/delivery";
import { geocodeGoogleAddress } from "@/lib/google-geocoding";
import { lockMembershipAccount, lockMembershipApplication, assertMembershipPurchaseAllowed, membershipsForAccount } from "@/lib/membership-access";
import { validateServiceMonths } from "@/lib/membership-service-months";
import { ApplicationError } from "@/lib/membership-errors";
export { ApplicationError } from "@/lib/membership-errors";
import { activateMembershipRequest } from "@/lib/membership-activation";
import { hasInactiveMembershipProducts, validSavedQuote } from "@/lib/membership-quote-integrity";

function services() {
  if (!db || !stripe) throw new ApplicationError("Membership application services are unavailable.", 503);
  return { database: db, payments: stripe };
}
function customerId(value: string | { id: string } | null) { return typeof value === "string" ? value : value?.id; }
const approvedStatuses = new Set(["approved_payment_pending", "approved_payment_action_required", "approved_payment_failed"]);

export async function deliveryEligibility(address: ApplicationDetails["deliveryAddress"]) {
  let place: import("@/lib/delivery").DeliveryEligibilityRequest = { placeId: "application-address", formattedAddress: Object.values(address).join(", "), province: address.province, district: address.district, subdistrict: address.subdistrict, postalCode: address.postalCode };
  if (process.env.GOOGLE_MAPS_SERVER_API_KEY) {
    const result = await geocodeGoogleAddress({ address: place.formattedAddress });
    if (!result.ok) throw new ApplicationError("We could not verify your delivery address. Please check it and try again.");
    place = { ...place, ...result.place };
  }
  const result = checkDeliveryEligibility(place);
  if (result.status !== "available" || !result.zoneId) throw new ApplicationError("Your delivery address is outside the supported service area or needs verification.");
  return { status: "available" as const, zoneId: result.zoneId, checkedAt: new Date().toISOString() };
}

/** A draft contains only server-priced products and validated addresses. No charge. */
export async function prepareApplication(account: CustomerAccount, configuration: unknown, rawDetails: unknown) {
  const { database, payments } = services();
  const parsed = applicationDetailsSchema.safeParse(rawDetails);
  if (!parsed.success) throw new ApplicationError("Complete your customer details, billing address, and Thailand delivery address.");
  const details = parsed.data;
  const quote = validateMembershipConfiguration(configuration);
  if (!quote.ok) throw new ApplicationError(quote.error);
  const eligibility = await deliveryEligibility(details.deliveryAddress);
  return database.transaction(async tx => {
    const profile = await lockMembershipAccount(tx, account.id);
    await assertMembershipPurchaseAllowed(tx, profile, quote.plan.id);
    let application = (await membershipsForAccount(profile, tx)).find(row => row.status === "application_draft" && row.planId === quote.plan.id);
    const newTerm = !application;
    let stripeCustomerId = profile.stripeCustomerId;
    const billing = details.billingAddress;
    const customerData = { name: details.customer.fullName, email: profile.email, phone: details.customer.phone, address: { line1: billing.line1, line2: billing.line2, city: billing.city, state: billing.state, postal_code: billing.postalCode, country: billing.country } };
    if (!stripeCustomerId) {
      const customer = await payments.customers.create({ ...customerData, metadata: { sanbayAccountId: account.id } }, { idempotencyKey: `sbf-customer-${account.id}` });
      if (customer.livemode) throw new ApplicationError("Sandbox customer required.");
      stripeCustomerId = customer.id;
    } else {
      const customer = await payments.customers.retrieve(stripeCustomerId);
      if (customer.deleted || customer.livemode) throw new ApplicationError("Saved customer is unavailable. Contact the team.");
      await payments.customers.update(stripeCustomerId, customerData);
    }
    await tx.update(customerAccounts).set({ fullName: details.customer.fullName, phone: details.customer.phone, stripeCustomerId, updatedAt: new Date() }).where(eq(customerAccounts.id, account.id));
    const values = {
      customerAccountId: account.id, planId: quote.plan.id, planName: quote.plan.name,
      planSnapshot: { id: quote.plan.id, slug: quote.plan.slug, name: quote.plan.name, durationMonths: quote.plan.durationMonths, price: quote.plan.price },
      annualFee: quote.membershipFee, addOnTotal: quote.packageSubtotal, estimatedTotal: quote.total, durationMonths: quote.plan.durationMonths,
      deliveryDays: 0, annualDeliveryDays: 0, fullName: details.customer.fullName, email: profile.email, phone: details.customer.phone,
      address: { billing: billing, delivery: details.deliveryAddress, eligibility }, contactPreferences: { email: true },
      configuration: quote.configuration, selectedServiceMonths: quote.configuration.selectedServiceMonths,
      purchaseSnapshot: quote.purchaseSnapshot, stripeCustomerId, status: "application_draft" as const,
    };
    if (newTerm) {
      [application] = await tx.insert(membershipRequests).values({ ...values, requestNumber: `M-${crypto.randomUUID().slice(0, 24)}` }).returning();
    } else {
      [application] = await tx.update(membershipRequests).set(values).where(eq(membershipRequests.id, application!.id)).returning();
    }
    if (!application) throw new ApplicationError("Unable to prepare your application.", 409);
    let setup = application.stripeSetupIntentId ? await payments.setupIntents.retrieve(application.stripeSetupIntentId) : null;
    if (!setup || setup.status === "canceled") {
      setup = await payments.setupIntents.create({ customer: stripeCustomerId, usage: "off_session", payment_method_types: ["card"], metadata: { application_id: application.id, account_id: account.id, purpose: "membership_application" } }, { idempotencyKey: `sbf-setup-${application.id}-${application.stripeSetupIntentId ?? "initial"}` });
      await tx.update(membershipRequests).set({ stripeSetupIntentId: setup.id }).where(eq(membershipRequests.id, application.id));
    }
    if (setup.livemode || customerId(setup.customer) !== stripeCustomerId) throw new ApplicationError("Invalid setup session.");
    return { applicationId: application.id, clientSecret: setup.client_secret, setupStatus: setup.status, purchaseSnapshot: quote.purchaseSnapshot, quoteHash: hashPurchaseSnapshot(quote.purchaseSnapshot), deliveryEligibility: eligibility };
  });
}

async function verifiedMethod(application: MembershipRequest, payments: Stripe) {
  if (!application.stripeSetupIntentId || !application.stripeCustomerId) throw new ApplicationError("Add a payment method first.");
  const setup = await payments.setupIntents.retrieve(application.stripeSetupIntentId);
  if (setup.livemode || setup.status !== "succeeded" || customerId(setup.customer) !== application.stripeCustomerId || setup.metadata?.application_id !== application.id || setup.metadata?.account_id !== application.customerAccountId) throw new ApplicationError("Complete Stripe payment method setup before submitting.");
  const methodId = customerId(setup.payment_method);
  if (!methodId) throw new ApplicationError("Payment method is missing.");
  const method = await payments.paymentMethods.retrieve(methodId);
  if (method.livemode || customerId(method.customer) !== application.stripeCustomerId || !method.card) throw new ApplicationError("The payment method does not belong to this customer.");
  const summary: PaymentMethodSummary = { brand: method.card.brand, last4: method.card.last4, expMonth: method.card.exp_month, expYear: method.card.exp_year };
  return { methodId, summary };
}

export async function getApplicationForAccount(id: string, accountId: string) {
  const { database } = services();
  const [row] = await database.select().from(membershipRequests).where(and(eq(membershipRequests.id, id), eq(membershipRequests.customerAccountId, accountId))).limit(1);
  if (!row) throw new ApplicationError("Application not found.", 404);
  return row;
}

export async function checkApplicationSetup(id: string, accountId: string) {
  const { payments } = services();
  const row = await getApplicationForAccount(id, accountId);
  const method = await verifiedMethod(row, payments);
  return { paymentMethod: method.summary, quoteHash: hashPurchaseSnapshot(row.purchaseSnapshot), purchaseSnapshot: row.purchaseSnapshot };
}

export async function changeApplicationPaymentMethod(id: string, accountId: string) {
  const { database, payments } = services();
  return database.transaction(async tx => {
    const { row, account } = await lockMembershipApplication(tx, id, accountId);
    if (account) await assertMembershipPurchaseAllowed(tx, account, row.planId, row.id);
    if (!row || !row.stripeCustomerId || !["application_draft", "approved_payment_failed", "approved_payment_action_required"].includes(row.status)) throw new ApplicationError("Payment method cannot be changed in this state.", 409);
    // A succeeded/processing payment must not be replaced just because the webhook is delayed.
    if (row.stripePaymentIntentId) {
      const intent = await payments.paymentIntents.retrieve(row.stripePaymentIntentId);
      if (["succeeded", "processing"].includes(intent.status)) throw new ApplicationError("Payment is already processing. Refresh your dashboard.", 409);
    }
    const existing = row.stripeSetupIntentId ? await payments.setupIntents.retrieve(row.stripeSetupIntentId) : null;
    if (existing && existing.status !== "succeeded" && existing.status !== "canceled") return { clientSecret: existing.client_secret };
    const setup = await payments.setupIntents.create({ customer: row.stripeCustomerId, usage: "off_session", payment_method_types: ["card"], metadata: { application_id: row.id, account_id: accountId, purpose: "membership_application" } }, { idempotencyKey: `sbf-change-method-${id}-${row.stripeSetupIntentId ?? "initial"}` });
    await tx.update(membershipRequests).set({ stripeSetupIntentId: setup.id }).where(eq(membershipRequests.id, row.id));
    return { clientSecret: setup.client_secret };
  });
}

export async function submitApplication(account: CustomerAccount, raw: unknown) {
  if (!membershipEligibilityInput.safeParse(raw).success) throw new ApplicationError(membershipEligibilityError);
  const { database, payments } = services();
  const input = submitApplicationSchema.safeParse(raw);
  if (!input.success) throw new ApplicationError("Accept the displayed charge authorization, terms and privacy policy.");
  return database.transaction(async tx => {
    const { row, account: profile } = await lockMembershipApplication(tx, input.data.applicationId, account.id);
    if (row.applicationSnapshot && row.status !== "application_draft") return { applicationId: row.id, requestNumber: row.requestNumber };
    await assertMembershipPurchaseAllowed(tx, profile!, row.planId, row.id);
    if (row.status !== "application_draft" || row.stripePaymentIntentId) throw new ApplicationError("This application cannot be submitted.", 409);
    const purchase = row.purchaseSnapshot as MembershipPurchaseSnapshot;
    if (!validSavedQuote(purchase) || hasInactiveMembershipProducts(purchase) || purchase.version !== 4 || JSON.stringify(row.selectedServiceMonths) !== JSON.stringify(purchase.selectedServiceMonths)) throw new ApplicationError("Review your membership and selected months again.", 409);
    const monthError = validateServiceMonths(row.selectedServiceMonths, row.durationMonths, new Date());
    if (monthError) throw new ApplicationError(monthError, 409);
    if (input.data.quoteHash !== hashPurchaseSnapshot(purchase)) throw new ApplicationError("Your quote changed. Review the latest summary and accept the agreements again.", 409);
    const address = row.address as { billing: ApplicationDetails["billingAddress"]; delivery: ApplicationDetails["deliveryAddress"] };
    const eligibility = await deliveryEligibility(address.delivery);
    const method = await verifiedMethod(row, payments);
    const now = new Date();
    const snapshot: ApplicationSnapshot = {
      membershipEligibility: membershipEligibilityDeclaration(now),
      version: 1, reference: row.requestNumber, accountId: account.id, accountCreatedAt: account.createdAt.toISOString(),
      customer: { fullName: row.fullName, email: account.email, phone: row.phone }, purchase, expectedAmount: row.estimatedTotal, currency: "thb",
      billingAddress: address.billing, deliveryAddress: address.delivery, deliveryEligibility: eligibility,
      stripeCustomerId: row.stripeCustomerId!, stripePaymentMethodId: method.methodId, paymentMethod: method.summary, submittedAt: now.toISOString(),
      consent: { version: applicationConsentVersion, acceptedAt: now.toISOString(), authorization: chargeAuthorization, amount: row.estimatedTotal, currency: "thb", terms: true, privacy: true, reference: row.requestNumber },
    };
    await tx.update(membershipRequests).set({ applicationSnapshot: snapshot, stripePaymentMethodId: method.methodId, paymentMethodSummary: method.summary, submittedAt: now, status: "pending_review", invoiceStatus: null }).where(eq(membershipRequests.id, row.id));
    return { applicationId: row.id, requestNumber: row.requestNumber };
  });
}

function approvedSnapshot(row: MembershipRequest): ApplicationSnapshot {
  const snapshot = row.applicationSnapshot as ApplicationSnapshot | null;
  if (snapshot?.purchase.version === 4 && JSON.stringify(row.selectedServiceMonths) !== JSON.stringify(snapshot.purchase.selectedServiceMonths)) throw new ApplicationError("Saved service months do not match the authorized application.", 409);
  if (!snapshot || !validSavedQuote(snapshot.purchase) || hasInactiveMembershipProducts(snapshot.purchase)) throw new ApplicationError("The saved price calculation is invalid. New customer confirmation is required.", 409);
  if (!snapshot || snapshot.version !== 1 || snapshot.accountId !== row.customerAccountId || snapshot.stripeCustomerId !== row.stripeCustomerId || snapshot.consent.version !== applicationConsentVersion || !snapshot.consent.terms || !snapshot.consent.privacy || snapshot.consent.authorization !== chargeAuthorization || snapshot.consent.amount !== snapshot.expectedAmount || snapshot.currency !== "thb" || snapshot.expectedAmount !== row.estimatedTotal || snapshot.purchase.total !== row.estimatedTotal || snapshot.purchase.plan.durationMonths !== row.durationMonths || hashPurchaseSnapshot(snapshot.purchase) !== hashPurchaseSnapshot(row.purchaseSnapshot) || !Number.isSafeInteger(snapshot.expectedAmount) || snapshot.expectedAmount <= 0 || !snapshot.consent.acceptedAt) throw new ApplicationError("The saved application or authorization is invalid. New customer confirmation is required.", 409);
  return snapshot;
}

/** Approval commits an exact-amount intent before any charge is attempted. */
export async function approveApplication(id: string, actor: string) {
  const { database, payments } = services();
  const shouldCharge = await database.transaction(async tx => {
    const { row, account } = await lockMembershipApplication(tx, id);
    if (row.status !== "pending_review") return row.status === "approved_payment_pending";
    if (account) await assertMembershipPurchaseAllowed(tx, account, row.planId, row.id);
    if (row.invoiceStatus === "paid" || row.stripePaymentIntentId) throw new ApplicationError("This application already has a payment.", 409);
    const snapshot = approvedSnapshot(row);
    if (!hasMembershipEligibilityDeclaration(snapshot.membershipEligibility)) throw new ApplicationError("International-visitor eligibility confirmation is required. Ask the customer to submit a new application.", 409);
    if (snapshot.purchase.version === 4) {
      const monthError = validateServiceMonths(row.selectedServiceMonths, row.durationMonths, new Date());
      if (monthError) throw new ApplicationError(`${monthError} Ask the customer to submit a new selection; no charge has been made.`, 409);
    }
    await deliveryEligibility(snapshot.deliveryAddress);
    const customer = await payments.customers.retrieve(snapshot.stripeCustomerId);
    const method = await payments.paymentMethods.retrieve(row.stripePaymentMethodId!);
    if (customer.deleted || customer.livemode || method.livemode || customerId(method.customer) !== snapshot.stripeCustomerId) throw new ApplicationError("The saved payment method is no longer available.");
    const intent = await payments.paymentIntents.create({ customer: snapshot.stripeCustomerId, payment_method: row.stripePaymentMethodId!, amount: snapshot.expectedAmount * 100, currency: "thb", payment_method_types: ["card"], metadata: { payment_type: "APPROVED_MEMBERSHIP", application_id: row.id, account_id: row.customerAccountId!, application_hash: hashPurchaseSnapshot(snapshot) }, description: `${row.planName} — approved application ${row.requestNumber}` }, { idempotencyKey: `sbf-approved-application-${row.id}` });
    await tx.update(membershipRequests).set({ status: "approved_payment_pending", approvedAt: new Date(), reviewedBy: actor, stripePaymentIntentId: intent.id, paymentAttempt: 1, invoiceStatus: "awaiting_payment" }).where(eq(membershipRequests.id, row.id));
    return true;
  });
  if (shouldCharge) await chargeApprovedApplication(id, false);
  return reconcileApplicationPayment(id);
}

export async function declineApplication(id: string, actor: string) {
  const { database } = services();
  const [row] = await database.update(membershipRequests).set({ status: "declined", reviewedBy: actor, paymentFailure: null }).where(and(eq(membershipRequests.id, id), eq(membershipRequests.status, "pending_review"))).returning();
  if (!row) throw new ApplicationError("Only a pending application can be declined.", 409);
  return row;
}

export async function chargeApprovedApplication(id: string, retry: boolean, accountId?: string) {
  const { database, payments } = services();
  await database.transaction(async tx => {
    const { row, account } = await lockMembershipApplication(tx, id, accountId);
    if (!approvedStatuses.has(row.status) || !row.approvedAt || !row.stripePaymentIntentId) return;
    if (account) await assertMembershipPurchaseAllowed(tx, account, row.planId, row.id);
    approvedSnapshot(row);
    let intent = await payments.paymentIntents.retrieve(row.stripePaymentIntentId);
    if (["succeeded", "processing", "canceled"].includes(intent.status) || (intent.status === "requires_action" && !retry)) return;
    if (row.selectedServiceMonths) {
      const monthError = validateServiceMonths(row.selectedServiceMonths, row.durationMonths, new Date());
      if (monthError) throw new ApplicationError(monthError, 409);
    }
    if (row.status !== "approved_payment_pending" && !retry) return;
    let methodId = row.stripePaymentMethodId!;
    let summary = row.paymentMethodSummary;
    if (retry) {
      const verified = await verifiedMethod(row, payments);
      methodId = verified.methodId; summary = verified.summary;
    }
    const method = await payments.paymentMethods.retrieve(methodId);
    if (method.livemode || customerId(method.customer) !== row.stripeCustomerId) throw new ApplicationError("Payment method ownership could not be verified.");
    const attempt = retry ? row.paymentAttempt + 1 : row.paymentAttempt;
    try {
      intent = await payments.paymentIntents.confirm(intent.id, { payment_method: methodId, off_session: true }, { idempotencyKey: `sbf-membership-confirm-${row.id}-${attempt}` });
    } catch (error) {
      if (!(error instanceof Stripe.errors.StripeCardError)) throw error;
      intent = await payments.paymentIntents.retrieve(intent.id);
    }
    await tx.update(membershipRequests).set({ stripePaymentMethodId: methodId, paymentMethodSummary: summary, paymentAttempt: attempt }).where(eq(membershipRequests.id, row.id));
  });
  return reconcileApplicationPayment(id);
}

/** Always retrieve current Stripe state: delayed/out-of-order webhooks cannot regress it. */
export async function reconcileApplicationPayment(id: string) {
  const { database, payments } = services();
  const row = await database.transaction(async tx => {
    const { row: application } = await lockMembershipApplication(tx, id);
    if (!application.applicationSnapshot || !application.approvedAt || !application.stripePaymentIntentId || !approvedStatuses.has(application.status)) return application;
    const snapshot = approvedSnapshot(application);
    const intent = await payments.paymentIntents.retrieve(application.stripePaymentIntentId);
    if (intent.livemode || customerId(intent.customer) !== application.stripeCustomerId || intent.amount !== snapshot.expectedAmount * 100 || (intent.status === "succeeded" && intent.amount_received !== snapshot.expectedAmount * 100) || intent.currency !== "thb" || intent.metadata.payment_type !== "APPROVED_MEMBERSHIP" || intent.metadata.account_id !== application.customerAccountId || intent.metadata.application_id !== application.id || intent.metadata.application_hash !== hashPurchaseSnapshot(snapshot)) throw new ApplicationError("Payment does not match the approved application.", 409);
    let status: MembershipRequest["status"] = "approved_payment_pending";
    let paymentFailure: string | null = null;
    if (intent.status === "succeeded") status = "payment_received";
    else if (intent.status === "requires_action" || intent.last_payment_error?.code === "authentication_required") { status = "approved_payment_action_required"; paymentFailure = "Your bank requires payment authentication."; }
    else if (intent.status === "requires_payment_method" || intent.status === "canceled") { status = "approved_payment_failed"; paymentFailure = "Your payment could not be completed. Update your payment method or retry."; }
    const [updated] = await tx.update(membershipRequests).set({ status, paymentFailure, invoiceStatus: status === "payment_received" ? "paid" : "awaiting_payment" }).where(eq(membershipRequests.id, application.id)).returning();
    return updated;
  });
  if (row.applicationSnapshot && row.approvedAt && row.status === "payment_received") return await activateMembershipRequest({ id: row.id, actor: row.reviewedBy ?? "approved-application" }) ?? row;
  return row;
}

export async function getRecoveryPayment(id: string, accountId: string) {
  const { payments } = services();
  await getApplicationForAccount(id, accountId);
  const row = await reconcileApplicationPayment(id);
  const intent = row.stripePaymentIntentId && approvedStatuses.has(row.status) ? await payments.paymentIntents.retrieve(row.stripePaymentIntentId) : null;
  return { status: row.status, clientSecret: intent?.client_secret ?? null, paymentMethodId: row.stripePaymentMethodId, paymentMethod: row.paymentMethodSummary, failure: row.paymentFailure };
}
