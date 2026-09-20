import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { PageHeader } from "@/components/site/page-header";
import { Reveal } from "@/components/motion/reveal";

export const metadata: Metadata = {
  title: "Pricing",
  description:
    "Indicative pricing for Sanbay Fusion tables, memberships, wine, whisky, cocktails, and other drinks in Thailand.",
  alternates: {
    canonical: "/pricing",
  },
};

const tablePrices = [
  {
    name: "The Tasting Table",
    price: "฿6,500",
    detail: "Nine-course seasonal tasting menu for two guests.",
  },
  {
    name: "The Shared Table",
    price: "฿2,950 / guest",
    detail: "A relaxed shared menu for groups of four or more.",
  },
  {
    name: "Private Table",
    price: "From ฿18,000",
    detail: "A hosted private dining experience for up to eight guests.",
  },
];

const drinkSections = [
  {
    title: "Whisky",
    image: "/images/fire-from-wok.jpg",
    alt: "Fire rising from a wok in the Sanbay Fusion kitchen",
    items: [
      ["Thai whisky, house pour", "฿220"],
      ["Blended Scotch whisky", "฿280"],
      ["Single malt whisky", "฿390"],
      ["Japanese whisky", "฿480"],
      ["Whisky tasting flight, three pours", "฿1,100"],
    ],
  },
  {
    title: "Wine",
    image: "/images/fancy-salmon-dish-with-wine-glasses-in-background.jpg",
    alt: "Plated dish with wine glasses at a dining table",
    items: [
      ["House white or red, glass", "฿320"],
      ["Sommelier selection, glass", "฿550"],
      ["House sparkling, glass", "฿420"],
      ["Cellar selection, bottle", "From ฿1,800"],
      ["Wine pairing, per guest", "฿2,200"],
    ],
  },
  {
    title: "Gin, vodka & rum",
    image: "/images/nicely-plated-food-served-at-decorated-table.jpg",
    alt: "A decorated table prepared for an evening meal",
    items: [
      ["House gin, vodka, or rum", "฿260"],
      ["Premium spirit, neat", "฿420"],
      ["Classic gin and tonic", "฿360"],
      ["Rum old fashioned", "฿420"],
      ["Signature cocktail", "฿450"],
    ],
  },
  {
    title: "Beer & zero-proof",
    image: "/images/scallop.jpg",
    alt: "Hand-dived scallop dish from the seasonal menu",
    items: [
      ["Thai craft beer", "฿240"],
      ["Imported beer", "฿280"],
      ["Non-alcoholic pairing, per guest", "฿1,200"],
      ["House fermented soft drink", "฿180"],
      ["Still or sparkling water", "฿120"],
    ],
  },
];

const membershipPrices = [
  ["Monthly Circle", "฿2,500 / month", "Priority booking and one welcome drink each visit."],
  ["Weekly Table", "฿8,500 / month", "A recurring table window, priority access, and member pricing."],
  ["Annual Membership", "฿28,000 / year", "Priority reservations, seasonal invitations, and hosted benefits."],
  ["VIP Host Access", "By arrangement", "Private dining, events, rooms, and bespoke hospitality."],
];

export default function PricingPage() {
  return (
    <div className="pb-28">
      <PageHeader
        eyebrow="The House List"
        title="A considered way to stay"
        lead="Indicative pricing for the table, the cellar, and the members’ room. All prices are shown in Thai baht and can change with the season, producer, and availability."
      />

      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <Reveal variant="up">
          <div className="border-y border-border/60 py-5 text-sm leading-relaxed text-muted-foreground">
            These are planning prices only. The final menu, drinks list, service charge,
            tax, and any special-event pricing will be confirmed before booking.
          </div>
        </Reveal>

        <section className="mt-20">
          <Reveal variant="up">
            <p className="text-eyebrow text-gold">Tables</p>
            <h2 className="mt-5 font-display text-4xl font-light sm:text-5xl">Choose your evening</h2>
          </Reveal>
          <div className="mt-10 grid gap-6 lg:grid-cols-3">
            {tablePrices.map((item, index) => (
              <Reveal key={item.name} variant="up" delay={index * 0.06}>
                <article className="h-full rounded-sm border border-border/60 bg-card/40 p-7 sm:p-8">
                  <h3 className="font-display text-3xl font-light italic">{item.name}</h3>
                  <p className="mt-7 text-2xl text-gold">{item.price}</p>
                  <p className="mt-4 text-base leading-relaxed text-foreground/75">{item.detail}</p>
                </article>
              </Reveal>
            ))}
          </div>
        </section>

        <section className="mt-24">
          <Reveal variant="up">
            <p className="text-eyebrow text-gold">From the cellar</p>
            <h2 className="mt-5 font-display text-4xl font-light sm:text-5xl">Pour something memorable</h2>
          </Reveal>
          <div className="mt-10 grid gap-8 md:grid-cols-2">
            {drinkSections.map((section, index) => (
              <Reveal key={section.title} variant="up" delay={index * 0.05}>
                <article className="overflow-hidden rounded-sm border border-border/60 bg-card/30">
                  <div className="relative aspect-[16/8]">
                    <Image
                      src={section.image}
                      alt={section.alt}
                      fill
                      sizes="(min-width: 768px) 50vw, 100vw"
                      className="object-cover opacity-80 grayscale-[0.15] transition-transform duration-700 hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-background/20 to-transparent" />
                    <h3 className="absolute bottom-6 left-7 font-display text-3xl font-light italic sm:left-8 sm:text-4xl">
                      {section.title}
                    </h3>
                  </div>
                  <ul className="divide-y divide-border/50 px-7 sm:px-8">
                    {section.items.map(([name, price]) => (
                      <li key={name} className="flex items-baseline justify-between gap-6 py-4 text-sm sm:text-base">
                        <span className="text-foreground/80">{name}</span>
                        <span className="shrink-0 text-gold">{price}</span>
                      </li>
                    ))}
                  </ul>
                </article>
              </Reveal>
            ))}
          </div>
        </section>

        <section className="mt-24">
          <Reveal variant="up">
            <p className="text-eyebrow text-gold">Membership</p>
            <h2 className="mt-5 font-display text-4xl font-light sm:text-5xl">For those who return</h2>
          </Reveal>
          <Reveal variant="up" className="mt-10 overflow-hidden rounded-sm border border-border/60">
            <div className="divide-y divide-border/50">
              {membershipPrices.map(([name, price, detail]) => (
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

        <Reveal variant="fade" className="mt-20 text-center">
          <p className="lead mx-auto max-w-2xl text-base text-foreground/80">
            Ask the team for the current list, dietary details, group arrangements, or
            a tailored drinks recommendation before you book.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
            <Link
              href="/reservations"
              className="inline-flex items-center justify-center rounded-full bg-gold px-7 py-3 text-eyebrow text-gold-foreground transition-transform hover:-translate-y-0.5"
            >
              Reserve a Table
            </Link>
            <Link
              href="/contact"
              className="inline-flex items-center justify-center rounded-full border border-foreground/30 px-7 py-3 text-eyebrow text-foreground transition-colors hover:border-foreground/70"
            >
              Ask the House
            </Link>
          </div>
        </Reveal>
      </div>
    </div>
  );
}