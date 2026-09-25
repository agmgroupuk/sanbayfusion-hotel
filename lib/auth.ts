import "server-only";

import { createHash, randomBytes, scrypt, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";
import { and, eq, gt, isNull } from "drizzle-orm";
import { cookies } from "next/headers";
import { db } from "@/lib/db";
import { customerAccounts, customerSessions, passwordResetTokens, type CustomerAccount } from "@/lib/db/schema";

const scryptAsync = promisify(scrypt);
const sessionCookie = "sbf_customer_session";
const sessionLifetimeMs = 1000 * 60 * 60 * 24 * 30;

export const normalizeEmail = (email: string) => email.trim().toLowerCase();

export async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const derivedKey = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${salt}:${derivedKey.toString("hex")}`;
}

export async function verifyPassword(password: string, storedHash: string) {
  const [salt, key] = storedHash.split(":");
  if (!salt || !key) return false;
  const derivedKey = (await scryptAsync(password, salt, 64)) as Buffer;
  const expected = Buffer.from(key, "hex");
  return expected.length === derivedKey.length && timingSafeEqual(expected, derivedKey);
}

function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export async function createCustomerSession(accountId: string) {
  if (!db) return false;
  const token = randomBytes(32).toString("base64url");
  await db.insert(customerSessions).values({ accountId, tokenHash: hashToken(token), expiresAt: new Date(Date.now() + sessionLifetimeMs) });
  (await cookies()).set(sessionCookie, token, { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/", maxAge: sessionLifetimeMs / 1000 });
  return true;
}

export async function getCurrentAccount(): Promise<CustomerAccount | null> {
  if (!db) return null;
  const token = (await cookies()).get(sessionCookie)?.value;
  if (!token) return null;
  try {
    const result = await db.select({ account: customerAccounts }).from(customerSessions).innerJoin(customerAccounts, eq(customerSessions.accountId, customerAccounts.id)).where(and(eq(customerSessions.tokenHash, hashToken(token)), gt(customerSessions.expiresAt, new Date()))).limit(1);
    return result[0]?.account ?? null;
  } catch (error) {
    console.error("[auth] session lookup failed", error);
    return null;
  }
}

export async function destroyCustomerSession() {
  if (!db) return;
  const cookieStore = await cookies();
  const token = cookieStore.get(sessionCookie)?.value;
  if (token) await db.delete(customerSessions).where(eq(customerSessions.tokenHash, hashToken(token)));
  cookieStore.delete(sessionCookie);
}

export async function createPasswordResetToken(accountId: string) {
  if (!db) return null;
  const token = randomBytes(32).toString("base64url");
  await db.delete(passwordResetTokens).where(eq(passwordResetTokens.accountId, accountId));
  await db.insert(passwordResetTokens).values({ accountId, tokenHash: hashToken(token), expiresAt: new Date(Date.now() + 1000 * 60 * 60) });
  return token;
}

export async function consumePasswordResetToken(token: string) {
  if (!db) return null;
  const result = await db.select().from(passwordResetTokens).where(and(eq(passwordResetTokens.tokenHash, hashToken(token)), isNull(passwordResetTokens.usedAt), gt(passwordResetTokens.expiresAt, new Date()))).limit(1);
  return result[0] ?? null;
}

export { sessionCookie };