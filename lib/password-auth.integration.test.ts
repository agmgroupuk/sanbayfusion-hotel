import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { PGlite } from "@electric-sql/pglite";
import { drizzle } from "drizzle-orm/pglite";
import { eq } from "drizzle-orm";
import { readFileSync, readdirSync } from "node:fs";
import * as schema from "./db/schema";

const state = vi.hoisted(() => ({ db: null as typeof import("./db").db, jar: new Map<string, string>(), send: vi.fn() }));
vi.mock("server-only", () => ({}));
vi.mock("@/lib/db", () => ({ get db() { return state.db; } }));
vi.mock("@/lib/email/account", () => ({ sendPasswordResetEmail: state.send }));
vi.mock("next/headers", () => ({ cookies: async () => ({
  get: (name: string) => state.jar.has(name) ? { value: state.jar.get(name)! } : undefined,
  set: (name: string, value: string) => state.jar.set(name, value), delete: (name: string) => state.jar.delete(name),
}) }));
vi.mock("next/navigation", () => ({ redirect: (path: string) => { throw new Error(`REDIRECT:${path}`); } }));
import { createCustomerSession, createPasswordResetToken, getCurrentAccount, hashPassword, verifyPassword } from "./auth";
import { requestPasswordReset, resetPassword, signIn, signUp } from "@/app/auth/actions";
import ResetPasswordPage from "@/app/(site)/reset-password/page";
import { changePassword } from "./account/security";

let client: PGlite;
let database: ReturnType<typeof drizzle<typeof schema>>;
let accountId: string;
let token: string;
const good = "v9&Kq2!Nz7@Tr4#Lx8";
const invalid = ["", "Aa1!short", "lowercase123!", "UPPERCASE123!", "NoNumbersHere!", "NoSymbolsHere123", " GoodPassword123!", "GoodPassword123! "];
function data(values: Record<string, string>) { const form = new FormData(); for (const [key, value] of Object.entries(values)) form.set(key, value); return form; }
beforeAll(async () => {
  client = new PGlite();
  for (const file of readdirSync("drizzle").filter(file => file.endsWith(".sql")).sort()) await client.exec(readFileSync(`drizzle/${file}`, "utf8"));
  database = drizzle(client, { schema }); state.db = database as unknown as NonNullable<typeof state.db>;
}, 60000);
beforeEach(async () => {
  await client.exec("TRUNCATE email_outbox, customer_accounts, account_rate_limits CASCADE");
  const [account] = await database.insert(schema.customerAccounts).values({ email: "existing@example.invalid", fullName: "Existing Customer", passwordHash: await hashPassword("LegacyPassword123") }).returning();
  accountId = account.id;
  token = (await createPasswordResetToken(accountId))!;
  state.jar.clear(); state.send.mockReset().mockResolvedValue({ sent: true });
  vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://sanbayfusion-hotel-production.up.railway.app");
});
afterEach(() => vi.unstubAllEnvs());
afterAll(async () => { await client.close(); });

describe("server-enforced password creation and recovery", () => {
  it.each(invalid)("rejects a bypassed invalid password in both server actions: %j", async password => {
    expect(await signUp(data({ fullName: "New Customer", email: "new@example.invalid", phone: "+66812345678", password, confirmation: password, agreements: "on" }))).toMatchObject({ ok: false });
    expect(await resetPassword(data({ token, password, confirmation: password }))).toMatchObject({ ok: false });
    expect(await database.select().from(schema.customerAccounts)).toHaveLength(1);
    expect((await database.select().from(schema.passwordResetTokens))[0].usedAt).toBeNull();
  });
  it("rejects mismatched confirmation and omitted agreements on the server", async () => {
    expect(await signUp(data({ fullName: "New Customer", email: "new@example.invalid", phone: "+66812345678", password: good, confirmation: good }))).toMatchObject({ ok: false });
    expect(await resetPassword(data({ token, password: good, confirmation: "different" }))).toMatchObject({ ok: false, error: "Passwords do not match." });
  });
  it("creates a valid account and preserves the intended membership redirect", async () => {
    await expect(signUp(data({ fullName: "New Customer", email: "new@example.invalid", phone: "+66812345678", password: good, confirmation: good, agreements: "on", next: "/membership/checkout" }))).rejects.toThrow("REDIRECT:/signin?created=1&next=%2Fmembership%2Fcheckout");
    const [account] = await database.select().from(schema.customerAccounts).where(eq(schema.customerAccounts.email, "new@example.invalid"));
    expect(await verifyPassword(good, account.passwordHash)).toBe(true);
  });
  it("keeps legacy sign-in working and completes Forgot Password through a single-use reset without replacing the account", async () => {
    await expect(signIn(data({ email: "existing@example.invalid", password: "LegacyPassword123", next: "/membership/checkout" }))).rejects.toThrow("REDIRECT:/membership/checkout");
    await expect(requestPasswordReset(data({ email: "existing@example.invalid" }))).rejects.toThrow("REDIRECT:/signin?reset=requested");
    const link = new URL(state.send.mock.calls[0][1]);
    expect(link.origin).toBe("https://sanbayfusion-hotel-production.up.railway.app");
    token = link.searchParams.get("token")!;
    const page = await ResetPasswordPage({ searchParams: Promise.resolve({ token }) });
    expect(page.props.children[1].props.tokenExpiresAt).toBeGreaterThan(Date.now());
    const form = data({ token, password: good, confirmation: good });
    await expect(resetPassword(form)).rejects.toThrow("REDIRECT:/signin?reset=complete");
    expect(await getCurrentAccount()).toBeNull();
    expect(await database.select().from(schema.customerSessions)).toHaveLength(0);
    expect(await resetPassword(form)).toMatchObject({ ok: false, resetLinkInvalid: true });
    await expect(signIn(data({ email: "existing@example.invalid", password: good }))).rejects.toThrow("REDIRECT:/dashboard");
    expect((await getCurrentAccount())?.id).toBe(accountId);
  });
  it("keeps invalid, expired and used reset links disabled at rendering and rejects direct submissions", async () => {
    for (const kind of ["missing", "expired", "used"]) {
      if (kind === "expired") await database.update(schema.passwordResetTokens).set({ expiresAt: new Date(Date.now() - 1000) });
      if (kind === "used") await database.update(schema.passwordResetTokens).set({ expiresAt: new Date(Date.now() + 60_000), usedAt: new Date() });
      const candidate = kind === "missing" ? "" : token;
      const page = await ResetPasswordPage({ searchParams: Promise.resolve({ token: candidate }) });
      expect(page.props.children[1].props.tokenExpiresAt).toBeNull();
      expect(await resetPassword(data({ token: candidate, password: good, confirmation: good }))).toMatchObject({ ok: false, resetLinkInvalid: true });
    }
  });
  it("lets only one simultaneous reset consume the token", async () => {
    await createCustomerSession(accountId);
    const results = await Promise.allSettled([resetPassword(data({ token, password: good, confirmation: good })), resetPassword(data({ token, password: good, confirmation: good }))]);
    expect(results.filter(result => result.status === "rejected")).toHaveLength(1); // Redirect after success.
    expect(results.find(result => result.status === "fulfilled")).toMatchObject({ value: { ok: false, resetLinkInvalid: true } });
  });
  it("also enforces the same policy for Account Center changes", async () => {
    await expect(changePassword(accountId, "LegacyPassword123", "NoSymbolsHere123", "")).rejects.toThrow("special character");
  });
});
