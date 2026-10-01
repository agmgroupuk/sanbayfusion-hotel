import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { PGlite } from "@electric-sql/pglite";
import { drizzle } from "drizzle-orm/pglite";
import { eq } from "drizzle-orm";
import { readFileSync, readdirSync } from "node:fs";
import * as schema from "@/lib/db/schema";
import type { CustomerAccount } from "@/lib/db/schema";

const state = vi.hoisted(() => ({ db: null as typeof import("@/lib/db").db, account: null as CustomerAccount | null, payments: { customers: { create: vi.fn(), retrieve: vi.fn(), update: vi.fn() }, setupIntents: { create: vi.fn(), retrieve: vi.fn() }, paymentMethods: { retrieve: vi.fn() }, paymentIntents: { create: vi.fn(), retrieve: vi.fn(), confirm: vi.fn() } } }));
vi.mock("server-only", () => ({}));
vi.mock("@/lib/db", () => ({ get db() { return state.db; } }));
vi.mock("@/lib/stripe", () => ({ stripe: state.payments }));
vi.mock("@/lib/auth", () => ({ getCurrentAccount: async () => state.account, normalizeEmail: (value: string) => value.trim().toLowerCase() }));
vi.mock("@/lib/email/membership-request", () => ({ sendMembershipPaymentReviewEmail: vi.fn() }));
vi.mock("@/lib/membership-checkout", () => ({ saveMembershipCheckoutSelection: vi.fn() }));
import { prepareApplication, submitApplication, approveApplication, getApplicationForAccount } from "@/lib/membership-application";
import { activateMembershipRequest } from "@/lib/membership-activation";
import { redeemMemberBenefit } from "@/lib/membership-benefits";
import { POST as benefitApi } from "@/app/api/membership/benefits/route";
import { POST as selectionApi } from "@/app/api/membership/checkout-selection/route";
import { applicationConsentVersion } from "@/lib/membership-application-types";
import { membershipPlans, membershipPreferredTimes } from "@/lib/membership-plans";
import { calculateMembershipQuote } from "@/lib/membership-request";
import { serviceMonthBounds } from "@/lib/membership-service-months";

let client: PGlite;
let database: ReturnType<typeof drizzle<typeof schema>>;
let account: CustomerAccount;
let setup: Record<string, unknown>;
let intent: Record<string, unknown>;
const configuration = { planSlug: "3-month-membership", selectedServiceMonths: ["2027-02", "2027-07", "2027-11"], purchaseMode: "membership_with_package" as const, foodPreferences: [], deliveryArea: "Bangkok" as const, preferredDay: "Monday" as const, preferredTime: membershipPreferredTimes[0], alcoholEnabled: false, selectedProducts: [{ category: "Thai soups", name: "Tom Yum Goong", quantity: 4 }], selectedAddOns: [] };
const details = { customer: { fullName: "Calendar Test", phone: "+66812345678" }, billingAddress: { country: "GB", line1: "10 Test Street", line2: "", city: "London", state: "", postalCode: "SW1A 1AA" }, deliveryAddress: { country: "Thailand", line1: "999 Rama I Road", line2: "", subdistrict: "Pathum Wan", district: "Pathum Wan", province: "Bangkok", postalCode: "10330" } };

async function member(overrides: Partial<typeof schema.membershipRequests.$inferInsert> = {}) {
  const purchase = calculateMembershipQuote(configuration, membershipPlans[2]).purchaseSnapshot;
  const bounds = serviceMonthBounds(configuration.selectedServiceMonths);
  const [row] = await database.insert(schema.membershipRequests).values({ customerAccountId: account.id, requestNumber: crypto.randomUUID().slice(0, 24), planId: membershipPlans[2].id, planName: membershipPlans[2].name, planSnapshot: {}, annualFee: 15000, estimatedTotal: 18840, durationMonths: 3, deliveryDays: 0, annualDeliveryDays: 0, fullName: details.customer.fullName, email: account.email, phone: details.customer.phone, address: {}, contactPreferences: {}, configuration, selectedServiceMonths: configuration.selectedServiceMonths, purchaseSnapshot: purchase, status: "active", invoiceStatus: "paid", membershipStartDate: bounds.startDate, membershipExpiryDate: bounds.expiryDate, ...overrides }).returning();
  return row;
}
async function submitted() {
  const prepared = await prepareApplication(account, configuration, details);
  const input = { applicationId: prepared.applicationId, quoteHash: prepared.quoteHash, authorizeCharge: true, acceptTerms: true, acceptPrivacy: true, consentVersion: applicationConsentVersion };
  await submitApplication(account, input);
  return { prepared, input };
}

describe("membership calendar database enforcement (isolated Postgres engine, simulated Stripe)", () => {
  beforeAll(async () => {
    client = new PGlite();
    for (const file of readdirSync("drizzle").filter(file => file.endsWith(".sql")).sort()) await client.exec(readFileSync(`drizzle/${file}`, "utf8"));
    database = drizzle(client, { schema });
    state.db = database as unknown as NonNullable<typeof state.db>;
  }, 60000);
  beforeEach(async () => {
    await client.exec("TRUNCATE membership_benefit_redemptions, membership_requests, customer_accounts CASCADE");
    vi.clearAllMocks(); vi.useFakeTimers({ toFake: ["Date"] }); vi.setSystemTime(new Date("2026-10-02T12:00:00+07:00"));
    vi.stubEnv("GOOGLE_MAPS_SERVER_API_KEY", "");
    [account] = await database.insert(schema.customerAccounts).values({ email: "calendar@example.invalid", passwordHash: "TEST_ONLY" }).returning();
    state.account = account;
    state.payments.customers.create.mockResolvedValue({ id: "cus_calendar", livemode: false });
    state.payments.customers.retrieve.mockResolvedValue({ id: "cus_calendar", livemode: false });
    state.payments.customers.update.mockResolvedValue({ id: "cus_calendar", livemode: false });
    state.payments.setupIntents.create.mockImplementation(async values => (setup = { ...values, id: "seti_calendar", status: "succeeded", payment_method: "pm_calendar", livemode: false, client_secret: "test_setup_secret" }));
    state.payments.setupIntents.retrieve.mockImplementation(async () => setup);
    state.payments.paymentMethods.retrieve.mockResolvedValue({ id: "pm_calendar", customer: "cus_calendar", livemode: false, card: { brand: "visa", last4: "4242", exp_month: 12, exp_year: 2030 } });
    state.payments.paymentIntents.create.mockImplementation(async values => (intent = { ...values, id: "pi_calendar", status: "requires_confirmation", livemode: false }));
    state.payments.paymentIntents.retrieve.mockImplementation(async () => intent);
    state.payments.paymentIntents.confirm.mockImplementation(async () => (intent = { ...intent, status: "succeeded", amount_received: intent.amount }));
  });
  afterAll(async () => { vi.useRealTimers(); vi.unstubAllEnvs(); if (client) await client.close(); });

  it("reuses a draft for concurrent clicks and submits exactly once without charging", async () => {
    const drafts = await Promise.all([prepareApplication(account, configuration, details), prepareApplication(account, configuration, details)]);
    expect(drafts[0].applicationId).toBe(drafts[1].applicationId);
    expect(state.payments.customers.create).toHaveBeenCalledTimes(1);
    const input = { applicationId: drafts[0].applicationId, quoteHash: drafts[0].quoteHash, authorizeCharge: true, acceptTerms: true, acceptPrivacy: true, consentVersion: applicationConsentVersion };
    await Promise.all([submitApplication(account, input), submitApplication(account, input)]);
    expect(await database.select().from(schema.membershipRequests)).toHaveLength(1);
    expect(state.payments.paymentIntents.create).not.toHaveBeenCalled();
  });
  it("finds an older ongoing membership even behind a newer declined record", async () => {
    await member({ createdAt: new Date("2026-09-01") });
    await member({ status: "declined", createdAt: new Date("2026-10-01") });
    await expect(prepareApplication(account, configuration, details)).rejects.toThrow("already active or scheduled");
    expect(state.payments.customers.create).not.toHaveBeenCalled();
    const response = await selectionApi(new Request("http://localhost/api/membership/checkout-selection", { method: "POST", body: JSON.stringify({ planSlug: configuration.planSlug, configuration }) }));
    expect(response.status).toBe(409);
    expect(await response.json()).toMatchObject({ code: "ACTIVE_MEMBERSHIP" });
  });
  it("does not use a different account's matching email as ownership", async () => {
    const [other] = await database.insert(schema.customerAccounts).values({ email: "other@example.invalid", passwordHash: "TEST_ONLY" }).returning();
    await member({ customerAccountId: other.id, email: account.email });
    const draft = await prepareApplication(account, configuration, details);
    expect((await getApplicationForAccount(draft.applicationId, account.id)).customerAccountId).toBe(account.id);
    await expect(getApplicationForAccount(draft.applicationId, other.id)).rejects.toThrow("not found");
  });
  it("blocks a previously open draft at submission if another membership became active", async () => {
    const draft = await prepareApplication(account, configuration, details);
    await member();
    await expect(submitApplication(account, { applicationId: draft.applicationId, quoteHash: draft.quoteHash, authorizeCharge: true, acceptTerms: true, acceptPrivacy: true, consentVersion: applicationConsentVersion })).rejects.toThrow("already active or scheduled");
  });
  it("blocks approval and activation if a separate membership became active", async () => {
    const { prepared } = await submitted();
    await member();
    await expect(approveApplication(prepared.applicationId, "test-admin")).rejects.toThrow("already active or scheduled");
    expect(state.payments.paymentIntents.create).not.toHaveBeenCalled();
    const paid = await member({ status: "payment_received" });
    await expect(activateMembershipRequest({ id: paid.id, actor: "test-admin" })).rejects.toThrow("already active or scheduled");
  });
  it("also serializes historical activation through the existing Stripe owner mapping", async () => {
    await database.update(schema.customerAccounts).set({ stripeCustomerId: "cus_calendar" }).where(eq(schema.customerAccounts.id, account.id));
    await member();
    const paid = await member({ customerAccountId: null, stripeCustomerId: "cus_calendar", status: "payment_received", selectedServiceMonths: null, purchaseSnapshot: { version: 3 } });
    await expect(activateMembershipRequest({ id: paid.id, actor: "test-admin" })).rejects.toThrow("already active or scheduled");
  });
  it("approves the saved months and exact price once; SQL prevents later month edits", async () => {
    const { prepared } = await submitted();
    const active = await approveApplication(prepared.applicationId, "test-admin");
    expect(active).toMatchObject({ status: "active", invoiceStatus: "paid", selectedServiceMonths: configuration.selectedServiceMonths, membershipStartDate: "2027-02-01", membershipExpiryDate: "2027-12-01", estimatedTotal: 18840 });
    expect(intent.amount).toBe(1884000);
    const again = await approveApplication(prepared.applicationId, "test-admin");
    expect(again.memberId).toBe(active.memberId);
    expect(state.payments.paymentIntents.create).toHaveBeenCalledTimes(1);
    await expect(database.update(schema.membershipRequests).set({ selectedServiceMonths: ["2027-02", "2027-03", "2027-04"] }).where(eq(schema.membershipRequests.id, active.id))).rejects.toThrow();
  });
  it("rejects stale months before submission and before any approval charge", async () => {
    const draft = await prepareApplication(account, configuration, details);
    vi.setSystemTime(new Date("2027-03-01T12:00:00+07:00"));
    await expect(submitApplication(account, { applicationId: draft.applicationId, quoteHash: draft.quoteHash, authorizeCharge: true, acceptTerms: true, acceptPrivacy: true, consentVersion: applicationConsentVersion })).rejects.toThrow("no longer eligible");
    vi.setSystemTime(new Date("2026-10-02T12:00:00+07:00"));
    const { prepared } = await submitted();
    vi.setSystemTime(new Date("2027-03-01T12:00:00+07:00"));
    await expect(approveApplication(prepared.applicationId, "test-admin")).rejects.toThrow("no longer eligible");
    expect(state.payments.paymentIntents.create).not.toHaveBeenCalled();
  });
  it("redeems once for the current selected month, at zero charge, including concurrent requests", async () => {
    const row = await member();
    vi.setSystemTime(new Date("2027-02-05T12:00:00+07:00"));
    const request = { membershipId: row.id, serviceMonth: "2027-02", scheduledDate: "2027-02-10" };
    const result = await Promise.allSettled([redeemMemberBenefit(account, request), redeemMemberBenefit(account, request)]);
    expect(result.filter(value => value.status === "fulfilled")).toHaveLength(1);
    expect(result.find(value => value.status === "fulfilled")).toMatchObject({ value: { chargedAmount: 0 } });
    const rows = await database.select().from(schema.membershipBenefitRedemptions);
    expect(rows).toHaveLength(1); expect(rows[0]).toMatchObject({ mealName: "Premium Member Meal", menuValue: 3000 });
    expect(await database.select().from(schema.customerOrders)).toHaveLength(0);
    expect(state.payments.paymentIntents.create).not.toHaveBeenCalled();
    await expect(database.insert(schema.membershipBenefitRedemptions).values({ membershipRequestId: row.id, serviceMonth: "2027-02", scheduledDate: "2027-02-15", mealName: "Forged duplicate", menuValue: 3000 })).rejects.toThrow();
  });
  it("denies redemption for another owner, gaps, future months, expired months and insufficient notice", async () => {
    const row = await member();
    const input = { membershipId: row.id, serviceMonth: "2027-02", scheduledDate: "2027-02-10" };
    vi.setSystemTime(new Date("2027-02-05T12:00:00+07:00"));
    await expect(redeemMemberBenefit({ ...account, id: crypto.randomUUID() }, input)).rejects.toThrow("not found");
    await expect(redeemMemberBenefit(account, { ...input, serviceMonth: "2027-07", scheduledDate: "2027-07-10" })).rejects.toThrow("only available");
    await expect(redeemMemberBenefit(account, { ...input, scheduledDate: "2027-02-06" })).rejects.toThrow("three days");
    await expect(redeemMemberBenefit(account, { ...input, amount: 0, menuValue: 100000 })).rejects.toThrow("valid benefit");
    vi.setSystemTime(new Date("2027-03-05T12:00:00+07:00"));
    await expect(redeemMemberBenefit(account, input)).rejects.toThrow("approved, paid");
    vi.setSystemTime(new Date("2027-12-05T12:00:00+07:00"));
    await expect(redeemMemberBenefit(account, input)).rejects.toThrow("approved, paid");
  });
  it("enforces authentication and origin on the benefit API", async () => {
    state.account = null;
    expect((await benefitApi(new Request("http://localhost/api/membership/benefits", { method: "POST", body: "{}" }))).status).toBe(401);
    state.account = account;
    expect((await benefitApi(new Request("http://localhost/api/membership/benefits", { method: "POST", headers: { origin: "https://other.invalid" }, body: "{}" }))).status).toBe(403);
  });
  it("allows purchase after expiry without changing historical paid agreements", async () => {
    const legacy = await member({ selectedServiceMonths: null, purchaseSnapshot: { version: 3 }, membershipStartDate: "2026-01-01", membershipExpiryDate: "2026-04-01" });
    await prepareApplication(account, configuration, details);
    const [same] = await database.select().from(schema.membershipRequests).where(eq(schema.membershipRequests.id, legacy.id));
    expect(same).toEqual(legacy);
  });
});
