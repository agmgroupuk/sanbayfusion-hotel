import { beforeEach, describe, expect, it, vi } from "vitest";

const state = vi.hoisted(() => ({
  rows: [] as Array<Array<Record<string, unknown>>>,
  inserts: [] as Array<Record<string, unknown>>,
  updates: [] as Array<Record<string, unknown>>,
  configuration: {} as Record<string, unknown>,
  createIntent: vi.fn(), retrieveIntent: vi.fn(), cancelIntent: vi.fn(),
}));
vi.mock("server-only", () => ({}));
vi.mock("@/lib/auth", () => ({ getCurrentAccount: async () => ({ id: "account-1", email: "test@example.invalid", fullName: "Test Member", stripeCustomerId: "cus_test" }) }));
vi.mock("@/lib/membership-checkout", () => ({ readMembershipCheckoutSelection: async () => ({ planSlug: state.configuration.planSlug, configuration: state.configuration }) }));
vi.mock("@/lib/stripe", () => ({ stripe: { customers: { create: vi.fn() }, paymentIntents: { create: state.createIntent, retrieve: state.retrieveIntent, cancel: state.cancelIntent, update: vi.fn() } } }));
vi.mock("@/lib/db", () => {
  const database = {
    execute: vi.fn(),
    select: () => {
      const result = state.rows.shift() ?? [];
      const query = { from: () => query, where: () => query, orderBy: () => query, limit: () => query, for: () => query, then: (resolve: (rows: Array<Record<string, unknown>>) => unknown) => Promise.resolve(result).then(resolve) };
      return query;
    },
    insert: () => ({ values: (value: Record<string, unknown>) => { state.inserts.push(value); return { returning: async () => [{ id: "new-term", ...value }] }; } }),
    update: () => ({ set: (value: Record<string, unknown>) => { state.updates.push(value); return { where: async () => undefined }; } }),
    transaction: async <T,>(callback: (tx: unknown) => Promise<T>) => callback(database),
  };
  return { db: database };
});

import { POST } from "@/app/api/membership/payment-intent/route";
import { hashPurchaseSnapshot } from "@/lib/membership-snapshot-hash";

const request = () => new Request("http://localhost/api/membership/payment-intent", { method: "POST", body: JSON.stringify({ customer: { fullName: "Test Member", phone: "0812345678" }, billingAddress: { line1: "123 Example Road", district: "Pathum Wan", subdistrict: "Lumphini", province: "Bangkok", postalCode: "10330", country: "Thailand" }, sameAsBilling: true }) });
const oldTerm = { id: "old-term", status: "expired", invoiceStatus: "paid", stripeCustomerId: "cus_test", stripePaymentIntentId: "pi_old", membershipExpiryDate: "2020-01-01", durationMonths: 12 };

beforeEach(() => {
  vi.unstubAllEnvs();
  vi.stubEnv("GOOGLE_MAPS_SERVER_API_KEY", "");
  state.inserts = []; state.updates = [];
  state.configuration = { planSlug: "3-month-membership", purchaseMode: "membership_only", foodPreferences: [], deliveryArea: "Bangkok", preferredDay: "Monday", preferredTime: "09:00–12:00", alcoholEnabled: false, selectedProducts: [], selectedAddOns: [] };
  state.rows = [[{ planId: "duration-3", amount: 1500000, currency: "thb", mode: "test" }], [{ stripeCustomerId: "cus_test" }], [] , []];
  state.createIntent.mockReset().mockResolvedValue({ id: "pi_new", client_secret: "test-client-secret" });
  state.retrieveIntent.mockReset(); state.cancelIntent.mockReset();
});

describe("membership checkout API", () => {
  it("creates membership-only payment with no dates or delivery allowance before approval", async () => {
    const response = await POST(request());
    expect(response.status).toBe(200);
    expect(state.createIntent.mock.calls[0][0]).toMatchObject({ amount: 1500000, currency: "thb" });
    expect(state.createIntent.mock.calls[0][0]).not.toHaveProperty("subscription");
    expect(state.inserts[0]).toMatchObject({ durationMonths: 3, deliveryDays: 0, annualDeliveryDays: 0, status: "payment_pending", membershipStartDate: null, membershipExpiryDate: null, memberId: null });
  });
  it("charges prepaid monthly quantities across the selected duration", async () => {
    state.configuration.purchaseMode = "membership_with_package";
    state.configuration.selectedProducts = [{ category: "Thai soups", name: "Tom Yum Goong", quantity: 4 }];
    const response = await POST(request());
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.amount).toBe(18840);
    expect(body.purchaseSnapshot.products[0]).toMatchObject({ unitPrice: 320, monthlyQuantity: 4, durationMonths: 3, totalTermQuantity: 12, lineTotal: 3840 });
    expect(state.createIntent.mock.calls[0][0].amount).toBe(1884000);
  });
  it("creates a new term after expiry without modifying the old paid snapshot", async () => {
    state.rows[2] = [oldTerm];
    const response = await POST(request());
    expect(response.status).toBe(200);
    expect(state.inserts).toHaveLength(1);
    expect(state.inserts[0]).toMatchObject({ planId: "duration-3", durationMonths: 3 });
    expect(state.retrieveIntent).not.toHaveBeenCalled();
    expect(oldTerm.stripePaymentIntentId).toBe("pi_old");
  });
  it("resolves stale active status before allowing a new purchase", async () => {
    state.rows[2] = [{ ...oldTerm, status: "active" }];
    expect((await POST(request())).status).toBe(200);
    expect(state.updates).toContainEqual({ status: "expired" });
    expect(state.inserts).toHaveLength(1);
  });
  it.each(["active", "payment_received"])("does not reprice a paid %s agreement", async status => {
    state.rows[2] = [{ ...oldTerm, status, membershipExpiryDate: "2099-01-01" }];
    expect((await POST(request())).status).toBe(409);
    expect(state.createIntent).not.toHaveBeenCalled();
    expect(state.inserts).toHaveLength(0);
    expect(state.updates).toHaveLength(0);
  });
  it("does not rewrite a draft whose payment succeeded before its webhook arrived", async () => {
    state.rows[2] = [{ ...oldTerm, status: "payment_pending", invoiceStatus: "awaiting_payment" }];
    state.retrieveIntent.mockResolvedValue({ status: "succeeded" });
    expect((await POST(request())).status).toBe(409);
    expect(state.updates).toHaveLength(0);
    expect(state.createIntent).not.toHaveBeenCalled();
  });
  it("hashes snapshots consistently after JSONB key reordering", () => {
    expect(hashPurchaseSnapshot({ b: 2, a: { z: 1, x: 0 } })).toBe(hashPurchaseSnapshot({ a: { x: 0, z: 1 }, b: 2 }));
  });
});
