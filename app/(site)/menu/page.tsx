import type { Metadata } from "next";
import Image from "next/image";
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

export const revalidate = 60;

const tableExperiences = [
  ["Tasting Table", "฿3,950 / guest", "Nine courses, served to the whole table. Minimum two guests."],
  ["Chef's Counter", "฿4,950 / guest", "A closer view of the fire and finishing kitchen. Six seats per service."],
  ["Private Dining Room", "From ฿18,000", "A hosted menu for four to eight guests, with a dedicated service team."],
  ["Celebration Table", "From ฿5,500 / guest", "A tailored evening with welcome drinks, cake service, and a keepsake menu."],
  ["Members' Table", "By arrangement", "Priority seating, returning-guest menus, and access to special events."],
] as const;

const foodHighlights = [
  ["Oysters, six pieces", "฿1,200", "Fine de claire, finger lime, fermented chilli mignonette."],
  ["Ember-grilled tiger prawns", "฿980", "Nam jim beurre blanc, young herbs, toasted rice."],
  ["Dry-aged duck breast", "฿1,450", "Lavender honey, fermented cherry, charred onion."],
  ["Heritage vegetable plate", "฿850", "Market vegetables, smoked coconut, herbs, and house ferments."],
  ["Thai cheese & preserve board", "฿780", "Regional cheeses, tropical fruit preserve, and toasted brioche."],
  ["Valrhona chocolate & cherry", "฿520", "Morello cherry, cacao nib, kirsch ice, and tonka cream."],
] as const;

const barLists = [
  {
    title: "Whisky & agave",
    items: [
      ["Thai whisky, house pour", "฿220"],
      ["Blended Scotch whisky", "฿280"],
      ["Single malt whisky", "฿390"],
      ["Japanese whisky", "฿480"],
      ["Reposado tequila or mezcal", "฿420"],
    ],
  },
  {
    title: "Wine & sparkling",
    items: [
      ["House white or red, glass", "฿320"],
      ["Sommelier selection, glass", "฿550"],
      ["Thai natural wine, glass", "฿480"],
      ["House sparkling, glass", "฿420"],
      ["Cellar bottles", "From ฿1,800"],
    ],
  },
  {
    title: "Cocktails",
    items: [
      ["Sanbay Highball", "฿380"],
      ["Chilli & pineapple margarita", "฿420"],
      ["Thai basil gin sour", "฿420"],
      ["Rum old fashioned", "฿420"],
      ["Signature seasonal cocktail", "฿450"],
    ],
  },
  {
    title: "Beer, sake & zero-proof",
    items: [
      ["Thai craft beer", "฿240"],
      ["Imported beer", "฿280"],
      ["Junmai sake, glass", "฿360"],
      ["House fermented soft drink", "฿180"],
      ["Non-alcoholic pairing, guest", "฿1,200"],
    ],
  },
] as const;

function PriceRows({ items }: { items: readonly (readonly [string, string])[] }) {
  return (
    <ul className="divide-y divide-border/50">
      {items.map(([name, price]) => (
        <li key={name} className="flex items-baseline justify-between gap-6 py-3 text-sm">
          <span className="text-foreground/80">{name}</span>
          <span className="shrink-0 text-gold">{price}</span>
        </li>
      ))}
    </ul>
  );
}

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

        <Reveal variant="fade" className="mt-6 flex flex-wrap justify-center gap-x-5 gap-y-2 text-xs text-muted-foreground">
          <span><strong className="text-gold">v</strong> vegetarian</span>
          <span><strong className="text-gold">vg</strong> vegan</span>
          <span><strong className="text-gold">gf</strong> gluten-free</span>
          <span>please confirm allergies with our team</span>
        </Reveal>

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

        <section className="mt-24">
          <Reveal variant="up">
            <p className="text-eyebrow text-gold">Ways to dine</p>
            <h2 className="mt-5 font-display text-4xl font-light sm:text-5xl">Choose your table</h2>
            <p className="mt-5 max-w-2xl text-base leading-relaxed text-foreground/75">
              Every experience is hosted by the same kitchen and built around the
              season. Prices are indicative in Thai baht and confirmed at booking.
            </p>
          </Reveal>
          <Reveal variant="up" className="mt-10 overflow-hidden rounded-sm border border-border/60">
            <div className="divide-y divide-border/50">
              {tableExperiences.map(([name, price, detail]) => (
                <div key={name} className="grid gap-3 p-6 sm:grid-cols-[1fr_auto] sm:items-center sm:p-8">
                  <div>
                    <h3 className="font-display text-2xl font-light italic">{name}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-foreground/70">{detail}</p>
                  </div>
                  <p className="text-lg text-gold sm:text-right">{price}</p>
                </div>
              ))}
            </div>
          </Reveal>
        </section>

        <section className="mt-24">
          <Reveal variant="up">
            <p className="text-eyebrow text-gold">From the kitchen</p>
            <h2 className="mt-5 font-display text-4xl font-light sm:text-5xl">A little more to share</h2>
          </Reveal>
          <div className="mt-10 grid gap-5 sm:grid-cols-2">
            {foodHighlights.map(([name, price, detail], index) => (
              <Reveal key={name} variant="up" delay={index * 0.04}>
                <article className="h-full rounded-sm border border-border/60 bg-card/30 p-6 sm:p-7">
                  <div className="flex items-baseline justify-between gap-5">
                    <h3 className="font-display text-2xl font-light italic">{name}</h3>
                    <span className="shrink-0 text-sm text-gold">{price}</span>
                  </div>
                  <p className="mt-3 text-sm leading-relaxed text-foreground/75">{detail}</p>
                </article>
              </Reveal>
            ))}
          </div>
        </section>

        <section className="mt-24">
          <Reveal variant="up">
            <p className="text-eyebrow text-gold">The bar</p>
            <h2 className="mt-5 font-display text-4xl font-light sm:text-5xl">Spirits, wines & pours</h2>
          </Reveal>
          <div className="mt-10 grid gap-6 md:grid-cols-2">
            {barLists.map((list, index) => (
              <Reveal key={list.title} variant="up" delay={index * 0.04}>
                <article className="rounded-sm border border-border/60 bg-card/30 p-6 sm:p-8">
                  <h3 className="font-display text-3xl font-light italic">{list.title}</h3>
                  <div className="mt-4">
                    <PriceRows items={list.items} />
                  </div>
                </article>
              </Reveal>
            ))}
          </div>
        </section>

        <Reveal variant="fade" className="mt-24 grid gap-4 sm:grid-cols-3">
          {[
            ["/images/fancy-salmon-dish-with-wine-glasses-in-background.jpg", "Wine and the table"],
            ["/images/fire-from-wok.jpg", "The kitchen fire"],
            ["/images/nicely-plated-food-served-at-decorated-table.jpg", "An evening set"],
          ].map(([src, alt]) => (
            <div key={src} className="relative aspect-[4/3] overflow-hidden rounded-sm border border-border/60">
              <Image src={src} alt={alt} fill sizes="(min-width: 640px) 33vw, 100vw" className="object-cover opacity-80" />
            </div>
          ))}
        </Reveal>

        <Reveal variant="fade" className="mt-20 text-center">
          <p className="text-sm text-muted-foreground">
            Menus evolve nightly with the season. Please share allergies, dietary needs,
            or preferences when you book. Prices are in Thai baht and may change with
            availability.
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
