import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { proxy } from "../proxy";

beforeEach(() => vi.stubEnv("NEXT_PUBLIC_PAYMENT_HOST_ENABLED", "false"));
afterEach(() => vi.unstubAllEnvs());

function request(host: string, path: string) {
  return new NextRequest(`https://${host}${path}`, { headers: { host } });
}

describe("main and payment host routing", () => {
  it("keeps payment pages on the main host until the payment host is enabled", () => {
    const response = proxy(request("sanbayfusion.com", "/dashboard/checkout?order=123"));
    expect(response.headers.get("location")).toBeNull();
  });

  it("redirects payment pages from the main host to the same path on pay", () => {
    vi.stubEnv("NEXT_PUBLIC_PAYMENT_HOST_ENABLED", "true");
    const response = proxy(request("sanbayfusion.com", "/dashboard/checkout?order=123"));
    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe("https://pay.sanbayfusion.com/dashboard/checkout?order=123");
  });

  it("sends normal dashboard pages entered on pay back to the main website", () => {
    const response = proxy(request("pay.sanbayfusion.com", "/dashboard/orders?page=2"));
    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe("https://sanbayfusion.com/dashboard/orders?page=2");
  });

  it("keeps payment pages on pay and gives its root a payment-method entry", () => {
    const paymentPage = proxy(request("pay.sanbayfusion.com", "/membership/payment?id=123"));
    expect(paymentPage.headers.get("location")).toBeNull();
    const root = proxy(request("pay.sanbayfusion.com", "/"));
    expect(root.headers.get("location")).toBe("https://pay.sanbayfusion.com/dashboard/payment-methods");
  });
});
