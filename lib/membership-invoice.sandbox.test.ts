import { membershipEligibilityVersion } from "@/lib/membership-eligibility";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { PGlite } from "@electric-sql/pglite";
import { drizzle } from "drizzle-orm/pglite";
import { eq } from "drizzle-orm";
import { readFileSync, readdirSync, mkdirSync, writeFileSync, globSync } from "node:fs";
import path from "node:path";
import { build } from "esbuild";
import { createServer, type Server } from "node:http";
import { spawn, type ChildProcess } from "node:child_process";
import * as schema from "@/lib/db/schema";
import type { CustomerAccount } from "@/lib/db/schema";
const state = vi.hoisted(() => ({ db: null as typeof import("@/lib/db").db, account: null as CustomerAccount | null }));
vi.mock("server-only", () => ({}));
vi.mock("@/lib/db", () => ({ get db() { return state.db; } }));
vi.mock("@/lib/auth", () => ({ getCurrentAccount: async () => state.account, normalizeEmail: (email: string) => email.trim().toLowerCase() }));
vi.mock("@/lib/email/membership-application", () => ({ sendApplicationNotifications: vi.fn() }));
vi.mock("@/lib/email/membership-request", () => ({ sendMembershipPaymentReviewEmail: vi.fn() }));
vi.mock("@/lib/membership-checkout", () => ({ readMembershipCheckoutSelection: async () => ({ configuration }) }));
import { stripe as provider } from "@/lib/stripe";
import { stripeCustomer, addCardSetup, completeCardSetup, listCards, saveAddress, changeCard } from "@/lib/account/service";
import { membershipAccountReview, prepareInvoiceApplication, submitInvoiceApplication, approveInvoiceApplication, declineInvoiceApplication, reconcileMembershipInvoice, invoiceRecovery } from "@/lib/membership-invoice";
import { applicationConsentVersion } from "@/lib/membership-application-types";
import { membershipPreferredTimes, membershipPlans } from "@/lib/membership-plans";
import { validateMembershipConfiguration } from "@/lib/membership-request";
import { hasActiveMembership } from "@/lib/membership-term";

const enabled = process.env.RUN_INVOICE_SANDBOX_E2E === "true";
const stripe = provider!;
const configuration = { planSlug: "3-month-membership", selectedServiceMonths: ["2027-02", "2027-07", "2027-11"], purchaseMode: "membership_with_package", foodPreferences: [], deliveryArea: "Bangkok", preferredDay: "Monday", preferredTime: membershipPreferredTimes[0], alcoholEnabled: false, selectedProducts: [{ category: "Thai soups", name: "Tom Yum Goong", quantity: 4 }], selectedAddOns: [] };
let client: PGlite, database: ReturnType<typeof drizzle<typeof schema>>, server: Server, listener: ChildProcess;
let webhook: typeof import("@/app/api/stripe/webhook/route").POST;
const received: { id: string; type: string; objectId: string; status: number }[] = [];
const evidence: Record<string, unknown> = { mode: "test", liveKeysUsed: false, fixtures: [] };
async function eventually(check: () => Promise<boolean>, timeout = 45000) { const start = Date.now(); while (!await check()) { if (Date.now() - start > timeout) throw new Error("Timed out waiting for signed Stripe webhook state"); await new Promise(resolve => setTimeout(resolve, 300)); } }
async function fixture() {
  const [account] = await database.insert(schema.customerAccounts).values({ fullName: "Invoice Sandbox Fixture", email: `sbf-invoice-${crypto.randomUUID()}@example.invalid`, phone: "+66812345678", passwordHash: "TEST_ONLY" }).returning();
  const common = { name: account.fullName!, phone: account.phone!, country: "TH", line1: "999 Rama I Road", line2: "", city: "Bangkok", state: "Bangkok", subdistrict: "Pathum Wan", district: "Pathum Wan", province: "Bangkok", postalCode: "10330" };
  await saveAddress(account.id, { kind: "billing", details: common });
  await saveAddress(account.id, { kind: "delivery", details: common });
  state.account = account;
  return account;
}
async function verifiedCard(account: CustomerAccount, method = "pm_card_visa", webhookOnly = false) {
  const requestId = crypto.randomUUID();
  const setup = await addCardSetup(account.id, requestId);
  expect((await addCardSetup(account.id, requestId)).paymentIntentId).toBe(setup.paymentIntentId);
  const intent = await stripe.paymentIntents.confirm(setup.paymentIntentId, { payment_method: method });
  expect(intent).toMatchObject({ amount: 200, currency: "usd", status: "succeeded", livemode: false });
  if (webhookOnly) await eventually(async () => (await database.select().from(schema.cardVerifications).where(eq(schema.cardVerifications.paymentIntentId, intent.id)))[0]?.status === "verified");
  const cards = await completeCardSetup(account.id, intent.id);
  const card = cards.find(item => item.id === intent.payment_method)!;
  expect(card.verificationStatus).toBe("verified");
  expect((await stripe.refunds.list({ payment_intent: intent.id })).data).toMatchObject([{ amount: 200, currency: "usd", status: "succeeded" }]);
  return { card, intent };
}
async function application(account: CustomerAccount) {
  const prepared = await prepareInvoiceApplication(account, configuration);
  expect(prepared.review.complete).toBe(true);
  const input = { applicationId: prepared.applicationId, quoteHash: prepared.quoteHash, reviewHash: prepared.reviewHash, paymentMethodId: prepared.review.cards.find(card => card.isDefault)!.id, confirmInternationalVisitor: true, eligibilityVersion: membershipEligibilityVersion, authorizeCharge: true, acceptTerms: true, acceptPrivacy: true, consentVersion: applicationConsentVersion };
  const submissions = await Promise.all([submitInvoiceApplication(account, input), submitInvoiceApplication(account, input)]);
  expect(submissions[0].applicationId).toBe(submissions[1].applicationId);
  const [row] = await database.select().from(schema.membershipRequests).where(eq(schema.membershipRequests.id, submissions[0].applicationId));
  return { row, input };
}

describe.skipIf(!enabled)("real Stripe Sandbox Dashboard / invoice journey", () => {
  beforeAll(async () => {
    if (!process.env.STRIPE_SECRET_KEY?.startsWith("sk_test_") || !process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY?.startsWith("pk_test_") || process.env.RAILWAY_PROJECT_ID !== "ea31f46e-5f06-4394-8580-22f343c28132") throw new Error("Sandbox account/mode guard failed");
    const account = await stripe.accounts.retrieve(null); evidence.stripeAccount = account.id;
    vi.stubEnv("GOOGLE_MAPS_SERVER_API_KEY", "");
    client = new PGlite();
    for (const file of readdirSync("drizzle").filter(file => file.endsWith(".sql")).sort()) await client.exec(readFileSync(`drizzle/${file}`, "utf8"));
    database = drizzle(client, { schema }); state.db = database as unknown as NonNullable<typeof state.db>;
    server = createServer(async (req, res) => {
      try {
        const chunks = []; for await (const chunk of req) chunks.push(chunk);
        const body = Buffer.concat(chunks).toString();
        if (!webhook) { res.writeHead(503); res.end(); return; }
        const event = JSON.parse(body);
        const response = await webhook(new Request("http://localhost/api/stripe/webhook", { method: "POST", body, headers: { "stripe-signature": String(req.headers["stripe-signature"] ?? "") } }));
        received.push({ id: event.id, type: event.type, objectId: event.data.object.id, status: response.status });
        res.writeHead(response.status); res.end(await response.text());
      } catch { res.writeHead(500); res.end("Webhook processing needs retry"); }
    });
    await new Promise<void>(resolve => server.listen(0, "127.0.0.1", resolve));
    const port = (server.address() as { port: number }).port;
    listener = spawn("stripe.exe", ["listen", "--skip-update", "--forward-to", `http://127.0.0.1:${port}`, "--events", "payment_intent.succeeded,payment_intent.payment_failed,payment_intent.requires_action,refund.created,refund.updated,refund.failed,invoice.finalized,invoice.paid,invoice.payment_succeeded,invoice.payment_failed,invoice.payment_action_required"], { windowsHide: true, env: { ...process.env, STRIPE_API_KEY: process.env.STRIPE_SECRET_KEY }, stdio: ["ignore", "pipe", "pipe"] });
    await new Promise<void>((resolve, reject) => {
      let buffer = "";
      const timer = setTimeout(() => reject(new Error("Stripe webhook listener did not become ready")), 50000);
      const read = (chunk: Buffer) => { buffer = (buffer + chunk.toString()).slice(-8000); const secret = buffer.match(/whsec_[a-zA-Z0-9]+/); if (secret) { process.env.STRIPE_WEBHOOK_SECRET = secret[0]; clearTimeout(timer); resolve(); } };
      listener.stdout!.on("data", read); listener.stderr!.on("data", read); listener.on("error", () => { clearTimeout(timer); reject(new Error("Stripe CLI unavailable")); });
    });
    webhook = (await import("@/app/api/stripe/webhook/route")).POST;
  }, 120000);
  afterAll(async () => {
    if (listener) listener.kill();
    if (server) await new Promise<void>(resolve => server.close(() => resolve()));
    if (client) await client.close();
    vi.unstubAllEnvs();
    evidence.webhooks = received; evidence.finishedAt = new Date().toISOString();
    mkdirSync(".next/verification", { recursive: true }); writeFileSync(".next/verification/invoice-sandbox.json", JSON.stringify(evidence, null, 2));
  });

  it("verifies/refunds multiple cards through real signed webhooks and rejects failed or foreign verification", async () => {
    const account = await fixture();
    const first = await verifiedCard(account, "pm_card_visa", true);
    const customer = await stripeCustomer(account.id);
    const second = await verifiedCard(account, "pm_card_mastercard");
    expect(second.intent.customer).toBe(first.intent.customer); expect(customer!.id).toBe(first.intent.customer);
    expect(await listCards(account.id)).toHaveLength(2);
    await changeCard(account.id, second.card.id, "default"); expect((await listCards(account.id)).find(card => card.isDefault)?.id).toBe(second.card.id);
    const other = await fixture();
    await expect(completeCardSetup(other.id, first.intent.id)).rejects.toThrow("not found");
    await expect(changeCard(other.id, first.card.id, "default")).rejects.toThrow();
    const failed = await addCardSetup(account.id, crypto.randomUUID());
    await expect(stripe.paymentIntents.confirm(failed.paymentIntentId, { payment_method: "pm_card_visa_chargeDeclined" })).rejects.toThrow();
    await expect(completeCardSetup(account.id, failed.paymentIntentId)).rejects.toThrow("has not succeeded");
    expect((await database.select().from(schema.cardVerifications).where(eq(schema.cardVerifications.paymentIntentId, failed.paymentIntentId)))[0].status).toBe("failed");
    expect(await listCards(account.id)).toHaveLength(2);
    expect(await database.select().from(schema.membershipRequests).where(eq(schema.membershipRequests.customerAccountId, account.id))).toHaveLength(0);
    (evidence.fixtures as unknown[]).push({ purpose: "verification", customer: customer!.id, payments: [first.intent.id, second.intent.id, failed.paymentIntentId] });
  }, 120000);

  it("creates one exact draft without charging, freezes the card, then activates once from actual invoice payment webhooks", async () => {
    const account = await fixture(); const first = await verifiedCard(account); const second = await verifiedCard(account, "pm_card_mastercard");
    await expect(prepareInvoiceApplication(account, { ...configuration, selectedServiceMonths: ["2027-02"] })).rejects.toThrow();
    const prepared = await prepareInvoiceApplication(account, configuration);
    expect(prepared.review.customer.fullName).toBe(account.fullName);
    expect(prepared.review.deliveryAddress?.province).toBe("Bangkok");
    const { row, input } = await application(account);
    expect(row).toMatchObject({ status: "pending_review", applicationState: "pending_review", stripeInvoiceStatus: "draft", stripePaymentIntentId: null, memberId: null, estimatedTotal: 18840 });
    const invoice = await stripe.invoices.retrieve(row.stripeInvoiceId!);
    expect(invoice).toMatchObject({ status: "draft", auto_advance: false, total: 1884000, currency: "thb", customer: first.intent.customer, default_payment_method: first.card.id, attempted: false });
    expect(invoice.lines.data.map(line => line.amount).sort((a, b) => a - b)).toEqual([384000, 1500000]);
    expect((await stripe.invoices.list({ customer: first.intent.customer as string })).data).toHaveLength(1);
    expect((await stripe.paymentIntents.list({ customer: first.intent.customer as string })).data.every(intent => intent.currency === "usd" && intent.amount === 200)).toBe(true);
    await changeCard(account.id, second.card.id, "default");
    expect((await stripe.invoices.retrieve(invoice.id)).default_payment_method).toBe(first.card.id);
    await expect(changeCard(account.id, first.card.id, "remove")).rejects.toThrow("unfinished");
    await expect(database.update(schema.membershipRequests).set({ applicationSnapshot: {} }).where(eq(schema.membershipRequests.id, row.id))).rejects.toThrow();
    const approved = await approveInvoiceApplication(row.id, "sandbox-staff");
    expect(approved.approvedAt).toBeTruthy(); expect((await stripe.invoices.retrieve(invoice.id)).status).toBe("draft");
    await approveInvoiceApplication(row.id, "sandbox-staff");
    // These are the same supported operations staff perform on this prepared invoice in Stripe Dashboard.
    await stripe.invoices.finalizeInvoice(invoice.id, { auto_advance: false });
    await stripe.invoices.pay(invoice.id, { payment_method: first.card.id, off_session: true });
    await eventually(async () => (await database.select().from(schema.membershipRequests).where(eq(schema.membershipRequests.id, row.id)))[0].status === "active");
    const active = (await database.select().from(schema.membershipRequests).where(eq(schema.membershipRequests.id, row.id)))[0];
    expect(active.invoiceStatus).toBe("paid"); expect(active.memberId).toMatch(/^SBF-M-\d+$/); expect(active.selectedServiceMonths).toEqual(configuration.selectedServiceMonths);
    expect(hasActiveMembership(active, new Date("2027-02-15T05:00:00Z"))).toBe(true); expect(hasActiveMembership(active, new Date("2027-03-15T05:00:00Z"))).toBe(false);
    expect((active.finalMembershipSnapshot as { purchase: { includedBenefit: { menuValue: number } } }).purchase.includedBenefit.menuValue).toBe(3000);
    await Promise.all([reconcileMembershipInvoice(invoice.id), reconcileMembershipInvoice(invoice.id), submitInvoiceApplication(account, input)]);
    expect((await database.select().from(schema.membershipRequests).where(eq(schema.membershipRequests.id, row.id)))[0].memberId).toBe(active.memberId);
    expect((await stripe.invoices.list({ customer: first.intent.customer as string })).data).toHaveLength(1);
    expect(received.some(event => event.objectId === invoice.id && event.type === "invoice.payment_succeeded" && event.status === 200)).toBe(true);
    await expect(prepareInvoiceApplication(account, configuration)).rejects.toThrow("already active or scheduled");
    (evidence.fixtures as unknown[]).push({ purpose: "approved-membership", customer: first.intent.customer, application: row.requestNumber, invoice: invoice.id, membershipPayment: active.stripePaymentIntentId, amountTHB: row.estimatedTotal, memberId: active.memberId });
  }, 180000);

  it("declines and deletes the draft without a membership charge; checks completeness and signature protection", async () => {
    const account = await fixture();
    const missing = await membershipAccountReview(account.id); expect(missing.requirements.filter(item => !item.complete).map(item => item.section)).toEqual(["payment-methods", "payment-methods"]);
    const incomplete = await prepareInvoiceApplication(account, configuration); expect(incomplete.applicationId).toBeNull();
    const verified = await verifiedCard(account); const { row } = await application(account);
    await declineInvoiceApplication(row.id, "sandbox-staff"); await declineInvoiceApplication(row.id, "sandbox-staff");
    await expect(stripe.invoices.retrieve(row.stripeInvoiceId!)).rejects.toThrow();
    expect((await database.select().from(schema.membershipRequests).where(eq(schema.membershipRequests.id, row.id)))[0]).toMatchObject({ applicationState: "declined", stripeInvoiceStatus: "deleted", memberId: null });
    expect((await stripe.paymentIntents.list({ customer: verified.intent.customer as string })).data).toHaveLength(1);
    expect((await webhook(new Request("http://localhost/api/stripe/webhook", { method: "POST", body: "{}", headers: { "stripe-signature": "invalid" } }))).status).toBe(400);
    (evidence.fixtures as unknown[]).push({ purpose: "declined", customer: verified.intent.customer, deletedInvoice: row.stripeInvoiceId });
  }, 120000);

  it("recovers interrupted invoice creation and refuses activation for failed or out-of-band payments", async () => {
    const account = await fixture(); const verified = await verifiedCard(account);
    const prepared = await prepareInvoiceApplication(account, configuration);
    const input = { applicationId: prepared.applicationId, quoteHash: prepared.quoteHash, reviewHash: prepared.reviewHash, paymentMethodId: verified.card.id, confirmInternationalVisitor: true, eligibilityVersion: membershipEligibilityVersion, authorizeCharge: true, acceptTerms: true, acceptPrivacy: true, consentVersion: applicationConsentVersion };
    await database.update(schema.customerAccounts).set({ fullName: "Updated Dashboard Name" }).where(eq(schema.customerAccounts.id, account.id));
    await expect(submitInvoiceApplication(account, input)).rejects.toThrow("Dashboard details changed");
    const refreshed = await prepareInvoiceApplication(account, configuration); input.reviewHash = refreshed.reviewHash;
    await expect(submitInvoiceApplication(account, { ...input, paymentMethodId: "pm_notowned" })).rejects.toThrow("belonging to your account");
    const interruption = vi.spyOn(stripe.invoiceItems, "create").mockRejectedValueOnce(new Error("Simulated lost connection after invoice creation"));
    try { await expect(submitInvoiceApplication(account, input)).rejects.toThrow("Simulated lost connection"); } finally { interruption.mockRestore(); }
    expect((await stripe.invoices.list({ customer: verified.intent.customer as string })).data).toHaveLength(1);
    await database.update(schema.customerAccounts).set({ fullName: "Changed after submitted agreement" }).where(eq(schema.customerAccounts.id, account.id));
    const resumed = await prepareInvoiceApplication(account, configuration);
    expect(resumed.applicationId).toBe(prepared.applicationId);
    expect(resumed.review.customer.fullName).toBe("Updated Dashboard Name");
    expect(resumed.review.cards[0].id).toBe(verified.card.id);
    await expect(changeCard(account.id, verified.card.id, "remove")).rejects.toThrow("unfinished");
    await submitInvoiceApplication(account, input);
    const [row] = await database.select().from(schema.membershipRequests).where(eq(schema.membershipRequests.id, prepared.applicationId!));
    expect((await stripe.invoices.list({ customer: verified.intent.customer as string })).data).toHaveLength(1);
    await approveInvoiceApplication(row.id, "sandbox-staff");
    await stripe.invoices.finalizeInvoice(row.stripeInvoiceId!, { auto_advance: false });
    // Deliberate fixture-only issuer failure; this card is never accepted into the verified Dashboard list.
    const declined = await stripe.paymentMethods.attach("pm_card_chargeCustomerFail", { customer: verified.intent.customer as string });
    await expect(stripe.invoices.pay(row.stripeInvoiceId!, { payment_method: declined.id })).rejects.toThrow();
    await eventually(async () => (await database.select().from(schema.membershipRequests).where(eq(schema.membershipRequests.id, row.id)))[0].status === "approved_payment_failed");
    expect((await listCards(account.id)).find(card => card.id === declined.id)?.verificationStatus).toBe("unverified");
    await stripe.invoices.pay(row.stripeInvoiceId!, { paid_out_of_band: true });
    expect(await reconcileMembershipInvoice(row.stripeInvoiceId!)).toMatchObject({ status: "approved_payment_failed", stripeInvoiceStatus: "paid", invoiceStatus: "awaiting_payment", memberId: null });
    expect((await database.select().from(schema.membershipRequests).where(eq(schema.membershipRequests.id, row.id)))[0].memberId).toBeNull();
    (evidence.fixtures as unknown[]).push({ purpose: "interruption-failure-out-of-band-guard", customer: verified.intent.customer, invoice: row.stripeInvoiceId });
  }, 150000);

  it("browser: preserves review through Dashboard card verification, then authenticates the same approved invoice", async () => {
    const account = await fixture();
    const { POST: accountApi } = await import("@/app/api/account/route");
    const { POST: applicationApi } = await import("@/app/api/membership/application/route");
    const { chromium } = await import("playwright");
    const bundle = await build({ entryPoints: ["scripts/invoice-browser-harness.tsx"], bundle: true, write: false, platform: "browser", jsx: "automatic", alias: { "next/navigation": path.resolve("scripts/account-browser-navigation.ts") }, define: { "process.env.NODE_ENV": '"production"', "process.env": "{}", global: "globalThis" } });
    const css = globSync(".next/static/chunks/*.css").map(file => readFileSync(file, "utf8")).join("\n");
    expect(css.length).toBeGreaterThan(1000);
    const browser = await chromium.launch({ executablePath: "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe", headless: true });
    const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
    page.setDefaultTimeout(30000);
    const origin = "http://localhost:3102";
    const quote = validateMembershipConfiguration(configuration); if (!quote.ok) throw new Error(quote.error);
    const props = { plan: membershipPlans[2], purchaseSnapshot: quote.purchaseSnapshot };
    const browserErrors: string[] = []; page.on("pageerror", error => browserErrors.push(error.message));
    const network: { path: string; status: number }[] = [];
    page.on("response", response => { const url = new URL(response.url()); if (url.hostname.includes("stripe") && (response.status() >= 400 || url.pathname.includes("3d_secure") || url.pathname.includes("authenticate"))) network.push({ path: `${url.hostname}${url.pathname}`, status: response.status() }); });
    async function challenge() {
      for (let i = 0; i < 100; i++) {
        for (const frame of page.frames()) {
          const control = frame.locator("#test-source-authorize-3ds");
          if (await control.count()) {
            await frame.waitForLoadState("load");
            await control.evaluate((button: HTMLButtonElement) => { if (!button.form) throw new Error("Missing Stripe test challenge form"); button.form.submit(); });
            return;
          }
        }
        await new Promise(resolve => setTimeout(resolve, 500));
      }
      throw new Error("Stripe authentication challenge did not appear");
    }
    try {
      await page.route(`${origin}/**`, async route => {
        const request = route.request();
        if (request.url().includes("/api/")) {
          const body = request.postData()!;
          expect(body).not.toContain("4000002760003184"); expect(body).not.toContain('"cvc"');
          const response = await (request.url().includes("/api/account") ? accountApi : applicationApi)(new Request(request.url(), { method: "POST", body, headers: { origin } }));
          await route.fulfill({ status: response.status, contentType: "application/json", body: await response.text() }); return;
        }
        await route.fulfill({ contentType: "text/html", body: `<html class="dark"><head><meta name="viewport" content="width=device-width,initial-scale=1"><style>${css}</style></head><body><div id="root"></div><script>${bundle.outputFiles[0].text}</script></body></html>` });
      });
      await page.goto(`${origin}/membership/checkout`);
      await page.evaluate(value => window.mountInvoiceReview(value), props);
      await page.getByRole("dialog").waitFor();
      for (const width of [1440, 768, 390]) { await page.setViewportSize({ width, height: 1000 }); expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true); await page.screenshot({ path: `.next/verification/invoice-completeness-${width}.png`, fullPage: true }); }
      await page.getByRole("link", { name: "COMPLETE MY ACCOUNT" }).click();
      await page.waitForURL(/dashboard\/payment-methods\?returnTo=membership/);
      await page.evaluate(value => window.mountInvoiceCards(value), { initial: [], publishableKey: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY! });
      await page.getByRole("link", { name: "Return to membership review" }).waitFor();
      await page.getByText("To verify your payment method, USD $2.00 will be charged to your card.", { exact: false }).waitFor();
      await page.getByRole("button", { name: "Add payment method" }).click();
      let frame = page.mainFrame();
      for (let i = 0; i < 60; i++) { const found = []; for (const child of page.frames()) if (await child.locator('input[name="number"]').count()) found.push(child); if (found[0]) { frame = found[0]; break; } await new Promise(resolve => setTimeout(resolve, 500)); }
      await eventually(async () => !await page.getByRole("button", { name: "Verify card · USD $2.00" }).isDisabled());
      await frame.locator('input[name="number"]').pressSequentially("4000002760003184", { delay: 100 });
      await frame.locator('input[name="number"]').press("Tab");
      await frame.locator('input[name="expiry"]').pressSequentially("1234", { delay: 100 });
      const postal = frame.locator('input[name="postalCode"]'); if (await postal.count()) await postal.fill("10330");
      await frame.locator('input[name="cvc"]').pressSequentially("123", { delay: 120 });
      await frame.locator('input[name="cvc"]').press("Tab");
      expect((await frame.locator('input[name="cvc"]').inputValue()).length).toBe(3);
      await page.getByRole("button", { name: "Verify card · USD $2.00" }).click(); await challenge();
      await page.getByText("VERIFIED", { exact: true }).waitFor({ timeout: 45000 });
      await page.getByText("USD $2 refund: REFUNDED", { exact: true }).waitFor();
      await page.screenshot({ path: ".next/verification/invoice-verified-card-mobile.png", fullPage: true });
      await page.getByRole("link", { name: "Return to membership review" }).click();
      await page.evaluate(value => window.mountInvoiceReview(value), props);
      await page.getByText("VERIFIED", { exact: true }).waitFor();
      expect(await page.getByRole("textbox").count()).toBe(0);
      for (const width of [1440, 768, 390]) { await page.setViewportSize({ width, height: 1000 }); expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true); await page.screenshot({ path: `.next/verification/invoice-review-${width}.png`, fullPage: true }); }
      for (const checkbox of await page.getByRole("checkbox").all()) await checkbox.check();
      await page.getByRole("button", { name: "SUBMIT MEMBERSHIP REQUEST" }).click();
      await page.waitForURL(/request-received/);
      const id = new URL(page.url()).searchParams.get("id")!;
      const [pending] = await database.select().from(schema.membershipRequests).where(eq(schema.membershipRequests.id, id));
      expect(pending).toMatchObject({ status: "pending_review", memberId: null, estimatedTotal: 18840, selectedServiceMonths: configuration.selectedServiceMonths });
      expect((pending.purchaseSnapshot as { products: { monthlyQuantity: number }[] }).products[0].monthlyQuantity).toBe(4);
      await approveInvoiceApplication(id, "sandbox-browser-staff");
      await stripe.invoices.finalizeInvoice(pending.stripeInvoiceId!, { auto_advance: false });
      await stripe.invoices.pay(pending.stripeInvoiceId!, { off_session: true }).catch(error => { if (error.type !== "StripeCardError") throw error; });
      await eventually(async () => (await database.select().from(schema.membershipRequests).where(eq(schema.membershipRequests.id, id)))[0].status === "approved_payment_action_required");
      const recovery = await invoiceRecovery(id, account.id); expect(recovery.clientSecret).toBeTruthy();
      expect((await database.select().from(schema.membershipRequests).where(eq(schema.membershipRequests.id, id)))[0].memberId).toBeNull();
      await page.evaluate(value => window.mountInvoiceAuth(value), { applicationId: id, initial: recovery, publishableKey: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY! });
      await page.getByRole("button", { name: "Authenticate saved card payment" }).click(); await challenge();
      await eventually(async () => (await database.select().from(schema.membershipRequests).where(eq(schema.membershipRequests.id, id)))[0].status === "active");
      expect((await stripe.paymentIntents.list({ customer: pending.stripeCustomerId! })).data).toHaveLength(2);
      expect(browserErrors).toEqual([]);
      (evidence.fixtures as unknown[]).push({ purpose: "browser-and-SCA", customer: pending.stripeCustomerId, invoice: pending.stripeInvoiceId });
    } catch (error) { await page.screenshot({ path: ".next/verification/invoice-browser-debug.png", fullPage: true }); console.log("Browser diagnostic", JSON.stringify({ network, frames: page.frames().map(frame => { try { const url = new URL(frame.url()); return `${url.hostname}${url.pathname}`; } catch { return "blank"; } }), errors: browserErrors })); throw error; }
    finally { await browser.close(); }
  }, 240000);
});
