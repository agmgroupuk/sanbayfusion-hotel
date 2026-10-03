import Link from "next/link";
import { ArrowRight, LockKeyhole } from "lucide-react";
import { Card } from "@/components/ui/card";
import { TOOLS } from "@/app/tools/tools";

export const metadata = {
  title: "Tools",
  description: "Private, browser-based developer utilities.",
};

export default function ToolsPage() {
  return (
    <div className="relative isolate overflow-hidden">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_70%_15%,oklch(0.34_0.04_78_/_0.18),transparent_48%)]"
      />
      <section className="mx-auto w-full max-w-7xl px-5 pb-16 pt-14 sm:px-8 sm:pt-20 lg:px-12">
        <p className="text-eyebrow text-gold">Sanbay utilities</p>
        <h1 className="mt-4 font-display text-h1 font-light">Tools</h1>
        <div className="mt-6 flex max-w-3xl items-start gap-3 text-muted-foreground">
          <LockKeyhole className="mt-1 size-5 shrink-0 text-gold" aria-hidden="true" />
          <p>
            Handy developer utilities that run in your browser. Your input stays
            on this device; these tools do not send it to a server.
          </p>
        </div>
      </section>

      <section
        aria-label="Available browser tools"
        className="mx-auto grid w-full max-w-7xl gap-4 px-5 pb-24 sm:px-8 sm:grid-cols-2 lg:grid-cols-3 lg:px-12"
      >
        {TOOLS.map((tool) => {
          const Icon = tool.icon;
          return (
            <Link
              href={`/tools/${tool.slug}`}
              key={tool.slug}
              className="group rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            >
              <Card className="h-full p-6 transition-colors group-hover:border-gold/60 sm:p-7">
                <div className="flex items-start justify-between gap-4">
                  <span className="grid size-11 place-items-center rounded-lg border border-gold/25 bg-gold/10 text-gold">
                    <Icon className="size-5" aria-hidden="true" />
                  </span>
                  <ArrowRight
                    className="mt-1 size-4 text-muted-foreground transition-transform group-hover:translate-x-1 group-hover:text-gold"
                    aria-hidden="true"
                  />
                </div>
                <h2 className="mt-6 font-display text-xl">{tool.title}</h2>
                <p className="mt-2 text-sm text-muted-foreground">
                  {tool.description}
                </p>
                <p className="mt-5 text-xs text-gold">Runs locally in your browser</p>
              </Card>
            </Link>
          );
        })}
      </section>
    </div>
  );
}
