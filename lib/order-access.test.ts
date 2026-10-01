import { beforeEach, describe, expect, it, vi } from "vitest";

const state = vi.hoisted(() => ({ membership: { id: "term-1", status: "active", membershipExpiryDate: "2026-11-10" } as { id: string; status: string; membershipExpiryDate: string; invoiceStatus?: string; selectedServiceMonths?: string[]; durationMonths?: number }, createIntent: vi.fn(), expire: vi.fn(), insert: vi.fn() }));
vi.mock("server-only", () => ({}));
vi.mock("@/lib/auth", () => ({ getCurrentAccount: async () => ({ id: "account-1", email: "test@example.invalid" }) }));
vi.mock("@/lib/stripe", () => ({ stripe: { paymentIntents: { create: state.createIntent } } }));
vi.mock("@/lib/db", () => ({ db: {
  select: () => { const query = { from: () => query, where: () => query, orderBy: async () => [state.membership] }; return query; },
  update: () => ({ set: (value: unknown) => ({ where: async () => state.expire(value) }) }), insert: state.insert,
} }));
import { POST } from "@/app/api/orders/payment-intent/route";

beforeEach(() => { vi.useRealTimers(); state.createIntent.mockReset(); state.expire.mockReset(); state.insert.mockReset(); });
describe("server-side order access", () => {
  it("rejects stale active memberships at the expiry boundary before creating any order or payment", async () => {
    vi.useFakeTimers(); vi.setSystemTime(new Date("2026-11-09T17:00:00Z"));
    try {
      const response = await POST(new Request("http://localhost/api/orders/payment-intent", { method: "POST", body: JSON.stringify({ cart: [{ category: "Thai soups", name: "Tom Yum Goong", quantity: 1 }] }) }));
      expect(response.status).toBe(403);
      expect(state.insert).not.toHaveBeenCalled();
      expect(state.createIntent).not.toHaveBeenCalled();
    } finally { vi.useRealTimers(); }
  });
  it("rejects extra-order creation in the gap between selected service months", async () => {
    state.membership = { id: "calendar-1", status: "active", invoiceStatus: "paid", membershipExpiryDate: "2027-12-01", durationMonths: 3, selectedServiceMonths: ["2027-02", "2027-07", "2027-11"] };
    vi.useFakeTimers(); vi.setSystemTime(new Date("2027-03-15T12:00:00+07:00"));
    try {
      const response = await POST(new Request("http://localhost/api/orders/payment-intent", { method: "POST", body: JSON.stringify({ cart: [{ category: "Thai soups", name: "Tom Yum Goong", quantity: 1 }] }) }));
      expect(response.status).toBe(403);
      expect(state.insert).not.toHaveBeenCalled(); expect(state.createIntent).not.toHaveBeenCalled();
    } finally { vi.useRealTimers(); }
  });
});
