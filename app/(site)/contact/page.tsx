import type { Metadata } from "next";
import Link from "next/link";
import { PageHeader } from "@/components/site/page-header";
import { Reveal } from "@/components/motion/reveal";
import { ContactForm } from "@/components/contact/contact-form";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "Contact & Location",
  description: `Visit Sanbay Fusion Bar & Restaurant — ${site.address.line1}, ${site.address.line2}. Opening hours, directions, and contact details.`,
  alternates: {
    canonical: "/contact",
  },
};

const mapQuery = encodeURIComponent(
  `${site.address.line1}, ${site.address.line2}`,
);

export default function ContactPage() {
  return (
    <div className="pb-28">
      <PageHeader
        eyebrow="Contact"
        title="Find us after dark"
        lead="Forty seats, one seating. Reservations are essential — we look forward to welcoming you."
      />

      <div className="mx-auto grid max-w-7xl gap-12 px-5 sm:px-8 lg:grid-cols-2 lg:gap-16">
        <div>
          <Reveal variant="up">
            <h2 className="text-eyebrow text-gold">Visit</h2>
            <address className="mt-5 space-y-1 text-lg not-italic text-foreground/85">
              <p>{site.address.line1}</p>
              <p>{site.address.line2}</p>
            </address>
          </Reveal>

          <Reveal variant="up" className="mt-10">
            <h2 className="text-eyebrow text-gold">Hours</h2>
            <ul className="mt-5 divide-y divide-border/50">
              {site.hours.map((h) => (
                <li key={h.days} className="flex items-baseline justify-between py-3">
                  <span className="text-foreground/85">{h.days}</span>
                  <span className="text-muted-foreground">{h.time}</span>
                </li>
              ))}
            </ul>
          </Reveal>

          <Reveal variant="up" className="mt-10">
            <h2 className="text-eyebrow text-gold">Get in touch</h2>
            <div className="mt-5 space-y-2 text-foreground/85">
              <p>
                <a href={`tel:${site.phone.replace(/\s/g, "")}`} className="hover:text-foreground">
                  {site.phone}
                </a>
              </p>
              <p>
                <a href={`mailto:${site.email}`} className="hover:text-foreground">
                  {site.email}
                </a>
              </p>
            </div>
            <Link
              href="/reservations"
              className="mt-8 inline-flex items-center justify-center rounded-full bg-gold px-7 py-3 text-eyebrow text-gold-foreground transition-transform hover:-translate-y-0.5"
            >
              Reserve a Table
            </Link>
          </Reveal>
        </div>

        <Reveal variant="fade" className="min-h-[360px] overflow-hidden rounded-sm border border-border/60">
          <iframe
            title={`Map to ${site.name}`}
            src={`https://maps.google.com/maps?q=${mapQuery}&t=&z=14&ie=UTF8&iwloc=&output=embed`}
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            className="h-full min-h-[360px] w-full grayscale-[0.4] contrast-110"
          />
        </Reveal>
      </div>

      <div className="mx-auto mt-24 max-w-2xl px-5 sm:px-8">
        <Reveal variant="up">
          <h2 className="text-eyebrow text-gold">Send a message</h2>
          <p className="lead mt-4 text-base text-foreground/80">
            For private dining, press, partnerships, or any other enquiry, leave
            us a note and we&apos;ll respond personally.
          </p>
        </Reveal>
        <Reveal variant="up" className="mt-10">
          <ContactForm />
        </Reveal>
      </div>
    </div>
  );
}
