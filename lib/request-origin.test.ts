import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { hasValidRequestOrigin, trustedPublicOrigins } from "./request-origin";
import { getSafeRedirectPath } from "./auth-redirect";

beforeEach(() => {
  vi.stubEnv("NODE_ENV", "production");
  vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://sanbayfusion.com");
  vi.stubEnv("RAILWAY_PUBLIC_DOMAIN", "sanbayfusion.com");
});
afterEach(() => vi.unstubAllEnvs());
const request = (origin: string, headers: Record<string, string> = {}) => new Request("http://0.0.0.0:8080/api/membership/checkout-selection", { headers: { origin, ...headers } });

describe("public origin validation behind Railway", () => {
  it("accepts the explicit payment subdomain without wildcard origins", () => {
    expect(hasValidRequestOrigin(request("https://pay.sanbayfusion.com"))).toBe(true);
    expect(hasValidRequestOrigin(request("https://pay.sanbayfusion.com.attacker.invalid"))).toBe(false);
    expect(hasValidRequestOrigin(request("https://untrusted.sanbayfusion.com"))).toBe(false);
  });
  it("accepts the configured HTTPS origin despite an internal HTTP request URL", () => {
    expect(hasValidRequestOrigin(request("https://sanbayfusion.com"))).toBe(true);
  });
  it.each(["https://attacker.invalid", "null", "http://sanbayfusion.com", "https://sanbayfusion.com.attacker.invalid", "https://sanbayfusion.com/", "http://0.0.0.0:8080", "https://other.up.railway.app"])("rejects %s even with forged proxy headers", origin => {
    expect(hasValidRequestOrigin(request(origin, { host: "attacker.invalid", "x-forwarded-host": "attacker.invalid", "x-forwarded-proto": "https" }))).toBe(false);
  });
  it("rejects browser cross-site requests including ones without Origin", () => {
    expect(hasValidRequestOrigin(request("https://sanbayfusion.com", { "sec-fetch-site": "cross-site" }))).toBe(false);
    expect(hasValidRequestOrigin(new Request("https://sanbayfusion.com", { headers: { "sec-fetch-site": "cross-site" } }))).toBe(false);
  });
  it("trusts only the exact deployment domain, never a Railway wildcard", () => {
    vi.stubEnv("RAILWAY_PUBLIC_DOMAIN", "owned.up.railway.app");
    expect(hasValidRequestOrigin(request("https://owned.up.railway.app"))).toBe(true);
    expect(hasValidRequestOrigin(request("https://other.up.railway.app"))).toBe(false);
    vi.stubEnv("RAILWAY_PUBLIC_DOMAIN", "sanbayfusion.com@attacker.invalid");
    expect(trustedPublicOrigins()).toEqual(["https://sanbayfusion.com", "https://pay.sanbayfusion.com"]);
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
