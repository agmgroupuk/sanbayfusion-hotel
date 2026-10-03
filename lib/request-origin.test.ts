import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { hasValidRequestOrigin, trustedPublicOrigins } from "./request-origin";
import { getSafeRedirectPath } from "./auth-redirect";

const productionOrigin = "https://sanbayfusion-hotel-production.up.railway.app";

beforeEach(() => {
  vi.stubEnv("NODE_ENV", "production");
  vi.stubEnv("NEXT_PUBLIC_SITE_URL", productionOrigin);
  vi.stubEnv("RAILWAY_PUBLIC_DOMAIN", "pay.sanbayfusion.com");
});
afterEach(() => vi.unstubAllEnvs());
const request = (origin: string, headers: Record<string, string> = {}) => new Request("http://0.0.0.0:8080/api/membership/checkout-selection", { headers: { origin, ...headers } });

describe("public origin validation behind Railway", () => {
  it("accepts only the configured Railway production origin", () => {
    expect(hasValidRequestOrigin(request(productionOrigin))).toBe(true);
    expect(trustedPublicOrigins()).toEqual([productionOrigin]);
  });
  it.each([
    "https://attacker.invalid",
    "null",
    "https://sanbayfusion.com",
    "https://pay.sanbayfusion.com",
    "https://sanbayfusion-hotel-production.up.railway.app.attacker.invalid",
    "https://other.up.railway.app",
    "http://sanbayfusion-hotel-production.up.railway.app",
    "https://sanbayfusion-hotel-production.up.railway.app/",
    "http://0.0.0.0:8080",
  ])("rejects %s even with forged proxy headers", origin => {
    expect(hasValidRequestOrigin(request(origin, { host: "attacker.invalid", "x-forwarded-host": "attacker.invalid", "x-forwarded-proto": "https" }))).toBe(false);
  });
  it("does not trust Railway's stale custom-domain variable over explicit configuration", () => {
    vi.stubEnv("RAILWAY_PUBLIC_DOMAIN", "sanbayfusion.com@attacker.invalid");
    expect(trustedPublicOrigins()).toEqual([productionOrigin]);
  });
  it("rejects browser cross-site requests including ones without Origin", () => {
    expect(hasValidRequestOrigin(request(productionOrigin, { "sec-fetch-site": "cross-site" }))).toBe(false);
    expect(hasValidRequestOrigin(new Request(productionOrigin, { headers: { "sec-fetch-site": "cross-site" } }))).toBe(false);
  });
  it("supports same-origin local development without trusting arbitrary hosts", () => {
    vi.stubEnv("NODE_ENV", "development");
    expect(hasValidRequestOrigin(new Request("http://localhost:3102/api/test", { headers: { origin: "http://localhost:3102" } }))).toBe(true);
    expect(hasValidRequestOrigin(new Request("https://attacker.invalid/api/test", { headers: { origin: "https://attacker.invalid" } }))).toBe(false);
  });
});

describe("safe authentication return destinations", () => {
  it.each(["/membership/checkout", "/membership/payment?id=123", "/dashboard/addresses?returnTo=membership", "/admin/membership-benefits"])("preserves %s", path => expect(getSafeRedirectPath(path)).toBe(path));
  it.each(["//evil.invalid", "https://evil.invalid", "/\\evil.invalid", "/\t/evil.invalid", "/%2f%2fevil.invalid", "/membership/%2e%2e/%2e%2e/signin", "/signin?next=//evil.invalid", "/api/redirect?url=https://evil.invalid", "/membership/%255c%255cevil.invalid", null, ["/membership/checkout"]])("rejects unsafe destination %s", path => expect(getSafeRedirectPath(path)).toBe("/dashboard"));
});
