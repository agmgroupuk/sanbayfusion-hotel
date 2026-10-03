import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { isConfiguredPublicHost, paymentUrl, publicSiteUrl, sharedSessionCookie } from "./platform-hosts";

const railwayOrigin = "https://sanbayfusion-hotel-production.up.railway.app";

beforeEach(() => vi.stubEnv("NEXT_PUBLIC_SITE_URL", railwayOrigin));
afterEach(() => vi.unstubAllEnvs());

describe("single-origin production configuration", () => {
  it("uses the configured public origin for all payment interfaces", () => {
    expect(paymentUrl("/dashboard/payment-methods?returnTo=membership")).toBe("/dashboard/payment-methods?returnTo=membership");
    expect(paymentUrl("/membership/checkout")).toBe("/membership/checkout");
  });

  it("rejects external and malformed link destinations", () => {
    expect(paymentUrl("//attacker.invalid")).toBe("/dashboard");
    expect(paymentUrl("https://attacker.invalid")).toBe("/dashboard");
    expect(paymentUrl("/\\attacker.invalid")).toBe("/dashboard");
  });

  it("accepts only the configured host and keeps authentication cookies host-only", () => {
    expect(isConfiguredPublicHost("sanbayfusion-hotel-production.up.railway.app")).toBe(true);
    expect(isConfiguredPublicHost("pay.sanbayfusion.com")).toBe(false);
    expect(isConfiguredPublicHost("sanbayfusion.com")).toBe(false);
    expect(sharedSessionCookie).toBe("__Secure-sbf_platform_session");
  });

  it("requires an HTTPS production origin with no path or credentials", () => {
    expect(() => publicSiteUrl()).not.toThrow();
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "http://public.example");
    expect(() => publicSiteUrl()).toThrow("must use HTTPS");
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://user:pass@example.com/path");
    expect(() => publicSiteUrl()).toThrow("must be an origin");
  });
});
