import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { proxy } from "../proxy";

const railwayHost = "sanbayfusion-hotel-production.up.railway.app";
beforeEach(() => vi.stubEnv("NEXT_PUBLIC_SITE_URL", `https://${railwayHost}`));
afterEach(() => vi.unstubAllEnvs());

function request(host: string, path: string) {
  return new NextRequest(`https://${host}${path}`, { headers: { host } });
}

describe("single-origin production routing", () => {
  it.each([
    [railwayHost, "/dashboard/checkout?order=123"],
    [railwayHost, "/membership/checkout"],
    ["sanbayfusion.com", "/dashboard/checkout?order=123"],
    ["pay.sanbayfusion.com", "/dashboard/orders?page=2"],
  ])("does not redirect %s%s to an unavailable hostname", (host, path) => {
    const response = proxy(request(host, path));
    expect(response.headers.get("location")).toBeNull();
  });

  it("preserves an internal account destination on the configured Railway host", () => {
    const response = proxy(request(railwayHost, "/dashboard/orders?page=2"));
    expect(response.headers.get("x-middleware-request-x-account-destination")).toBe("/dashboard/orders?page=2");
  });
});
