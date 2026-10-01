import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";

import * as schema from "@/lib/db/schema";
import type { CustomerAccount } from "@/lib/db/schema";
import Stripe from "stripe";
const state = vi.hoisted(() => ({ db: null as typeof import("@/lib/db").db, account: null as import("@/lib/db/schema").CustomerAccount | null }));
vi.mock("@/lib/auth", () => ({ getCurrentAccount: async () => state.account }));
vi.mock("@/lib/membership-checkout", () => ({ readMembershipCheckoutSelection: async () => ({ configuration }) }));
vi.mock("server-only", () => ({}));
vi.mock("@/lib/db", () => ({ get db() { return state.db; } }));
import { prepareApplication, submitApplication, approveApplication, declineApplication, getApplicationForAccount, checkApplicationSetup, changeApplicationPaymentMethod, chargeApprovedApplication, reconcileApplicationPayment } from "@/lib/membership-application";
import { applicationConsentVersion } from "@/lib/membership-application-types";
import { POST as stripeWebhook } from "@/app/api/stripe/webhook/route";
import { calendarMonths, serviceYears } from "@/lib/membership-service-months";
import { membershipPreferredTimes } from "@/lib/membership-plans";
const enabled = process.env.RUN_MEMBERSHIP_SANDBOX_E2E === "true";
const suite = enabled ? describe : describe.skip;
let client: ReturnType<typeof postgres>;
let database: NonNullable<typeof state.db>;
let stripe: Stripe;
const rollback = new Error("SANDBOX_FIXTURE_ROLLBACK");
const details = { customer: { fullName: "Sandbox Application Verification", phone: "+66812345678" }, billingAddress: { country: "GB", line1: "10 Test Street", line2: "", city: "London", state: "", postalCode: "SW1A 1AA" }, deliveryAddress: { country: "Thailand", line1: "999 Rama I Road", line2: "", subdistrict: "Pathum Wan", district: "Pathum Wan", province: "Bangkok", postalCode: "10330" } };
const configuration = { planSlug: "3-month-membership", selectedServiceMonths: calendarMonths(serviceYears()[1]).slice(0, 3), purchaseMode: "membership_with_package", foodPreferences: [], deliveryArea: "Bangkok", preferredDay: "Monday", preferredTime: membershipPreferredTimes[0], alcoholEnabled: false, selectedProducts: [{ category: "Thai soups", name: "Tom Yum Goong", quantity: 4 }], selectedAddOns: [] };
async function fixture(work: (account: CustomerAccount) => Promise<void>) {
  try {
    await database.transaction(async tx => {
      state.db = tx as unknown as typeof database;
      const [account] = await tx.insert(schema.customerAccounts).values({ email: `sandbox-${crypto.randomUUID()}@example.invalid`, fullName: "Sandbox verification", passwordHash: "NO_LOGIN_SANDBOX_TEST_ONLY" }).returning();
      state.account = account;
      await work(account);
      throw rollback;
    });
  } catch (error) {
    if (error === rollback) return;
    if (error instanceof Stripe.errors.StripeError) throw new Error(`Stripe Sandbox verification: ${error.type} / ${error.code ?? "unknown"} / ${error.message}`);
    throw error;
  } finally { state.db = null; state.account = null; }
}
async function prepared(account: CustomerAccount, pm = "pm_card_visa") {
  const draft = await prepareApplication(account, configuration, details);
  const row = await getApplicationForAccount(draft.applicationId, account.id);
  expect(row.stripePaymentIntentId).toBeNull(); expect(row.memberId).toBeNull();
  const setup = await stripe.setupIntents.confirm(row.stripeSetupIntentId!, { payment_method: pm });
  expect(setup.livemode).toBe(false); expect(setup.status).toBe("succeeded");
  await checkApplicationSetup(row.id, account.id);
  const consent = { applicationId: row.id, quoteHash: draft.quoteHash, authorizeCharge: true, acceptTerms: true, acceptPrivacy: true, consentVersion: applicationConsentVersion };
  await submitApplication(account, consent);
  const pending = await getApplicationForAccount(row.id, account.id);
  expect(pending.status).toBe("pending_review"); expect(pending.stripePaymentIntentId).toBeNull(); expect(pending.memberId).toBeNull();
  expect((await stripe.paymentIntents.list({ customer: pending.stripeCustomerId!, limit: 10 })).data).toHaveLength(0);
  return { draft, pending, consent };
}
suite("historical Stripe Sandbox application lifecycle with rolled-back database fixtures", () => {
 beforeAll(() => {
   if (!process.env.STRIPE_SECRET_KEY?.startsWith("sk_test_") || !process.env.DATABASE_URL || process.env.RAILWAY_PROJECT_ID !== "ea31f46e-5f06-4394-8580-22f343c28132") throw new Error("Authorized Railway Sandbox environment required");
   // Use the existing administrative delivery-zone rules for deterministic fixture validation.
   vi.stubEnv("GOOGLE_MAPS_SERVER_API_KEY", "");
   client = postgres(process.env.DATABASE_URL, { prepare: false, max: 1 });
   database = drizzle(client, { schema }); stripe = new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: "2026-08-26.dahlia" });
 });
 afterAll(async () => { if (client) await client.end(); vi.unstubAllEnvs(); });
 it("saves card, submits uncharged, approves exact monthly quote and activates exactly once", async () => fixture(async account => {
   const { pending, consent } = await prepared(account);
   expect(pending.estimatedTotal).toBe(18840);
   const immutable = pending.applicationSnapshot;
   await submitApplication(account, consent);
   await expect(prepareApplication(account, { ...configuration, planSlug: "1-month-membership", selectedServiceMonths: configuration.selectedServiceMonths.slice(0, 1) }, details)).rejects.toThrow("already have");
   const active = await approveApplication(pending.id, "sandbox-test-admin");
   expect(active.status).toBe("active"); expect(active.invoiceStatus).toBe("paid"); expect(active.memberId).toMatch(/^SBF-M-/); expect(active.membershipStartDate).toBeTruthy(); expect(active.membershipExpiryDate).toBeTruthy();
   const again = await approveApplication(pending.id, "sandbox-test-admin");
   const replay = await reconcileApplicationPayment(pending.id);
   expect(again.memberId).toBe(active.memberId); expect(replay.activatedAt).toEqual(active.activatedAt); expect(replay.applicationSnapshot).toEqual(immutable);
   const intents = await stripe.paymentIntents.list({ customer: active.stripeCustomerId!, limit: 10 });
   expect(intents.data).toHaveLength(1); expect(intents.data[0]).toMatchObject({ status: "succeeded", amount: 1884000, currency: "thb", livemode: false });
   const payload = JSON.stringify({ id: `evt_fixture_${crypto.randomUUID()}`, object: "event", livemode: false, type: "payment_intent.payment_failed", data: { object: { ...intents.data[0], status: "requires_payment_method" } } });
   const signature = stripe.webhooks.generateTestHeaderString({ payload, secret: process.env.STRIPE_WEBHOOK_SECRET! });
   for (let i = 0; i < 2; i++) expect((await stripeWebhook(new Request("http://localhost/api/stripe/webhook", { method: "POST", headers: { "stripe-signature": signature }, body: payload }))).status).toBe(200);
   expect((await getApplicationForAccount(pending.id, account.id)).memberId).toBe(active.memberId);

 }), 120000);
 it("declines without ever creating a membership charge", async () => fixture(async account => {
   const { pending } = await prepared(account);
   const declined = await declineApplication(pending.id, "sandbox-test-admin");
   expect(declined.status).toBe("declined"); expect(declined.memberId).toBeNull();
   expect((await approveApplication(pending.id, "sandbox-test-admin")).status).toBe("declined");
   expect((await stripe.paymentIntents.list({ customer: pending.stripeCustomerId!, limit: 10 })).data).toHaveLength(0);
 }), 120000);
 it("rejects incomplete setup, altered quote, missing consent, and another account", async () => fixture(async account => {
   const draft = await prepareApplication(account, configuration, details);
   const input = { applicationId: draft.applicationId, quoteHash: draft.quoteHash, authorizeCharge: true, acceptTerms: true, acceptPrivacy: true, consentVersion: applicationConsentVersion };
   await expect(submitApplication(account, input)).rejects.toThrow("Complete Stripe");
   await expect(submitApplication(account, { ...input, quoteHash: "0".repeat(64) })).rejects.toThrow("quote changed");
   await expect(submitApplication(account, { ...input, authorizeCharge: false })).rejects.toThrow("Accept");
   await expect(getApplicationForAccount(draft.applicationId, crypto.randomUUID())).rejects.toThrow("not found");
   await expect(prepareApplication(account, configuration, { ...details, deliveryAddress: { ...details.deliveryAddress, province: "Chiang Mai" } })).rejects.toThrow("outside");
   const row = await getApplicationForAccount(draft.applicationId, account.id);
   const second = await prepareApplication(account, configuration, details);
   expect(second.applicationId).toBe(row.id); expect(second.clientSecret).toBe(draft.clientSecret);
 }), 120000);
 it("does not activate on decline, then saves a replacement card and retries the same intent", async () => fixture(async account => {
   const { pending } = await prepared(account, "pm_card_chargeCustomerFail");
   const failed = await approveApplication(pending.id, "sandbox-test-admin");
   expect(failed.status).toBe("approved_payment_failed"); expect(failed.memberId).toBeNull(); expect(failed.activatedAt).toBeNull();
   await changeApplicationPaymentMethod(pending.id, account.id);
   const changed = await getApplicationForAccount(pending.id, account.id);
   await stripe.setupIntents.confirm(changed.stripeSetupIntentId!, { payment_method: "pm_card_visa" });
   await chargeApprovedApplication(pending.id, true, account.id);
   const active = await getApplicationForAccount(pending.id, account.id);
   expect(active.status).toBe("active"); expect(active.stripePaymentIntentId).toBe(failed.stripePaymentIntentId); expect(active.applicationSnapshot).toEqual(pending.applicationSnapshot);
   expect((await stripe.paymentIntents.list({ customer: pending.stripeCustomerId!, limit: 10 })).data).toHaveLength(1);
 }), 120000);

 // Current Dashboard, invoice and SCA browser coverage lives in membership-invoice.sandbox.test.ts.
});
