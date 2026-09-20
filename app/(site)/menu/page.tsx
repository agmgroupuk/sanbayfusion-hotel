import type { Metadata } from "next";
import Link from "next/link";
import { getMenu } from "@/lib/sanity/queries";
import { dietaryLabels, type Dietary } from "@/lib/content/types";
import { PageHeader } from "@/components/site/page-header";
import { Reveal, RevealGroup, RevealItem } from "@/components/motion/reveal";

export const metadata: Metadata = {
  title: "Menu",
  description:
    "The Sanbay Fusion Bar & Restaurant tasting menu — nine courses of fire, precision, and the season's finest produce.",
  alternates: {
    canonical: "/menu",
  },
};

function DietaryTags({ dietary }: { dietary?: Dietary[] }) {
  if (!dietary?.length) return null;
  return (
    <span className="ml-3 inline-flex gap-1.5 align-middle">
      {dietary.map((d) => (
        <span
          key={d}
          title={dietaryLabels[d]}
          className="rounded-full border border-gold/40 px-2 py-0.5 text-[0.6rem] uppercase tracking-widest text-gold/90"
        >
          {d}
        </span>
      ))}
    </span>
  );
}

export default async function MenuPage() {
  const menu = await getMenu();

  return (
    <div className="pb-28">
      <PageHeader eyebrow="The Table" title={menu.title} lead={menu.intro} />

      <div className="mx-auto max-w-3xl px-5 sm:px-8">
        {menu.priceNote && (
          <Reveal variant="fade">
            <p className="border-y border-border/60 py-5 text-center text-sm tracking-wide text-muted-foreground">
              {menu.priceNote}
            </p>
          </Reveal>
        )}

        <div className="mt-16 space-y-20">
          {menu.sections.map((section) => (
            <section key={section.name}>
              <Reveal variant="up">
                <h2 className="text-eyebrow text-muted-foreground">
                  {section.name}
                </h2>
              </Reveal>
              <RevealGroup className="mt-8 divide-y divide-border/50" stagger={0.08}>
                {section.items.map((item) => (
                  <RevealItem
                    key={item.name}
                    variant="up"
                    className="group py-6 transition-transform duration-300 ease-out hover:translate-x-2"
                  >
                    <h3 className="font-display text-h3 font-light italic leading-tight transition-colors duration-300 group-hover:text-gold">
                      {item.name}
                      <DietaryTags dietary={item.dietary} />
                    </h3>
                    {item.description && (
                      <p className="mt-2 text-foreground/85">{item.description}</p>
                    )}
                  </RevealItem>
                ))}
              </RevealGroup>
            </section>
          ))}
        </div>

        {menu.winePairing && (
          <Reveal variant="up" className="mt-24 rounded-sm border border-border/60 bg-card/40 p-8 sm:p-12">
            <h2 className="text-eyebrow text-gold">{menu.winePairing.title}</h2>
            <p className="lead mt-5 text-foreground/85">
              {menu.winePairing.description}
            </p>
          </Reveal>
        )}

        <Reveal variant="fade" className="mt-20 text-center">
          <p className="text-sm text-muted-foreground">
            Menus evolve nightly with the season. Please share any dietary needs
            when you book.
          </p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-4">
            <Link
              href="/reservations"
              className="inline-flex items-center justify-center rounded-full bg-gold px-7 py-3 text-eyebrow text-gold-foreground transition-transform hover:-translate-y-0.5"
            >
              Reserve a Table
            </Link>
            <Link
              href="/membership"
              className="inline-flex items-center justify-center rounded-full border border-foreground/30 px-7 py-3 text-eyebrow text-foreground transition-colors hover:border-foreground/70"
            >
              Membership
            </Link>
          </div>
        </Reveal>
      </div>
    </div>
  );
}
