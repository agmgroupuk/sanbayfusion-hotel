import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { PGlite } from "@electric-sql/pglite";
import { drizzle } from "drizzle-orm/pglite";
import { readFileSync, readdirSync } from "node:fs";
import * as schema from "./db/schema";
import type Stripe from "stripe";
const state = vi.hoisted(() => ({ db: null as typeof import("./db").db, account: null as schema.CustomerAccount | null, create: vi.fn(), retrieve: vi.fn() }));
vi.mock("server-only", () => ({}));
vi.mock("@/lib/db", () => ({ get db() { return state.db; } }));
vi.mock("@/lib/stripe", () => ({ stripe: { paymentIntents: { create: state.create, retrieve: state.retrieve } } }));
vi.mock("@/lib/auth", () => ({ getCurrentAccount: async () => state.account, normalizeEmail: (value: string) => value.trim().toLowerCase() }));
vi.mock("@/lib/email/membership-request", () => ({ sendMembershipPaymentReviewEmail: vi.fn() }));
import { membershipPlans, membershipPreferredTimes } from "./membership-plans";
import { calculateMembershipQuote } from "./membership-request";
import { calendarMonths, serviceMonthBounds } from "./membership-service-months";
import { activateMembershipRequest } from "./membership-activation";
import { redeemMemberBenefit, benefitRedemptionsForAccount } from "./membership-benefits";
import { createStandardMealOrder } from "./standard-meal-order";
import { recordOrderPayment } from "./order-payment";
import { POST as orderApi } from "@/app/api/orders/payment-intent/route";
let client: PGlite;
let database: ReturnType<typeof drizzle<typeof schema>>;
let account: schema.CustomerAccount;
const cart = (quantity: number) => [{ category: "Thai soups", name: "Tom Yum Goong", quantity }];
const intents = new Map<string, Stripe.PaymentIntent>();
async function membership(count = 1, scheduled = false) {
  const plan = membershipPlans[count - 1], selectedServiceMonths = calendarMonths(2027).slice(0, count);
  const configuration = { planSlug: plan.slug, selectedServiceMonths, purchaseMode: "membership_only" as const, foodPreferences: [], deliveryArea: "Bangkok" as const, preferredDay: "Monday" as const, preferredTime: membershipPreferredTimes[0], selectedProducts: [], standardMealSlots: scheduled ? [{ serviceMonth: "2027-01", deliveryDate: "2027-01-15", deliveryTime: "19:30" }] : [] };
  const purchase = calculateMembershipQuote(configuration, plan).purchaseSnapshot;
  const bounds = serviceMonthBounds(selectedServiceMonths);
  const [row] = await database.insert(schema.membershipRequests).values({ customerAccountId: account.id, requestNumber: `MEAL-${crypto.randomUUID().slice(0, 20)}`, planId: plan.id, planName: plan.name, planSnapshot: purchase.plan, annualFee: plan.price, estimatedTotal: plan.price, durationMonths: count, deliveryDays: 0, annualDeliveryDays: 0, fullName: "Meal Customer", email: account.email, phone: "+66812345678", address: {}, contactPreferences: {}, configuration, selectedServiceMonths, purchaseSnapshot: purchase, status: "payment_received", invoiceStatus: "paid", membershipStartDate: bounds.startDate, membershipExpiryDate: bounds.expiryDate }).returning();
  await activateMembershipRequest({ id: row.id, actor: "verified-payment-test" });
  return row;
}
async function scheduledMeal() {
  const row = await membership();
  await redeemMemberBenefit(account, { membershipId: row.id, serviceMonth: "2027-01", scheduledDate: "2027-01-15", scheduledTime: "19:30" });
  return { membershipId: row.id, serviceMonth: "2027-01" };
}
beforeAll(async () => {
  client = new PGlite();
  for (const file of readdirSync("drizzle").filter(file => file.endsWith(".sql")).sort()) await client.exec(readFileSync(`drizzle/${file}`, "utf8"));
  database = drizzle(client, { schema }); state.db = database as unknown as NonNullable<typeof state.db>;
}, 60000);
beforeEach(async () => {
  vi.useFakeTimers({ toFake: ["Date"] }); vi.setSystemTime(new Date("2027-01-05T12:00:00+07:00"));
  await client.exec("TRUNCATE customer_accounts CASCADE");
  [account] = await database.insert(schema.customerAccounts).values({ email: "meal@example.invalid", passwordHash: "TEST_ONLY" }).returning(); state.account = account;
  intents.clear(); vi.clearAllMocks();
  state.create.mockImplementation(async (params, options) => {
    const key = options?.idempotencyKey ?? crypto.randomUUID();
    if (!intents.has(key)) intents.set(key, { ...params, id: `pi_${crypto.randomUUID().replaceAll("-", "")}`, status: "requires_payment_method", livemode: false, client_secret: "test_secret" } as Stripe.PaymentIntent);
    return intents.get(key);
  });
  state.retrieve.mockImplementation(async id => [...intents.values()].find(intent => intent.id === id));
});
afterEach(() => vi.useRealTimers());
afterAll(async () => { await client.close(); });

describe("Standard Meal entitlement and order enforcement", () => {
  it.each([1, 12])("creates exactly %i unused entitlements on paid activation, idempotently", async count => {
    const row = await membership(count);
    await activateMembershipRequest({ id: row.id, actor: "duplicate-event" });
    const benefits = await benefitRedemptionsForAccount(account);
    expect(benefits).toHaveLength(count);
    expect(benefits.every(item => item.status === "available" && item.redeemedAt === null && item.orderId === null && item.menuValue === membershipPlans[count - 1].includedBenefit.menuValue)).toBe(true);
  });
  it("retains configuration schedules on activation and permits future scheduling without redemption", async () => {
    const row = await membership(12, true);
    await redeemMemberBenefit(account, { membershipId: row.id, serviceMonth: "2027-07", scheduledDate: "2027-07-14", scheduledTime: "24:00" });
    const benefits = await benefitRedemptionsForAccount(account);
    expect(benefits.find(item => item.serviceMonth === "2027-01")).toMatchObject({ scheduledTime: "19:30", status: "scheduled", redeemedAt: null });
    expect(benefits.find(item => item.serviceMonth === "2027-07")).toMatchObject({ scheduledTime: "24:00", status: "scheduled", redeemedAt: null });
  });
  it("confirms a meal under the allowance without Stripe, consumes it once, and charges extra orders normally", async () => {
    const meal = await scheduledMeal();
    const results = await Promise.all([createStandardMealOrder(account, meal, cart(8)), createStandardMealOrder(account, meal, cart(8))]);
    expect(results[0]).toMatchObject({ confirmed: true, total: 0 });
    expect(results[0].orderNumber).toBe(results[1].orderNumber);
    expect(await database.select().from(schema.customerOrders)).toHaveLength(1);
    expect(state.create).not.toHaveBeenCalled();
    expect((await benefitRedemptionsForAccount(account))[0]).toMatchObject({ status: "redeemed", redeemedAt: expect.any(Date), orderId: expect.any(String) });
    await expect(createStandardMealOrder(account, meal, cart(9))).rejects.toThrow("another order");
    const extra = await orderApi(new Request("http://localhost/api/orders/payment-intent", { method: "POST", body: JSON.stringify({ cart: cart(8) }) }));
    expect(extra.status).toBe(400); // Additional orders require a schedule, saved address and verified card.
    expect(state.create).not.toHaveBeenCalled();
  });
  it("reserves once across concurrent excess payments, then redeems only after verified payment", async () => {
    const meal = await scheduledMeal();
    const results = await Promise.all([createStandardMealOrder(account, meal, cart(12)), createStandardMealOrder(account, meal, cart(12))]);
    expect(results[0]).toMatchObject({ total: 840 }); expect(results[0].orderNumber).toBe(results[1].orderNumber);
    expect(intents.size).toBe(1);
    expect((await benefitRedemptionsForAccount(account))[0]).toMatchObject({ status: "reserved", redeemedAt: null });
    const intent = [...intents.values()][0];
    expect(intent.amount).toBe(84000);
    expect(await recordOrderPayment({ ...intent, status: "succeeded", amount: 1 } as Stripe.PaymentIntent)).toBeNull();
    expect((await benefitRedemptionsForAccount(account))[0].status).toBe("reserved");
    const paid = { ...intent, status: "succeeded", amount_received: intent.amount } as Stripe.PaymentIntent;
    await recordOrderPayment(paid); await recordOrderPayment(paid);
    expect((await benefitRedemptionsForAccount(account))[0]).toMatchObject({ status: "redeemed", redeemedAt: expect.any(Date) });
    expect(await database.select().from(schema.customerOrders)).toHaveLength(1);
  });
  it("rejects another owner, non-food, future redemption and fake totals without creating payments", async () => {
    const meal = await scheduledMeal();
    await expect(createStandardMealOrder({ ...account, id: crypto.randomUUID() }, meal, cart(1))).rejects.toThrow("not found");
    await expect(createStandardMealOrder(account, { ...meal, serviceMonth: "2027-02" }, cart(1))).rejects.toThrow("selected service month");
    await expect(createStandardMealOrder(account, meal, cart(12), "", 0)).rejects.toThrow("price changed");
    await expect(createStandardMealOrder(account, meal, [{ category: "Beer", name: "Forged", quantity: 1 }])).rejects.toThrow();
    expect(state.create).not.toHaveBeenCalled();
    expect(await database.select().from(schema.customerOrders)).toHaveLength(0);
  });
  it("keeps a reserved order recoverable after a Stripe outage without reserving another benefit", async () => {
    const meal = await scheduledMeal();
    state.create.mockRejectedValueOnce(new Error("temporary outage"));
    await expect(createStandardMealOrder(account, meal, cart(12))).rejects.toThrow("outage");
    const retry = await createStandardMealOrder(account, meal, cart(12));
    expect(retry.total).toBe(840);
    expect(await database.select().from(schema.customerOrders)).toHaveLength(1);
    expect((await benefitRedemptionsForAccount(account))[0].status).toBe("reserved");
  });
});
