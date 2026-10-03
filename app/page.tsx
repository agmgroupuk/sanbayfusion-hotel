import Link from "next/link";
import { site } from "@/lib/site";

export default function HomePage() {
  return (
    <section className="relative isolate flex min-h-[calc(100svh-5rem)] items-center overflow-hidden px-5 py-20 sm:px-8 lg:px-12">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_75%_45%,oklch(0.34_0.04_78_/_0.16),transparent_52%),linear-gradient(135deg,transparent_45%,oklch(1_0_0_/_0.025))]"
      />
      <div className="mx-auto w-full max-w-7xl">
        <p className="text-eyebrow text-gold">{site.legalName}</p>
        <h1 className="mt-6 max-w-5xl font-display text-display font-light">
          Sanbay
          <br />
          Fusion
        </h1>
        <p className="lead mt-7 max-w-xl text-foreground/75">
          Digital platform shell
        </p>
        <Link
          href="/apps"
          className="mt-10 inline-flex rounded-full bg-gold px-7 py-3 text-eyebrow text-gold-foreground shadow-lg shadow-black/20 transition-all hover:-translate-y-0.5 hover:bg-gold/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2 focus-visible:ring-offset-background"
        >
          Applications
        </Link>
      </div>
    </section>
  );
}
