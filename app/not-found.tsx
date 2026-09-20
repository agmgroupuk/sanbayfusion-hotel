import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { KenBurns } from "@/components/motion/ken-burns";
import { Reveal } from "@/components/motion/reveal";
import { SiteFooter } from "@/components/site/site-footer";
import { SiteNav } from "@/components/site/site-nav";

export const metadata: Metadata = {
  title: "Page Not Found",
  description: "The page you're looking for doesn't exist.",
};

export default function NotFound() {
  return (
    <>
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[60] focus:rounded-full focus:bg-gold focus:px-4 focus:py-2 focus:text-eyebrow focus:text-gold-foreground"
      >
        Skip to content
      </a>
      <SiteNav />
      <main id="main" className="flex-1">
        <section className="relative w-full">
          <KenBurns
            className="h-[100svh] min-h-[640px] w-full"
            duration={26}
            from={{ scale: 1.04, x: "0%", y: "0%" }}
            to={{ scale: 1.14, x: "0.5%", y: "-1.5%" }}
          >
            <Image
              src="/images/outdoors-of-the-restaurant.jpg"
              alt="The exterior of Sanbay Fusion Bar & Restaurant at dusk"
              fill
              priority
              sizes="100vw"
              className="object-cover"
            />
          </KenBurns>

          <div className="absolute inset-0 overlay-cinematic" />

          <div className="absolute inset-0 z-10 mx-auto flex h-full max-w-7xl flex-col items-center justify-center px-5 text-center sm:px-8">
            <Reveal variant="fade" duration={1} className="text-eyebrow text-gold">
              404
            </Reveal>
            <Reveal variant="blur" duration={1} delay={0.1}>
              <h1 className="mt-5 font-display text-h1 font-light">
                Not on tonight&apos;s menu.
              </h1>
            </Reveal>
            <Reveal variant="fade" duration={1} delay={0.2}>
              <p className="lead measure mt-5 max-w-md">
                The page you&apos;re looking for isn&apos;t served here.
                Let&apos;s get you back to the table.
              </p>
            </Reveal>
            <Reveal variant="up" duration={1} delay={0.3}>
              <div className="mt-9 flex flex-wrap items-center justify-center gap-4">
                <Link
                  href="/"
                  className="inline-flex items-center justify-center rounded-full bg-gold px-7 py-3 text-eyebrow text-gold-foreground transition-transform hover:-translate-y-0.5"
                >
                  Return Home
                </Link>
                <Link
                  href="/menu"
                  className="inline-flex items-center justify-center rounded-full border border-foreground/30 px-7 py-3 text-eyebrow text-foreground transition-colors hover:border-foreground/70"
                >
                  View the Menu
                </Link>
              </div>
            </Reveal>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
