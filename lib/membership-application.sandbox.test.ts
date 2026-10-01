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
import { prepareApplication, submitApplication, approveApplication, declineApplication, getApplicationForAccount, checkApplicationSetup, changeApplicationPaymentMethod, chargeApprovedApplication, reconcileApplicationPayment, getRecoveryPayment } from "@/lib/membership-application";
import { applicationConsentVersion } from "@/lib/membership-application-types";
import { POST as stripeWebhook } from "@/app/api/stripe/webhook/route";
import { POST as applicationApi } from "@/app/api/membership/application/route";
import { build } from "esbuild";
import { globSync, readFileSync } from "node:fs";
import { calendarMonths, serviceYears } from "@/lib/membership-service-months";
import { membershipPreferredTimes, membershipPlans } from "@/lib/membership-plans";
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
suite("real Stripe Sandbox application lifecycle with rolled-back database fixtures", () => {
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
 it("browser: secure Elements setup, uncharged submission, bank authentication and activation", async () => fixture(async account => {
   const { chromium } = await import("playwright");
   const bundle = await build({ entryPoints: ["scripts/application-browser-harness.tsx"], bundle: true, write: false, platform: "browser", jsx: "automatic", define: { "process.env.NODE_ENV": '"production"' } });
   const css = globSync(".next/static/chunks/*.css").map(path => readFileSync(path, "utf8")).join("\n");
   const browser = await chromium.launch({ executablePath: "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe", headless: true });
   const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
   page.setDefaultTimeout(15000);
   const origin = "http://localhost:3100";
   try {
     await page.route(`${origin}/**`, async (route: { request: () => { url: () => string; postData: () => string | null }; fulfill: (options: object) => Promise<void> }) => {
       const request = route.request();
       if (request.url().includes("/api/membership/application")) {
         const response = await applicationApi(new Request(`${origin}/api/membership/application`, { method: "POST", headers: { origin }, body: request.postData() }));
         return route.fulfill({ status: response.status, contentType: "application/json", body: await response.text() });
       }
       return route.fulfill({ contentType: "text/html", body: `<html class="dark"><head><style>${css}</style></head><body><div id="root" style="padding-top:40px"></div><script>${bundle.outputFiles[0].text}</script></body></html>` });
     });
     await page.goto(`${origin}/membership/checkout`);
     const quote = (await import("@/lib/membership-request")).validateMembershipConfiguration(configuration);
     if (!quote.ok) throw new Error("Invalid test quote");
     await page.evaluate((props: unknown) => (window as unknown as { mountApplication: (value: unknown) => void }).mountApplication(props), { plan: membershipPlans[2], account: { fullName: details.customer.fullName, email: account.email, phone: details.customer.phone }, purchaseSnapshot: quote.purchaseSnapshot, publishableKey: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY });
     const billing = page.locator("fieldset").nth(1); const delivery = page.locator("fieldset").nth(2);
     await billing.getByLabel("Country").selectOption("GB");
     await billing.getByLabel("Address line 1").fill(details.billingAddress.line1);
     await billing.getByRole("textbox", { name: /^City/ }).fill("London"); await billing.getByLabel("Postal / ZIP code").fill("SW1A 1AA");
     await delivery.getByLabel("Address", { exact: false }).first().fill(details.deliveryAddress.line1);
     await delivery.getByLabel("Subdistrict").fill("Pathum Wan"); await delivery.getByLabel("District /", { exact: false }).last().fill("Pathum Wan"); await delivery.getByLabel("Postal code").fill("10330");
     expect(await page.getByRole("button", { name: "SUBMIT MEMBERSHIP REQUEST" }).isDisabled()).toBe(true);
     await page.getByRole("button", { name: "Validate details & continue" }).click();
     let frame = page.mainFrame();
     for (let i = 0; i < 60; i++) {
       let found = false;
       for (const child of page.frames()) if (await child.getByLabel("Card number", { exact: true }).count()) { frame = child; found = true; break; }
       if (found) break;
       await new Promise(resolve => setTimeout(resolve, 500));
     }
     console.log("Browser verification: secure card fields located");
     await frame.getByLabel("Card number").fill("4000002760003184");
     await frame.getByLabel(/Expiry date|Expiration/).fill("1234"); await frame.getByLabel("Security code").fill("123");
     const country = frame.getByLabel("Country"); if (await country.count()) await country.selectOption("GB");
     const postal = frame.getByLabel(/Postal code|ZIP/); if (await postal.count()) await postal.fill("SW1A 1AA");
     async function completeChallenge() {
       for (let i = 0; i < 120; i++) {
         for (const child of page.frames()) {
           const button = child.getByRole("button", { name: /Complete authentication/i });
           if (await button.count()) { await button.click(); return; }
         }
         await new Promise(resolve => setTimeout(resolve, 500));
       }
       throw new Error("Stripe test authentication challenge did not appear");
     }
     await page.getByRole("button", { name: "Save payment method securely" }).click();
     await completeChallenge();
     console.log("Browser verification: Stripe authentication completed");
     await page.getByText("PAYMENT METHOD ADDED", { exact: true }).waitFor({ timeout: 30000 });
     console.log("Browser verification: payment method ready without membership charge");
     await page.getByRole("checkbox").nth(0).check(); await page.getByRole("checkbox").nth(1).check(); await page.getByRole("checkbox").nth(2).check();
     await page.getByRole("button", { name: "SUBMIT MEMBERSHIP REQUEST" }).click();
     await page.waitForURL(/request-received/);
     const id = new URL(page.url()).searchParams.get("id")!;
     const pending = await getApplicationForAccount(id, account.id);
     expect(pending.status).toBe("pending_review"); expect(pending.stripePaymentIntentId).toBeNull();
     const action = await approveApplication(id, "sandbox-browser-admin");
     expect(action.status).toBe("approved_payment_action_required"); expect(action.memberId).toBeNull();
     const initial = await getRecoveryPayment(id, account.id);
     await page.evaluate((props: unknown) => (window as unknown as { mountRecovery: (value: unknown) => void }).mountRecovery(props), { applicationId: id, publishableKey: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY, initial });
     await page.getByRole("button", { name: "Complete bank authentication" }).click();
     await completeChallenge();
     console.log("Browser verification: Stripe authentication completed");
     await page.getByText("Payment succeeded. View your active membership.").waitFor({ timeout: 30000 });
     const active = await getApplicationForAccount(id, account.id);
     expect(active.status).toBe("active"); expect(active.stripePaymentIntentId).toBe(action.stripePaymentIntentId);
     expect((await stripe.paymentIntents.list({ customer: active.stripeCustomerId!, limit: 10 })).data).toHaveLength(1);
   } catch (error) {
     await page.screenshot({ path: ".next/verification/application-browser-debug.png", fullPage: true });
     for (const child of page.frames()) console.log("Browser fields:", await child.locator("input").evaluateAll((inputs: HTMLInputElement[]) => inputs.map(input => ({ name: input.name, placeholder: input.placeholder, ariaLabel: input.getAttribute("aria-label") }))));
     throw error;
   } finally { await browser.close(); }
 }), 180000);

});
