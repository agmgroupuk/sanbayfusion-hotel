import Link from "next/link";
import { ArrowRight, FlaskConical } from "lucide-react";
import { HomeInteractivePreview } from "@/components/home/HomeInteractivePreview";

export function LabsSection() {
  return (
    <section
      id="labs"
      aria-labelledby="labs-heading"
      className="py-16 sm:py-20"
    >
      <div className="mx-auto grid w-full max-w-7xl items-start gap-8 px-5 sm:px-8 lg:grid-cols-[0.72fr_1.28fr] lg:gap-12 lg:px-12">
        <div className="max-w-xl lg:sticky lg:top-28">
          <p className="text-eyebrow text-gold">Labs</p>
          <h2 id="labs-heading" className="mt-4 font-display text-h2 font-light">
            Try an idea with Story Weaver.
          </h2>
          <p className="mt-5 text-muted-foreground">
            Give the existing experiment a premise and genre, then send it to a
            configured AI provider. Results come from the real Labs API; no
            sample output is substituted.
          </p>
          <Link
            href="/labs"
            className="mt-7 inline-flex min-h-11 items-center gap-2 rounded-full border border-gold/40 px-5 py-2.5 text-sm font-medium text-gold transition-colors hover:border-gold/70 hover:bg-gold/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold"
          >
            Explore all Labs
            <ArrowRight size={15} aria-hidden="true" />
          </Link>
        </div>

        <div className="min-w-0 rounded-3xl border border-gold/20 bg-card/55 p-3 shadow-2xl shadow-black/20 sm:p-5">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3 px-1">
            <span className="inline-flex items-center gap-2 text-sm font-medium">
              <FlaskConical className="size-4 text-gold" aria-hidden="true" />
              Story Weaver
            </span>
            <span className="rounded-full border border-gold/20 px-3 py-1 text-xs text-muted-foreground">
              Provider-backed
            </span>
          </div>
          <HomeInteractivePreview kind="lab" />
        </div>
      </div>
    </section>
  );
}
