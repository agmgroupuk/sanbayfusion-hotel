"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import { useLenis } from "lenis/react";
import { ChevronLeft, ChevronRight, Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Magnetic } from "@/components/motion/magnetic";
import { navLinks, site } from "@/lib/site";

const EASE = [0.16, 1, 0.3, 1] as const;

type SignOutAction = () => Promise<void>;

export function SiteNav({ authenticated, onSignOut }: { authenticated: boolean; onSignOut: SignOutAction }) {
  const pathname = usePathname();
  const accountAction = !authenticated
    ? { label: "Join Now", href: "/signup" }
    : pathname === "/dashboard"
      ? { label: "Website", href: "/" }
      : { label: "Dashboard", href: "/dashboard" };
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const lenis = useLenis();
  const overlayRef = useRef<HTMLDivElement>(null);
  const toggleRef = useRef<HTMLButtonElement>(null);
  const desktopNavRef = useRef<HTMLDivElement>(null);
  const resumeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const desktopPausedRef = useRef(false);

  function pauseDesktopMovement() {
    if (resumeTimerRef.current) clearTimeout(resumeTimerRef.current);
    desktopPausedRef.current = true;
  }

  function resumeDesktopMovement() {
    if (resumeTimerRef.current) clearTimeout(resumeTimerRef.current);
    resumeTimerRef.current = setTimeout(() => { desktopPausedRef.current = false; }, 700);
  }

  function scrollDesktopNav(direction: number) {
    pauseDesktopMovement();
    desktopNavRef.current?.scrollBy({ left: direction * 180, behavior: "smooth" });
    resumeDesktopMovement();
  }

  useEffect(() => {
    const nav = desktopNavRef.current;
    if (!nav) return;
    const active = nav.querySelector<HTMLElement>(`[data-nav-path="${CSS.escape(pathname)}"]`);
    active?.scrollIntoView({ block: "nearest", inline: "center" });
  }, [pathname]);

  useEffect(() => {
    const nav = desktopNavRef.current;
    if (!nav) return;
    let animationFrame = 0;
    let last = performance.now();
    const onEnter = () => { desktopPausedRef.current = true; };
    const onLeave = () => { desktopPausedRef.current = false; last = performance.now(); };
    const move = (now: number) => {
      const elapsed = now - last;
      last = now;
      if (!desktopPausedRef.current && document.visibilityState === "visible") {
        nav.scrollLeft += elapsed * 0.018;
        if (nav.scrollLeft >= nav.scrollWidth / 2) nav.scrollLeft = 0;
      }
      animationFrame = requestAnimationFrame(move);
    };
    nav.addEventListener("pointerenter", onEnter);
    nav.addEventListener("pointerleave", onLeave);
    nav.addEventListener("focusin", onEnter);
    nav.addEventListener("focusout", onLeave);
    animationFrame = requestAnimationFrame(move);
    return () => {
      cancelAnimationFrame(animationFrame);
      nav.removeEventListener("pointerenter", onEnter);
      nav.removeEventListener("pointerleave", onLeave);
      nav.removeEventListener("focusin", onEnter);
      nav.removeEventListener("focusout", onLeave);
      if (resumeTimerRef.current) clearTimeout(resumeTimerRef.current);
    };
  }, []);

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
        open
          ? "bg-background text-gold"
          : scrolled
          ? "border-b border-border/60 bg-background/80 backdrop-blur-md"
          : "border-b border-transparent bg-transparent",
      )}
    >
      <nav className="mx-auto flex h-16 max-w-7xl items-center justify-between px-5 sm:h-20 sm:px-8">
        <Link
          href="/"
          className="relative block h-8 w-36 transition-opacity hover:opacity-80 sm:h-10 sm:w-44"
          onClick={() => setOpen(false)}
        >
          <Image src="/brand/sanbayfusion-logo.webp" alt={site.name} fill sizes="(min-width: 640px) 176px, 144px" className="object-contain object-left" />
        </Link>

        <div className="hidden min-w-0 items-center gap-2 md:flex">
          <button type="button" aria-label="Scroll navigation left" onClick={() => scrollDesktopNav(-1)} className="flex size-8 shrink-0 items-center justify-center rounded-full border border-foreground/20 text-foreground transition-colors hover:border-gold hover:text-gold"><ChevronLeft className="size-4" /></button>
          <div ref={desktopNavRef} className="flex max-w-[min(42vw,32rem)] min-w-0 snap-x gap-7 overflow-x-auto scroll-smooth px-2 py-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden" onPointerDown={pauseDesktopMovement} onPointerUp={resumeDesktopMovement}>
            {[...navLinks, ...navLinks].map((link, index) => <div key={`${link.href}-${index}`} className="shrink-0"><Link data-nav-path={link.href} href={link.href} className={cn("group relative block whitespace-nowrap text-sm transition-colors", pathname === link.href ? "text-gold" : "text-foreground/85 hover:text-gold")}><span>{link.label}</span><span className={cn("absolute -bottom-1.5 left-0 h-px w-full origin-left bg-gold transition-transform duration-300 ease-out", pathname === link.href ? "scale-x-100" : "scale-x-0 group-hover:scale-x-100")} /></Link></div>)}
          </div>
          <button type="button" aria-label="Scroll navigation right" onClick={() => scrollDesktopNav(1)} className="flex size-8 shrink-0 items-center justify-center rounded-full border border-foreground/20 text-foreground transition-colors hover:border-gold hover:text-gold"><ChevronRight className="size-4" /></button>
          <Magnetic strength={0.4}><Link href={accountAction.href} className="inline-flex rounded-full bg-gold px-5 py-2 text-eyebrow text-gold-foreground transition-colors hover:bg-gold/85">{accountAction.label}</Link></Magnetic>
          {authenticated && <form action={onSignOut}><button type="submit" className="inline-flex rounded-full border border-foreground/30 px-4 py-2 text-eyebrow transition-colors hover:border-gold hover:text-gold">Sign Out</button></form>}
        </div>

        <button
          ref={toggleRef}
          type="button"
          aria-label={open ? "Close menu" : "Open menu"}
          aria-expanded={open}
          aria-controls="mobile-menu"
          onClick={() => setOpen((v) => !v)}
          className="-mr-2 inline-flex h-10 w-10 items-center justify-center text-gold md:hidden"
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
            className="fixed inset-x-0 top-16 z-40 max-h-[calc(100dvh-4rem)] overflow-y-auto bg-background text-foreground md:hidden"
          >
            <div className="flex min-h-full flex-col gap-1 px-5 py-5 sm:px-8 sm:py-8">
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
                    className={cn("block border-b border-border/60 py-3.5 font-display text-2xl leading-tight transition-colors hover:text-gold sm:py-4 sm:text-3xl", pathname === link.href && "text-gold")}
                  >
                    {link.label}
                  </Link>
                </motion.div>
              ))}
              <Link href={accountAction.href} onClick={() => setOpen(false)} className="mt-4 inline-flex items-center justify-center rounded-full bg-gold px-6 py-3.5 text-eyebrow text-gold-foreground transition-colors hover:bg-gold/85">{accountAction.label}</Link>
              {authenticated && <form action={onSignOut}><button type="submit" className="mt-2 inline-flex items-center justify-center rounded-full border border-gold/60 px-6 py-3.5 text-eyebrow text-gold transition-colors hover:bg-gold/10">Sign Out</button></form>}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.header>
  );
}
