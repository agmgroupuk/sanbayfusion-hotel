"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { navLinks, site } from "@/lib/site";

export function SiteNav() {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [authError, setAuthError] = useState("");

  const refreshSession = useCallback(async () => {
    try {
      const response = await fetch("/api/auth/verify", {
        credentials: "include",
        cache: "no-store",
      });
      if (!response.ok) throw new Error("Could not verify the current session.");
      const result = await response.json();
      setUserEmail(result.valid ? result.user?.email ?? null : null);
    } catch (error) {
      console.error("Navigation session check failed:", error);
      setAuthError("Account status could not be checked.");
    }
  }, []);

  useEffect(() => {
    void refreshSession();
  }, [refreshSession]);

  useEffect(() => {
    if (!open) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [open]);

  const signOut = async () => {
    setAuthError("");
    try {
      const response = await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include",
      });
      if (!response.ok) throw new Error("Sign out failed. Please try again.");
      setUserEmail(null);
      setOpen(false);
      router.push("/");
      router.refresh();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Sign out failed.";
      setAuthError(message);
      console.error("Sign out failed:", error);
    }
  };

  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-gold/20 bg-background/90 text-foreground shadow-[0_8px_30px_rgba(0,0,0,0.18)] backdrop-blur-md">
      <nav
        aria-label="Main navigation"
        className="mx-auto flex h-16 max-w-7xl items-center justify-between px-5 sm:h-20 sm:px-8"
      >
        <Link
          href="/"
          aria-label={`${site.name} home`}
          className="relative block h-8 w-36 transition-opacity hover:opacity-80 sm:h-10 sm:w-44"
          onClick={() => setOpen(false)}
        >
          <Image
            src="/brand/sanbayfusion-logo.webp"
            alt={site.name}
            fill
            priority
            sizes="(min-width: 640px) 176px, 144px"
            className="object-contain object-left"
          />
        </Link>

        <div className="hidden items-center gap-8 md:flex">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              aria-current={pathname === link.href ? "page" : undefined}
              className={cn(
                "group relative whitespace-nowrap text-sm tracking-wide transition-colors hover:text-gold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold",
                pathname === link.href ? "text-gold" : "text-foreground/85",
              )}
            >
              {link.label}
              <span
                className={cn(
                  "absolute -bottom-2 left-0 h-px w-full origin-left bg-gold transition-transform duration-300",
                  pathname === link.href
                    ? "scale-x-100"
                    : "scale-x-0 group-hover:scale-x-100",
                )}
              />
            </Link>
          ))}
          <Link
            href={userEmail ? "/agents" : "/auth/signin"}
            className="inline-flex rounded-full bg-gold px-5 py-2 text-eyebrow text-gold-foreground shadow-sm shadow-background/40 transition-all hover:-translate-y-0.5 hover:bg-gold/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          >
            {userEmail ? "Open platform" : "Sign in"}
          </Link>
          {userEmail ? (
            <button
              type="button"
              onClick={signOut}
              className="whitespace-nowrap text-sm text-foreground/70 transition-colors hover:text-gold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold"
            >
              Sign out
            </button>
          ) : (
            <Link
              href="/auth/signup"
              className="whitespace-nowrap text-sm text-foreground/70 transition-colors hover:text-gold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold"
            >
              Sign up
            </Link>
          )}
        </div>

        <button
          type="button"
          aria-label={open ? "Close menu" : "Open menu"}
          aria-expanded={open}
          aria-controls="mobile-menu"
          onClick={() => setOpen((value) => !value)}
          className="inline-flex size-10 items-center justify-center rounded-full border border-gold/30 text-gold transition-colors hover:border-gold hover:bg-gold/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold md:hidden"
        >
          {open ? <X className="size-5" /> : <Menu className="size-5" />}
        </button>
      </nav>

      <div
        id="mobile-menu"
        className={cn(
          "fixed inset-x-0 top-16 max-h-[calc(100dvh-4rem)] overflow-y-auto border-b border-gold/25 bg-background px-5 py-5 sm:top-20 sm:max-h-[calc(100dvh-5rem)] sm:px-8 sm:py-8 md:hidden",
          open ? "block" : "hidden",
        )}
      >
        <nav aria-label="Mobile navigation" className="mx-auto flex max-w-7xl flex-col">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              aria-current={pathname === link.href ? "page" : undefined}
              onClick={() => setOpen(false)}
              className={cn(
                "border-b border-border/60 py-4 font-display text-2xl leading-tight transition-colors hover:text-gold sm:text-3xl",
                pathname === link.href && "text-gold",
              )}
            >
              {link.label}
            </Link>
          ))}
          <div className="flex flex-col gap-3 pt-5">
            {userEmail ? (
              <button
                type="button"
                onClick={signOut}
                className="inline-flex items-center justify-center rounded-full bg-gold px-6 py-3 text-eyebrow text-gold-foreground transition-colors hover:bg-gold/85"
              >
                Sign out
              </button>
            ) : (
              <>
                <Link
                  href="/auth/signin"
                  onClick={() => setOpen(false)}
                  className="inline-flex items-center justify-center rounded-full bg-gold px-6 py-3 text-eyebrow text-gold-foreground transition-colors hover:bg-gold/85"
                >
                  Sign in
                </Link>
                <Link
                  href="/auth/signup"
                  onClick={() => setOpen(false)}
                  className="inline-flex items-center justify-center rounded-full border border-gold/40 px-6 py-3 text-eyebrow text-gold transition-colors hover:bg-gold/10"
                >
                  Create account
                </Link>
              </>
            )}
          </div>
        </nav>
      </div>
      {authError ? (
        <p role="status" className="sr-only" aria-live="polite">
          {authError}
        </p>
      ) : null}
    </header>
  );
}
