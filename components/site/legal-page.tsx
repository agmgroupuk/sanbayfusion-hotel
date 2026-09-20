import type { ReactNode } from "react";
import { PageHeader } from "@/components/site/page-header";
import { Reveal } from "@/components/motion/reveal";

export function LegalPage({
  eyebrow,
  title,
  lead,
  updated,
  children,
}: {
  eyebrow: string;
  title: string;
  lead: string;
  updated: string;
  children: ReactNode;
}) {
  return (
    <div className="pb-28">
      <PageHeader eyebrow={eyebrow} title={title} lead={lead} />
      <div className="mx-auto max-w-3xl px-5 sm:px-8">
        <Reveal variant="up">
          <p className="text-eyebrow text-muted-foreground">Last updated {updated}</p>
        </Reveal>
        <div className="mt-12 space-y-12 text-base leading-8 text-foreground/80 sm:text-lg">
          {children}
        </div>
      </div>
    </div>
  );
}

export function LegalSection({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <section>
      <h2 className="font-display text-3xl text-foreground sm:text-4xl">{title}</h2>
      <div className="mt-4 space-y-4">{children}</div>
    </section>
  );
}