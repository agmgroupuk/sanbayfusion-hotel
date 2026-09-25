"use server";

import { and, eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { z } from "zod";
import { consumePasswordResetToken, createCustomerSession, createPasswordResetToken, destroyCustomerSession, getCurrentAccount, hashPassword, normalizeEmail, verifyPassword } from "@/lib/auth";
import { db } from "@/lib/db";
import { customerAccounts, passwordResetTokens } from "@/lib/db/schema";
import { sendPasswordResetEmail } from "@/lib/email/account";

const phoneSchema = z.string().trim().regex(/^(?:\+66|0)[0-9\s().-]{8,18}$/, "Enter a valid Thailand mobile number");
const passwordSchema = z.string().min(10, "Use at least 10 characters").regex(/[a-z]/, "Include a lowercase letter").regex(/[A-Z]/, "Include an uppercase letter").regex(/[0-9]/, "Include a number");

export type AuthResult = { ok: true; message?: string } | { ok: false; error: string };

export async function signUp(formData: FormData): Promise<AuthResult> {
  if (!db) return { ok: false, error: "Account services are not configured yet. Please try again later." };
  const fullName = String(formData.get("fullName") ?? "").trim();
  const email = normalizeEmail(String(formData.get("email") ?? ""));
  const phone = String(formData.get("phone") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const confirmation = String(formData.get("confirmation") ?? "");
  const parsed = z.object({ fullName: z.string().min(2, "Enter your full name").max(120), email: z.string().email("Enter a valid email address").max(200), phone: phoneSchema, password: passwordSchema }).safeParse({ fullName, email, phone, password });
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Please check your details." };
  if (password !== confirmation) return { ok: false, error: "Passwords do not match." };
  if (formData.get("agreements") !== "on") return { ok: false, error: "Please accept the Terms & Conditions and Privacy Policy." };
  const existing = await db.select({ id: customerAccounts.id }).from(customerAccounts).where(eq(customerAccounts.email, email)).limit(1);
  if (existing.length) return { ok: false, error: "An account with that email already exists." };
  try {
    await db.insert(customerAccounts).values({ fullName, email, phone, passwordHash: await hashPassword(password) });
  } catch (error) {
    console.error("[auth] account creation failed", error);
    return { ok: false, error: "We couldn't create your account. Please try again." };
  }
  return { ok: true, message: "Your account is ready. Please sign in to continue." };
}

export async function signIn(formData: FormData): Promise<AuthResult> {
  if (!db) return { ok: false, error: "Account services are not configured yet. Please try again later." };
  const email = normalizeEmail(String(formData.get("email") ?? ""));
  const password = String(formData.get("password") ?? "");
  if (!z.string().email().safeParse(email).success || !password) return { ok: false, error: "Email or password is incorrect." };
  const result = await db.select().from(customerAccounts).where(eq(customerAccounts.email, email)).limit(1);
  if (!result[0] || !(await verifyPassword(password, result[0].passwordHash))) return { ok: false, error: "Email or password is incorrect." };
  await createCustomerSession(result[0].id);
  redirect("/dashboard");
}

export async function signOut() {
  await destroyCustomerSession();
  redirect("/signin");
}

export async function requestPasswordReset(formData: FormData): Promise<AuthResult> {
  if (!db) return { ok: true, message: "If an account exists for this email address, password reset instructions have been sent." };
  const email = normalizeEmail(String(formData.get("email") ?? ""));
  if (!z.string().email().safeParse(email).success) return { ok: false, error: "Enter a valid email address." };
  const account = (await db.select().from(customerAccounts).where(eq(customerAccounts.email, email)).limit(1))[0];
  if (account) {
    const token = await createPasswordResetToken(account.id);
    const origin = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
    if (token) {
      try { await sendPasswordResetEmail(account.email, `${origin}/reset-password?token=${encodeURIComponent(token)}`); } catch (error) { console.error("[auth] password reset email failed", error); }
    }
  }
  return { ok: true, message: "If an account exists for this email address, password reset instructions have been sent." };
}

export async function resetPassword(formData: FormData): Promise<AuthResult> {
  if (!db) return { ok: false, error: "Account services are not configured yet. Please try again later." };
  const token = String(formData.get("token") ?? "");
  const password = String(formData.get("password") ?? "");
  const confirmation = String(formData.get("confirmation") ?? "");
  const checked = passwordSchema.safeParse(password);
  if (!checked.success) return { ok: false, error: checked.error.issues[0]?.message ?? "Choose a stronger password." };
  if (password !== confirmation) return { ok: false, error: "Passwords do not match." };
  const reset = await consumePasswordResetToken(token);
  if (!reset) return { ok: false, error: "This reset link is invalid or has expired." };
  await db.transaction(async (tx) => {
    await tx.update(customerAccounts).set({ passwordHash: await hashPassword(password), updatedAt: new Date() }).where(eq(customerAccounts.id, reset.accountId));
    await tx.update(passwordResetTokens).set({ usedAt: new Date() }).where(and(eq(passwordResetTokens.id, reset.id), eq(passwordResetTokens.accountId, reset.accountId)));
  });
  return { ok: true, message: "Your password has been successfully updated." };
}

export async function currentCustomer() {
  return getCurrentAccount();
}