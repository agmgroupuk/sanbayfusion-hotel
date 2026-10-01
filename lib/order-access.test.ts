import { beforeEach, describe, expect, it, vi } from "vitest";

const state = vi.hoisted(() => ({ membership: { id: "term-1", status: "active", membershipExpiryDate: "2026-11-10" }, createIntent: vi.fn(), expire: vi.fn(), insert: vi.fn() }));
vi.mock("server-only", () => ({}));
vi.mock("@/lib/auth", () => ({ getCurrentAccount: async () => ({ id: "account-1", email: "test@example.invalid" }) }));
vi.mock("@/lib/stripe", () => ({ stripe: { paymentIntents: { create: state.createIntent } } }));
vi.mock("@/lib/db", () => ({ db: {
  select: () => { const query = { from: () => query, where: () => query, orderBy: () => query, limit: async () => [state.membership] }; return query; },
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
      expect(state.expire).toHaveBeenCalledWith({ status: "expired" });
      expect(state.insert).not.toHaveBeenCalled();
      expect(state.createIntent).not.toHaveBeenCalled();
    } finally { vi.useRealTimers(); }
  });
});
