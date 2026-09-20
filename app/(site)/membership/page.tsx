import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Crown, Sparkles, Users, ShieldCheck } from "lucide-react";
import { PageHeader } from "@/components/site/page-header";
import { Reveal } from "@/components/motion/reveal";

export const metadata: Metadata = {
  title: "Membership",
  description:
    "Discover the Sanbay Fusion membership experience — priority reservations, private table access, and elevated hospitality for returning guests.",
  alternates: {
    canonical: "/membership",
  },
};

const membershipHighlights = [
  {
    title: "Priority reservations",
    description: "Members receive preferred access to high-demand evenings, special tasting events, and elevated table windows.",
    icon: Crown,
  },
  {
    title: "Members’ tables",
    description: "Reserved tables and recurring seating options for our most valued guests and regular gatherings.",
    icon: Users,
  },
  {
    title: "Private rooms & lounges",
    description: "Access to private dining moments, intimate room bookings, and tailored hospitality for celebrations and quiet evenings.",
    icon: Sparkles,
  },
  {
    title: "Discreet, elevated service",
    description: "A members-first experience built around attentive hosting, continuity, and a sense of belonging.",
    icon: ShieldCheck,
  },
];

const membershipFormats = [
  {
    name: "Monthly Circle",
    detail: "For guests who like to return often and stay close to the rhythm of the room.",
  },
  {
    name: "Weekly Table",
    detail: "For regulars who want priority access and a more personal rhythm throughout the week.",
  },
  {
    name: "Annual Membership",
    detail: "For loyal diners seeking a more elevated and lasting connection to the house.",
  },
  {
    name: "VIP Host Access",
    detail: "For private dining, special experiences, rooms, and bespoke hospitality moments.",
  },
];

export default function MembershipPage() {
  return (
    <div className="pb-28">
      <PageHeader
        eyebrow="Membership"
        title="A room for returning guests"
        lead="Sanbay Fusion membership is designed for diners who want early access, personal attention, and a more connected relationship to the experience of the house."
      />

      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <div className="grid gap-8 lg:grid-cols-2">
          {membershipHighlights.map(({ title, description, icon: Icon }, index) => (
            <Reveal key={title} variant="up" delay={0.06 * index}>
              <article className="h-full rounded-sm border border-border/60 bg-card/40 p-8">
                <div className="flex h-12 w-12 items-center justify-center rounded-full border border-gold/40 bg-gold/5 text-gold">
                  <Icon className="size-5" />
                </div>
                <h2 className="mt-6 font-display text-3xl font-light italic text-foreground">
                  {title}
                </h2>
                <p className="mt-4 text-base leading-relaxed text-foreground/75">
                  {description}
                </p>
              </article>
            </Reveal>
          ))}
        </div>

        <Reveal variant="up" className="mt-20">
          <div className="rounded-sm border border-border/60 bg-background/50 p-8 sm:p-10">
            <p className="text-eyebrow text-gold">Membership options</p>
            <div className="mt-8 grid gap-6 md:grid-cols-2 xl:grid-cols-4">
              {membershipFormats.map((item) => (
                <div key={item.name} className="rounded-sm border border-border/60 bg-card/30 p-5">
                  <p className="text-eyebrow text-foreground/70">{item.name}</p>
                  <p className="mt-4 text-sm leading-relaxed text-foreground/75">{item.detail}</p>
                </div>
              ))}
            </div>
          </div>
        </Reveal>

        <Reveal variant="fade" className="mt-20 text-center">
          <p className="lead mx-auto max-w-2xl text-foreground/80">
            Membership is about access, continuity, and a more personal hospitality. We welcome guests who wish to return often and enjoy the room in a more considered way.
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
              Contact the House
            </Link>
          </div>
        </Reveal>
      </div>
    </div>
  );
}
