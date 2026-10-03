import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { isPaymentPagePath, paymentUrl, platformTrustedHosts } from "./platform-hosts";

beforeEach(() => vi.stubEnv("NEXT_PUBLIC_PAYMENT_HOST_ENABLED", "false"));
afterEach(() => vi.unstubAllEnvs());

describe("single payment-host routing", () => {
  it("keeps main-domain fallback URLs until the pay host is enabled", () => {
    expect(paymentUrl("/dashboard/payment-methods")).toBe("/dashboard/payment-methods");
  });

  it("builds payment links on the dedicated payment host when enabled", () => {
    vi.stubEnv("NEXT_PUBLIC_PAYMENT_HOST_ENABLED", "true");
    expect(paymentUrl("/dashboard/payment-methods?returnTo=membership")).toBe("https://pay.sanbayfusion.com/dashboard/payment-methods?returnTo=membership");
  });

  it("rejects non-path destinations", () => {
    vi.stubEnv("NEXT_PUBLIC_PAYMENT_HOST_ENABLED", "true");
    expect(paymentUrl("//attacker.invalid")).toBe("/dashboard");
    expect(paymentUrl("https://attacker.invalid")).toBe("/dashboard");
  });

  it("recognizes only customer payment interfaces as payment-host pages", () => {
    expect(isPaymentPagePath("/membership/checkout")).toBe(true);
    expect(isPaymentPagePath("/dashboard/checkout")).toBe(true);
    expect(isPaymentPagePath("/dashboard/payment-methods")).toBe(true);
    expect(isPaymentPagePath("/membership/payment")).toBe(true);
    expect(isPaymentPagePath("/dashboard/orders")).toBe(false);
    expect(isPaymentPagePath("/dashboard/checkout-preview")).toBe(false);
  });

  it("trusts only the public website and payment host", () => {
    expect(platformTrustedHosts).toEqual(["sanbayfusion.com", "pay.sanbayfusion.com"]);
  });
});
