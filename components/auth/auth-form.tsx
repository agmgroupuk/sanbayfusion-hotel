"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, useState } from "react";

type AuthMode = "signin" | "signup" | "forgot" | "reset";

const inputClass =
  "mt-2 w-full rounded-lg border border-input bg-background/70 px-4 py-3 text-base text-foreground outline-none transition placeholder:text-muted-foreground focus:border-gold focus:ring-2 focus:ring-gold/30";

export function AuthForm({ mode }: { mode: AuthMode }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setMessage("");
    setBusy(true);
    const values = Object.fromEntries(new FormData(event.currentTarget));

    const endpoint =
      mode === "signin"
        ? "/api/auth/signin"
        : mode === "signup"
          ? "/api/auth/signup"
          : mode === "forgot"
            ? "/api/auth/forgot-password"
            : "/api/auth/reset-password";
    const body =
      mode === "reset"
        ? { token: searchParams.get("token"), password: values.password }
        : values;

    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(body),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "The request failed.");

      if (mode === "signin" || mode === "signup") {
        const redirect = searchParams.get("redirect");
        router.replace(
          redirect?.startsWith("/") && !redirect.startsWith("//")
            ? redirect
            : "/agents",
        );
        router.refresh();
      } else if (mode === "forgot") {
        setMessage(result.message);
      } else {
        setMessage(result.message);
        router.replace("/auth/signin");
      }
    } catch (submitError) {
      setError(
        submitError instanceof Error ? submitError.message : "The request failed.",
      );
    } finally {
      setBusy(false);
    }
  };

  const title = {
    signin: "Sign in",
    signup: "Create account",
    forgot: "Reset your password",
    reset: "Choose a new password",
  }[mode];

  return (
    <section className="mx-auto w-full max-w-md px-5 py-16 sm:py-24">
      <p className="text-eyebrow text-gold">Sanbay Fusion</p>
      <h1 className="mt-5 font-display text-h2">{title}</h1>
      <form onSubmit={submit} className="mt-9 space-y-5 rounded-2xl border border-border bg-card/80 p-6 shadow-xl shadow-black/20 sm:p-8">
        {mode === "signup" ? (
          <label className="block text-sm text-foreground/85">
            Name
            <input name="name" type="text" autoComplete="name" maxLength={100} className={inputClass} />
          </label>
        ) : null}
        {mode !== "reset" ? (
          <label className="block text-sm text-foreground/85">
            Email
            <input
              name="email"
              type="email"
              autoComplete="email"
              required
              maxLength={254}
              className={inputClass}
            />
          </label>
        ) : null}
        {mode === "signin" || mode === "signup" || mode === "reset" ? (
          <label className="block text-sm text-foreground/85">
            {mode === "reset" ? "New password" : "Password"}
            <input
              name="password"
              type="password"
              autoComplete={mode === "signin" ? "current-password" : "new-password"}
              required
              minLength={8}
              maxLength={128}
              className={inputClass}
            />
          </label>
        ) : null}
        {error ? (
          <p role="alert" className="rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
            {error}
          </p>
        ) : null}
        {message ? (
          <p role="status" className="rounded-lg border border-gold/30 bg-gold/10 p-3 text-sm text-foreground">
            {message}
          </p>
        ) : null}
        <button
          type="submit"
          disabled={busy}
          className="inline-flex w-full items-center justify-center rounded-full bg-gold px-6 py-3 text-eyebrow text-gold-foreground transition-colors hover:bg-gold/85 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold disabled:cursor-wait disabled:opacity-60"
        >
          {busy ? "Please wait…" : title}
        </button>
        <div className="flex flex-wrap justify-between gap-3 text-sm text-muted-foreground">
          {mode === "signin" ? (
            <>
              <Link className="transition-colors hover:text-gold" href="/auth/forgot-password">Forgot password?</Link>
              <Link className="transition-colors hover:text-gold" href="/auth/signup">Create account</Link>
            </>
          ) : null}
          {mode === "signup" ? (
            <Link className="transition-colors hover:text-gold" href="/auth/signin">Already registered? Sign in</Link>
          ) : null}
          {mode === "forgot" ? (
            <Link className="transition-colors hover:text-gold" href="/auth/signin">Return to sign in</Link>
          ) : null}
          {mode === "reset" ? (
            <Link className="transition-colors hover:text-gold" href="/auth/signin">Return to sign in</Link>
          ) : null}
        </div>
      </form>
    </section>
  );
}
