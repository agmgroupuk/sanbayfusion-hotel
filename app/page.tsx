import Link from "next/link";
import { site } from "@/lib/site";
import { Card } from "@/components/ui/card";

export default function HomePage() {
  return (
    <div className="relative isolate overflow-hidden">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_72%_24%,oklch(0.34_0.04_78_/_0.18),transparent_48%),linear-gradient(135deg,transparent_45%,oklch(1_0_0_/_0.025))]"
      />
      <section className="mx-auto flex min-h-[65svh] w-full max-w-7xl flex-col justify-center px-5 py-20 sm:px-8 lg:px-12">
        <p className="text-eyebrow text-gold">{site.legalName}</p>
        <h1 className="mt-6 max-w-5xl font-display text-display font-light">
          Sanbay
          <br />
          Fusion
        </h1>
        <p className="lead mt-7 max-w-2xl text-foreground/75">
          A unified home for Agents, Tools, and Labs.
        </p>
        <div className="mt-10 flex flex-wrap gap-4">
          <Link
            href="/agents"
            className="inline-flex rounded-full bg-gold px-7 py-3 text-eyebrow text-gold-foreground shadow-lg shadow-black/20 transition-all hover:-translate-y-0.5 hover:bg-gold/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          >
            Explore platform
          </Link>
          <Link
            href="/auth/signup"
            className="inline-flex rounded-full border border-gold/40 px-7 py-3 text-eyebrow text-gold transition-colors hover:bg-gold/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold"
          >
            Create account
          </Link>
        </div>
      </section>

      <section
        aria-label="Platform applications"
        className="mx-auto grid w-full max-w-7xl gap-5 px-5 pb-24 sm:px-8 md:grid-cols-3 lg:px-12"
      >
        {[
          {
            href: "/agents",
            label: "Agents",
            description: "Converse with the supplied AI agent collection.",
          },
          {
            href: "/tools",
            label: "Tools",
            description: "Use live network and developer utilities.",
          },
          {
            href: "/labs",
            label: "Labs",
            description: "Run AI experiments backed by configured providers.",
          },
        ].map((item) => (
          <Link href={item.href} key={item.href} className="group">
            <Card className="h-full p-6 transition-colors group-hover:border-gold/60 sm:p-8">
              <p className="text-eyebrow text-gold">Platform</p>
              <h2 className="mt-5 font-display text-h3">{item.label}</h2>
              <p className="mt-4 text-sm text-muted-foreground">
                {item.description}
              </p>
            </Card>
          </Link>
        ))}
      </section>
    </div>
  );
}
