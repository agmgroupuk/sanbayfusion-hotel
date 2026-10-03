import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { PGlite } from "@electric-sql/pglite";
import { drizzle } from "drizzle-orm/pglite";
import { readFileSync, readdirSync } from "node:fs";
import * as schema from "@/lib/db/schema";

const state = vi.hoisted(() => ({ db: null as typeof import("@/lib/db").db, jar: new Map<string, string>(), options: new Map<string, object>() }));
vi.mock("server-only", () => ({}));
vi.mock("@/lib/db", () => ({ get db() { return state.db; } }));
vi.mock("@/lib/stripe", () => ({ stripe: {} })); // No payment calls are needed before account completion.
vi.mock("next/headers", () => ({ headers: async () => new Headers({host:"sanbayfusion.com"}), cookies: async () => ({
  get: (name: string) => state.jar.has(name) ? { value: state.jar.get(name)! } : undefined,
  set: (name: string, value: string, options: object) => { state.jar.set(name, value); state.options.set(name, options); },
  delete: (name: string) => state.jar.delete(name),
}) }));
vi.mock("next/navigation", () => ({ redirect: (path: string) => { throw new Error(`REDIRECT:${path}`); } }));
import { hashPassword, getCurrentAccount, sessionCookie } from "@/lib/auth";
import { sharedSessionCookie } from "./platform-hosts";
import { signIn } from "@/app/auth/actions";
import SignInPage from "@/app/(site)/signin/page";
import SignUpPage from "@/app/(site)/signup/page";
import { POST as save } from "@/app/api/membership/checkout-selection/route";
import { POST as apply } from "@/app/api/membership/application/route";
import { readMembershipCheckoutSelection, sharedCheckoutCookie } from "@/lib/membership-checkout";
import { membershipPreferredTimes } from "@/lib/membership-plans";

let client: PGlite;
let database: ReturnType<typeof drizzle<typeof schema>>;
const configuration = { planSlug: "3-month-membership", selectedServiceMonths: ["2027-02", "2027-07", "2027-11"], purchaseMode: "membership_with_package", foodPreferences: ["Thai Food"], deliveryArea: "Bangkok", preferredDay: "Monday", preferredTime: membershipPreferredTimes[0], alcoholEnabled: false, selectedProducts: [{ category: "Thai soups", name: "Tom Yum Goong", quantity: 4 }], selectedAddOns: [] };
const request = (body: object, origin = "https://sanbayfusion.com") => new Request("http://0.0.0.0:8080/api/test", { method: "POST", headers: { origin, "content-type": "application/json" }, body: JSON.stringify(body) });
function credentials(next = "/membership/checkout", password = "TestPassword123") {
  const data = new FormData();
  for (const [key, value] of Object.entries({ email: "flow@example.invalid", password, next })) data.set(key, value);
  return data;
}

beforeAll(async () => {
  client = new PGlite();
  for (const file of readdirSync("drizzle").filter(file => file.endsWith(".sql")).sort()) await client.exec(readFileSync(`drizzle/${file}`, "utf8"));
  database = drizzle(client, { schema });
  state.db = database as unknown as NonNullable<typeof state.db>;
}, 60000);
beforeEach(async () => {
  vi.stubEnv("NODE_ENV", "production"); vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://sanbayfusion.com"); vi.stubEnv("RAILWAY_PUBLIC_DOMAIN", "sanbayfusion.com");
  vi.useFakeTimers({ toFake: ["Date"] }); vi.setSystemTime(new Date("2026-10-02T05:00:00Z"));
  await client.exec("TRUNCATE customer_accounts, account_rate_limits CASCADE");
  state.jar.clear(); state.options.clear();
  await database.insert(schema.customerAccounts).values({ email: "flow@example.invalid", passwordHash: await hashPassword("TestPassword123") });
});
afterEach(() => { vi.useRealTimers(); vi.unstubAllEnvs(); });
afterAll(async () => { await client.close(); });

describe("membership authentication journey with real sessions and isolated Postgres", () => {
  it("resolves the same account using only the shared cookie and revokes it on sign out", async () => {
    await expect(signIn(credentials())).rejects.toThrow("REDIRECT:/membership/checkout");
    const first = await getCurrentAccount();
    state.jar.delete(sessionCookie); // A sibling host never receives the old host-only cookie.
    expect((await getCurrentAccount())?.id).toBe(first?.id);
    const {destroyCustomerSession} = await import("./auth");
    await destroyCustomerSession();
    expect(await getCurrentAccount()).toBeNull();
    expect(await database.select().from(schema.customerSessions)).toHaveLength(0);
  });
  it("preserves the guest cart, signs in to checkout, reprices and identifies missing account details without creating an application", async () => {
    const response = await save(request({ planSlug: configuration.planSlug, configuration: { ...configuration, total: 1, planPrice: 1 } }));
    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({ next: "/signin?next=%2Fmembership%2Fcheckout" });
    expect((await readMembershipCheckoutSelection())?.configuration).toEqual(configuration);
    expect(state.options.get(sharedCheckoutCookie)).toMatchObject({ httpOnly: true, secure: true, sameSite: "lax", path: "/", domain:"sanbayfusion.com" });
    expect(await database.select().from(schema.membershipRequests)).toHaveLength(0);
    expect((await apply(request({ action: "prepare" }))).status).toBe(401);
    expect((await apply(request({ action: "submit", applicationId: crypto.randomUUID() }))).status).toBe(401);
    await expect(signIn(credentials())).rejects.toThrow("REDIRECT:/membership/checkout");
    expect(await getCurrentAccount()).toMatchObject({ email: "flow@example.invalid" });
    expect(state.options.get(sharedSessionCookie)).toMatchObject({domain:"sanbayfusion.com",httpOnly:true,secure:true,sameSite:"lax"});
    expect((await readMembershipCheckoutSelection())?.configuration).toEqual(configuration);
    const reviewResponse = await apply(request({ action: "prepare", amount: 1, accountId: "attacker" }));
    expect(reviewResponse.status).toBe(200);
    const review = await reviewResponse.json();
    expect(review.purchaseSnapshot.total).toBe(18840);
    expect(review.purchaseSnapshot.selectedServiceMonths).toEqual(configuration.selectedServiceMonths);
    expect(review.review.complete).toBe(false);
    expect(review.review.requirements.filter((item: { complete: boolean }) => !item.complete)).toHaveLength(5);
    expect(review.applicationId).toBeNull();
    expect(await database.select().from(schema.membershipRequests)).toHaveLength(0);
  });
  it("sends a signed-in customer directly to checkout and honors next on existing Sign In and Sign Up sessions", async () => {
    await expect(signIn(credentials())).rejects.toThrow("REDIRECT:/membership/checkout");
    const response = await save(request({ planSlug: configuration.planSlug, configuration }));
    expect(await response.json()).toMatchObject({ next: "/membership/checkout" });
    for (const page of [SignInPage, SignUpPage]) await expect(page({ searchParams: Promise.resolve({ next: "/membership/checkout" }) })).rejects.toThrow("REDIRECT:/membership/checkout");
  });
  it("rejects hostile origins both before and after authentication without saving a cart", async () => {
    for (const authenticated of [false, true]) {
      if (authenticated) await expect(signIn(credentials())).rejects.toThrow("REDIRECT:/membership/checkout");
      expect((await save(request({ planSlug: configuration.planSlug, configuration }, "https://attacker.invalid"))).status).toBe(403);
      expect(await readMembershipCheckoutSelection()).toBeNull();
    }
  });
  it("keeps the cart after failed sign-in or an expired session and blocks an external return URL", async () => {
    await save(request({ planSlug: configuration.planSlug, configuration }));
    expect(await signIn(credentials(undefined, "wrong"))).toMatchObject({ ok: false });
    expect((await readMembershipCheckoutSelection())?.configuration).toEqual(configuration);
    await expect(signIn(credentials("//attacker.invalid"))).rejects.toThrow("REDIRECT:/dashboard");
    state.jar.set(sessionCookie, "expired-session");
    state.jar.set(sharedSessionCookie, "expired-session");
    const response = await save(request({ planSlug: configuration.planSlug, configuration }));
    expect(await response.json()).toMatchObject({ next: "/signin?next=%2Fmembership%2Fcheckout" });
  });
});
