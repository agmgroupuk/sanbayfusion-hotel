import "server-only";
import { createCipheriv, createDecipheriv, randomBytes, createHash, timingSafeEqual } from "node:crypto";
import { TOTP, Secret } from "otpauth";
import { eq, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { accountSecurity, accountRateLimits, accountAuditEvents, customerAccounts, customerSessions } from "@/lib/db/schema";
import { verifyPassword, hashPassword, createCustomerSession } from "@/lib/auth";
import { AccountError, passwordSchema } from "./types";
export const digest = (value: string) => createHash("sha256").update(value).digest("hex");
function encryptionKey() {
  const value = process.env.ACCOUNT_SECURITY_KEY ?? "";
  if (!/^[a-f0-9]{64}$/i.test(value)) throw new AccountError("Security enrollment is temporarily unavailable.", 503);
  return Buffer.from(value, "hex");
}
export function encryptSecret(secret: string, accountId: string) {
  const nonce = randomBytes(12); const cipher = createCipheriv("aes-256-gcm", encryptionKey(), nonce); cipher.setAAD(Buffer.from(accountId));
  const value = Buffer.concat([cipher.update(secret, "utf8"), cipher.final()]);
  return [nonce, cipher.getAuthTag(), value].map(part => part.toString("base64url")).join(".");
}
export function decryptSecret(value: string, accountId: string) {
  const [nonce, tag, data] = value.split(".").map(part => Buffer.from(part, "base64url"));
  const decipher = createDecipheriv("aes-256-gcm", encryptionKey(), nonce); decipher.setAAD(Buffer.from(accountId)); decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(data), decipher.final()]).toString("utf8");
}
export function totp(secret: string, label = "Sanbay Fusion") { return new TOTP({ issuer: "Sanbay Fusion", label, algorithm: "SHA1", digits: 6, period: 30, secret }); }
export async function rateLimit(scope: string, identity: string, max = 10) {
  if (!db) throw new AccountError("Account services unavailable.", 503);
  const key = `${scope}:${digest(identity)}`;
  const [row] = await db.insert(accountRateLimits).values({ key, attempts: 1, expiresAt: new Date(Date.now() + 15 * 60_000) }).onConflictDoUpdate({ target: accountRateLimits.key, set: { attempts: sql`case when ${accountRateLimits.expiresAt} <= now() then 1 else ${accountRateLimits.attempts} + 1 end`, expiresAt: sql`case when ${accountRateLimits.expiresAt} <= now() then now() + interval '15 minutes' else ${accountRateLimits.expiresAt} end` } }).returning();
  if (row.attempts > max) throw new AccountError("Too many attempts. Please try again in 15 minutes.", 429);
}
export async function securityStatus(accountId: string) {
  if (!db) throw new AccountError("Account services unavailable.", 503);
  const [row] = await db.select().from(accountSecurity).where(eq(accountSecurity.accountId, accountId)).limit(1);
  return { enabled: !!row?.enabledAt, recoveryCodesRemaining: row?.recoveryHashes.length ?? 0 };
}
/** Consume a TOTP time step or one recovery code under a row lock. */
export async function consumeSecondFactor(accountId: string, code: string) {
  if (!db) return false;
  return db.transaction(async tx => {
    const [row] = await tx.select().from(accountSecurity).where(eq(accountSecurity.accountId, accountId)).limit(1).for("update");
    if (!row?.enabledAt) return true;
    const normalized = code.trim().replaceAll(" ", "");
    if (/^\d{6}$/.test(normalized) && row.totpSecret) {
      const otp = totp(decryptSecret(row.totpSecret, accountId)); const delta = otp.validate({ token: normalized, window: 1 });
      const counter = otp.counter() + (delta ?? 0);
      if (delta !== null && counter > row.lastCounter) { await tx.update(accountSecurity).set({ lastCounter: counter }).where(eq(accountSecurity.accountId, accountId)); return true; }
    }
    const hashed = digest(normalized.toUpperCase());
    const index = row.recoveryHashes.findIndex(hash => timingSafeEqual(Buffer.from(hash, "hex"), Buffer.from(hashed, "hex")));
    if (index < 0) return false;
    await tx.update(accountSecurity).set({ recoveryHashes: row.recoveryHashes.filter((_, i) => i !== index) }).where(eq(accountSecurity.accountId, accountId));
    return true;
  });
}
export async function reauthenticate(accountId: string, password: string, code = "") {
  if (!db) throw new AccountError("Account services unavailable.", 503);
  await rateLimit("reauth", accountId);
  const [account] = await db.select().from(customerAccounts).where(eq(customerAccounts.id, accountId)).limit(1);
  if (!account || !await verifyPassword(password, account.passwordHash) || !await consumeSecondFactor(accountId, code)) throw new AccountError("Current password or authentication code is incorrect.", 403);
  return account;
}
export async function audit(accountId: string, event: string) { if (db) await db.insert(accountAuditEvents).values({ accountId, event }); }
async function rotateSessions(accountId: string) {
  await db!.delete(customerSessions).where(eq(customerSessions.accountId, accountId));
  await createCustomerSession(accountId);
}
export async function beginTwoFactor(accountId: string, password: string) {
  const account = await reauthenticate(accountId, password);
  if ((await securityStatus(accountId)).enabled) throw new AccountError("Two-factor authentication is already enabled.");
  const secret = new Secret({ size: 20 }).base32;
  const values = { pendingSecret: encryptSecret(secret, accountId), pendingExpiresAt: new Date(Date.now() + 10 * 60_000) };
  await db!.insert(accountSecurity).values({ accountId, ...values }).onConflictDoUpdate({ target: accountSecurity.accountId, set: values });
  return { secret, uri: totp(secret, account.email).toString() };
}
export async function enableTwoFactor(accountId: string, code: string) {
  await rateLimit("enroll", accountId);
  const codes = Array.from({ length: 10 }, () => randomBytes(8).toString("hex").toUpperCase());
  await db!.transaction(async tx => {
    const [row] = await tx.select().from(accountSecurity).where(eq(accountSecurity.accountId, accountId)).limit(1).for("update");
    if (!row || row.enabledAt || !row.pendingSecret || !row.pendingExpiresAt || row.pendingExpiresAt.getTime() < Date.now()) throw new AccountError("Enrollment expired. Start again.");
    const otp = totp(decryptSecret(row.pendingSecret, accountId)); const delta = otp.validate({ token: code, window: 1 });
    if (delta === null) throw new AccountError("Enter a valid six-digit authenticator code.");
    await tx.update(accountSecurity).set({ totpSecret: row.pendingSecret, pendingSecret: null, pendingExpiresAt: null, enabledAt: new Date(), lastCounter: otp.counter() + delta, recoveryHashes: codes.map(digest) }).where(eq(accountSecurity.accountId, accountId));
  });
  await rotateSessions(accountId); await audit(accountId, "two_factor_enabled");
  return { recoveryCodes: codes };
}
export async function disableTwoFactor(accountId: string, password: string, code: string) {
  await reauthenticate(accountId, password, code);
  await db!.update(accountSecurity).set({ totpSecret: null, enabledAt: null, pendingSecret: null, pendingExpiresAt: null, recoveryHashes: [], lastCounter: -1 }).where(eq(accountSecurity.accountId, accountId));
  await rotateSessions(accountId); await audit(accountId, "two_factor_disabled");
}
export async function changePassword(accountId: string, password: string, next: string, code: string) {
  const checked = passwordSchema.safeParse(next); if (!checked.success) throw new AccountError(checked.error.issues[0].message);
  await reauthenticate(accountId, password, code);
  await db!.update(customerAccounts).set({ passwordHash: await hashPassword(next), updatedAt: new Date() }).where(eq(customerAccounts.id, accountId));
  await rotateSessions(accountId); await audit(accountId, "password_changed");
}
