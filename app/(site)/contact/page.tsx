import type { Metadata } from "next";
import Link from "next/link";
import { PageHeader } from "@/components/site/page-header";
import { Reveal } from "@/components/motion/reveal";
import { ContactForm } from "@/components/contact/contact-form";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "Contact & Location",
  description: `Contact ${site.legalName} at ${site.address.line1}, ${site.address.city} ${site.address.postalCode}. Membership, delivery and event enquiries.`,
  alternates: {
    canonical: "/contact",
  },
};

export default function ContactPage() {
  return (
    <div className="pb-28">
      <PageHeader
        eyebrow="Contact"
        title="Let’s plan the details"
        lead="Contact our team about memberships, deliveries, your account, meetings or private events."
      />

      <div className="mx-auto grid max-w-7xl gap-12 px-5 sm:px-8 lg:grid-cols-2 lg:gap-16">
        <div>
          <Reveal variant="up">
            <h2 className="text-eyebrow text-gold">Visit</h2>
            <address className="mt-5 space-y-1 text-lg not-italic text-foreground/85">
              <p>{site.legalName}</p>
              <p>{site.address.line1}</p>
              <p>{site.address.line2}</p>
              <p>{site.address.city} {site.address.postalCode}</p>
              <p>{site.address.country}</p>
            </address>
          </Reveal>

          <Reveal variant="up" className="mt-10">
            <h2 className="text-eyebrow text-gold">Before your visit</h2>
            <p className="mt-5 text-sm leading-7 text-foreground/75">Please contact the team to confirm visiting arrangements or request a meeting. Meal delivery slots are separate from business visiting hours.</p>
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
              Request a Meeting
            </Link>
          </Reveal>
        </div>

        <Reveal variant="fade" className="flex min-h-[240px] flex-col justify-center rounded-sm border border-border/60 bg-card/30 p-8 sm:p-12">
          <h2 className="font-display text-3xl">Finding us</h2>
          <p className="mt-5 text-sm leading-7 text-foreground/75">An interactive map is not available here yet. Use the address shown, or call our team for directions before travelling.</p>
          <a href={`tel:${site.phone.replace(/\s/g, "")}`} className="mt-6 text-gold underline underline-offset-4">Call for directions</a>
        </Reveal>
      </div>

      <div className="mx-auto mt-24 max-w-2xl px-5 sm:px-8">
        <Reveal variant="up">
          <h2 className="text-eyebrow text-gold">Send a message</h2>
          <p className="lead mt-4 text-base text-foreground/80">
            For general enquiries, press or partnerships, leave us a note and we&apos;ll respond personally. For a private dinner, celebration or business gathering, use our <Link href="/events" className="text-gold underline underline-offset-4">event brief builder</Link> to request a tailored hospitality proposal.
          </p>
        </Reveal>
        <Reveal variant="up" className="mt-10">
          <ContactForm />
        </Reveal>
      </div>
    </div>
  );
}
