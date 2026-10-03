"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { navLinks, site } from "@/lib/site";

export function SiteNav() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [open]);

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
            href="/apps"
            className="inline-flex rounded-full bg-gold px-5 py-2 text-eyebrow text-gold-foreground shadow-sm shadow-background/40 transition-all hover:-translate-y-0.5 hover:bg-gold/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          >
            Open platform
          </Link>
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
          <Link
            href="/apps"
            onClick={() => setOpen(false)}
            className="mt-5 inline-flex items-center justify-center rounded-full bg-gold px-6 py-3 text-eyebrow text-gold-foreground transition-colors hover:bg-gold/85"
          >
            Open platform
          </Link>
        </nav>
      </div>
    </header>
  );
}
