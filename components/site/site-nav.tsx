"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "motion/react";
import { useLenis } from "lenis/react";
import { Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Magnetic } from "@/components/motion/magnetic";
import { navLinks, site } from "@/lib/site";

const EASE = [0.16, 1, 0.3, 1] as const;

function NavLink({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className="group relative text-sm text-foreground/85 transition-colors hover:text-foreground"
    >
      {label}
      <span className="absolute -bottom-1.5 left-0 h-px w-full origin-left scale-x-0 bg-gold transition-transform duration-300 ease-out group-hover:scale-x-100" />
    </Link>
  );
}

export function SiteNav() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const lenis = useLenis();
  const overlayRef = useRef<HTMLDivElement>(null);
  const toggleRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    // Lock the page behind the mobile menu. Lenis drives scroll on its own
    // loop, so body overflow alone won't hold it — stop/start Lenis too.
    document.body.style.overflow = open ? "hidden" : "";
    if (open) lenis?.stop();
    else lenis?.start();
    return () => {
      document.body.style.overflow = "";
      lenis?.start();
    };
  }, [open, lenis]);

  // While the drawer is open, keep keyboard focus inside it: move focus in on
  // open, close on Escape, trap Tab, and restore focus to the toggle on close.
  useEffect(() => {
    if (!open) return;
    const overlay = overlayRef.current;
    const previouslyFocused = toggleRef.current;
    const focusables = () =>
      Array.from(
        overlay?.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled])',
        ) ?? [],
      );
    focusables()[0]?.focus();

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        return;
      }
      if (e.key !== "Tab") return;
      const items = focusables();
      if (items.length === 0) return;
      const first = items[0];
      const last = items[items.length - 1];
      const active = document.activeElement;
      if (e.shiftKey && active === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && active === last) {
        e.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      previouslyFocused?.focus();
    };
  }, [open]);

  return (
    <motion.header
      initial={{ y: -28, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.8, ease: EASE, delay: 0.1 }}
      className={cn(
        "fixed inset-x-0 top-0 z-50 transition-colors duration-500",
        scrolled
          ? "border-b border-border/60 bg-background/80 backdrop-blur-md"
          : "border-b border-transparent bg-transparent",
      )}
    >
      <nav className="mx-auto flex h-16 max-w-7xl items-center justify-between px-5 sm:h-20 sm:px-8">
        <Link
          href="/"
          className="font-display text-xl tracking-tight text-foreground transition-opacity hover:opacity-80 sm:text-2xl"
          onClick={() => setOpen(false)}
        >
          {site.name}
        </Link>

        <div className="hidden items-center gap-10 md:flex">
          {navLinks.map((link) => (
            <NavLink key={link.href} href={link.href} label={link.label} />
          ))}
          <Magnetic strength={0.4}>
            <Link
              href="/reservations"
              className="inline-flex rounded-full border border-gold/60 px-5 py-2 text-eyebrow text-gold transition-colors hover:bg-gold hover:text-gold-foreground"
            >
              Reserve
            </Link>
          </Magnetic>
        </div>

        <button
          ref={toggleRef}
          type="button"
          aria-label={open ? "Close menu" : "Open menu"}
          aria-expanded={open}
          aria-controls="mobile-menu"
          onClick={() => setOpen((v) => !v)}
          className="-mr-2 inline-flex h-10 w-10 items-center justify-center text-foreground md:hidden"
        >
          {open ? <X className="size-5" /> : <Menu className="size-5" />}
        </button>
      </nav>

      <AnimatePresence>
        {open && (
          <motion.div
            ref={overlayRef}
            id="mobile-menu"
            role="dialog"
            aria-modal="true"
            aria-label="Menu"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 top-16 z-40 bg-background/98 backdrop-blur-xl md:hidden"
          >
            <div className="flex flex-col gap-2 px-6 py-10">
              {navLinks.map((link, i) => (
                <motion.div
                  key={link.href}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.06 * i + 0.05, ease: EASE }}
                >
                  <Link
                    href={link.href}
                    onClick={() => setOpen(false)}
                    className="block border-b border-border/50 py-5 font-display text-4xl"
                  >
                    {link.label}
                  </Link>
                </motion.div>
              ))}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.06 * navLinks.length + 0.05, ease: EASE }}
              >
                <Link
                  href="/reservations"
                  onClick={() => setOpen(false)}
                  className="mt-6 inline-flex items-center justify-center rounded-full bg-gold px-6 py-4 text-eyebrow text-gold-foreground"
                >
                  Reserve a Table
                </Link>
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.header>
  );
}
