"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { requestPasswordReset, resetPassword, signIn, signUp, type AuthResult } from "@/app/auth/actions";

const inputClass = "mt-2 h-12 w-full rounded-sm border border-input bg-background px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/40";

function Feedback({ result }: { result: AuthResult | null }) {
  if (!result) return null;
  return <p role={result.ok ? "status" : "alert"} className={`mt-5 rounded-sm border p-4 text-sm ${result.ok ? "border-gold/50 bg-gold/5 text-gold" : "border-destructive/50 bg-destructive/10 text-foreground"}`}>{result.ok ? result.message : result.error}</p>;
}

function FormFrame({ children }: { children: React.ReactNode }) {
  return <div className="mx-auto max-w-xl px-5 pb-28 sm:px-8"><div className="rounded-sm border border-border/60 bg-card/30 p-6 sm:p-10">{children}</div></div>;
}

export function SignUpForm({ next = "/dashboard" }: { next?: string }) {
  const [result, setResult] = useState<AuthResult | null>(null);
  const [pending, start] = useTransition();
  return <FormFrame><form action={(data) => { data.set("next", next); start(async () => setResult(await signUp(data))); }} className="space-y-5"><input type="hidden" name="next" value={next} /><label className="block text-sm">Full Name *<input name="fullName" required autoComplete="name" className={inputClass} /></label><label className="block text-sm">Email Address *<input name="email" required type="email" autoComplete="email" className={inputClass} /></label><label className="block text-sm">Mobile Number *<input name="phone" required type="tel" inputMode="tel" autoComplete="tel" placeholder="+66 81 234 5678" className={inputClass} /></label><label className="block text-sm">Password *<input name="password" required type="password" autoComplete="new-password" className={inputClass} /></label><label className="block text-sm">Confirm Password *<input name="confirmation" required type="password" autoComplete="new-password" className={inputClass} /></label><label className="flex gap-3 text-sm leading-relaxed"><input name="agreements" type="checkbox" className="mt-1 size-4 accent-[var(--gold)]" /> <span>I agree to the <Link href="/terms-and-conditions" className="text-gold underline">Terms & Conditions</Link> and acknowledge the <Link href="/privacy-policy" className="text-gold underline">Privacy Policy</Link>.</span></label><button disabled={pending} className="inline-flex h-12 w-full items-center justify-center rounded-full bg-gold px-6 text-eyebrow text-gold-foreground disabled:opacity-60">{pending ? "CREATING ACCOUNT" : "CREATE ACCOUNT"}</button><Feedback result={result} /><p className="pt-3 text-center text-sm text-muted-foreground">Already have an account? <Link href={`/signin?next=${encodeURIComponent(next)}`} className="text-gold underline">SIGN IN</Link></p></form></FormFrame>;
}

export function SignInForm({ notice, next = "/dashboard" }: { notice?: string; next?: string }) {
  const [result, setResult] = useState<AuthResult | null>(null);
  const [pending, start] = useTransition();
  return <FormFrame>{notice && <p role="status" className="mb-5 rounded-sm border border-gold/50 bg-gold/5 p-4 text-sm text-gold">{notice}</p>}<form action={(data) => { data.set("next", next); start(async () => setResult(await signIn(data))); }} className="space-y-5"><input type="hidden" name="next" value={next} /><label className="block text-sm">Email<input name="email" required type="email" autoComplete="email" className={inputClass} /></label><label className="block text-sm">Password<input name="password" required type="password" autoComplete="current-password" className={inputClass} /></label><label className="flex gap-3 text-sm"><input name="remember" type="checkbox" defaultChecked className="mt-1 size-4 accent-[var(--gold)]" /> Remember me</label><button disabled={pending} className="inline-flex h-12 w-full items-center justify-center rounded-full bg-gold px-6 text-eyebrow text-gold-foreground disabled:opacity-60">{pending ? "SIGNING IN" : "SIGN IN"}</button><Feedback result={result} /><div className="flex flex-wrap justify-between gap-3 pt-3 text-sm"><Link href="/forgot-password" className="text-gold underline">Forgot Password?</Link><span className="text-muted-foreground">Don&apos;t have an account? <Link href={`/signup?next=${encodeURIComponent(next)}`} className="text-gold underline">CREATE ACCOUNT</Link></span></div></form></FormFrame>;
}

export function ForgotPasswordForm() {
  const [result, setResult] = useState<AuthResult | null>(null);
  const [pending, start] = useTransition();
  return <FormFrame><form action={(data) => start(async () => setResult(await requestPasswordReset(data)))} className="space-y-5"><label className="block text-sm">Email Address<input name="email" required type="email" autoComplete="email" className={inputClass} /></label><button disabled={pending} className="inline-flex h-12 w-full items-center justify-center rounded-full bg-gold px-6 text-eyebrow text-gold-foreground disabled:opacity-60">{pending ? "SENDING" : "SEND RESET LINK"}</button><Feedback result={result} /><p className="pt-3 text-center text-sm"><Link href="/signin" className="text-gold underline">BACK TO SIGN IN</Link></p></form></FormFrame>;
}

export function ResetPasswordForm({ token }: { token: string }) {
  const [result, setResult] = useState<AuthResult | null>(null);
  const [pending, start] = useTransition();
  return <FormFrame><form action={(data) => { data.set("token", token); start(async () => setResult(await resetPassword(data))); }} className="space-y-5"><label className="block text-sm">New Password<input name="password" required type="password" autoComplete="new-password" className={inputClass} /></label><label className="block text-sm">Confirm New Password<input name="confirmation" required type="password" autoComplete="new-password" className={inputClass} /></label><button disabled={pending} className="inline-flex h-12 w-full items-center justify-center rounded-full bg-gold px-6 text-eyebrow text-gold-foreground disabled:opacity-60">{pending ? "UPDATING" : "RESET PASSWORD"}</button><Feedback result={result} />{result?.ok && <p className="pt-3 text-center text-sm"><Link href="/signin" className="text-gold underline">SIGN IN</Link></p>}</form></FormFrame>;
}