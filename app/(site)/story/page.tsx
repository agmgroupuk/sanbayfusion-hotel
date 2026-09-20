import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { getStory } from "@/lib/sanity/queries";
import { PageHeader } from "@/components/site/page-header";
import { PortableText } from "@/components/portable-text";
import { Reveal } from "@/components/motion/reveal";
import { Parallax } from "@/components/motion/parallax";

export const metadata: Metadata = {
  title: "Our Story",
  description:
    "The story behind Sanbay Fusion Bar & Restaurant — a warm, modern room built on fire, precision, and the people who grow, fish, and forage for us.",
  alternates: {
    canonical: "/story",
  },
};

export default async function StoryPage() {
  const story = await getStory();

  return (
    <div className="pb-28">
      <PageHeader eyebrow="Our Story" title="A room of our own" lead={story.intro} />

      <div className="mx-auto grid max-w-7xl gap-12 px-5 sm:px-8 lg:grid-cols-[0.95fr_1.05fr] lg:gap-20">
        {story.portrait && (
          <Parallax speed={0.25} className="group aspect-[4/5] w-full overflow-hidden rounded-sm">
            <div className="relative h-[115%] w-full">
              <Image
                src={story.portrait.src}
                alt={story.portrait.alt ?? story.chefName}
                fill
                sizes="(min-width: 1024px) 45vw, 100vw"
                className="object-cover transition-transform duration-[1200ms] ease-out group-hover:scale-[1.05]"
              />
            </div>
          </Parallax>
        )}

        <div className="lg:pt-6">
          <Reveal variant="up">
            <PortableText value={story.body} />
          </Reveal>

          <Reveal variant="fade" className="mt-10 border-t border-border/60 pt-6">
            <p className="font-display text-2xl italic">{story.chefName}</p>
            <p className="text-eyebrow mt-2 text-muted-foreground">{story.role}</p>
          </Reveal>

          {story.accolades?.length ? (
            <Reveal variant="up" className="mt-10">
              <ul className="flex flex-wrap gap-3">
                {story.accolades.map((a) => (
                  <li
                    key={a}
                    className="rounded-full border border-gold/40 px-4 py-2 text-xs tracking-wide text-gold/90"
                  >
                    {a}
                  </li>
                ))}
              </ul>
            </Reveal>
          ) : null}
        </div>
      </div>

      <Reveal variant="fade" className="mx-auto mt-24 max-w-3xl px-5 text-center sm:px-8">
        <p className="lead">Come and taste it for yourself.</p>
        <Link
          href="/reservations"
          className="mt-6 inline-flex items-center justify-center rounded-full bg-gold px-7 py-3 text-eyebrow text-gold-foreground transition-transform hover:-translate-y-0.5"
        >
          Reserve a Table
        </Link>
      </Reveal>
    </div>
  );
}
