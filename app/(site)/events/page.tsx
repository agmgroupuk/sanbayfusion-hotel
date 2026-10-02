import { SocialLinks } from "@/components/site/social-links";
import { pageMetadata } from "@/lib/seo";
import Image from "next/image";
import Link from "next/link";
import { ArrowDownRight, ArrowUpRight } from "lucide-react";
import { EventBookingForm } from "@/components/events/event-booking-form";
import { Reveal } from "@/components/motion/reveal";
import { site } from "@/lib/site";

export const metadata = pageMetadata("/events");
const occasions = [
  ["Private Dinners", "A considered menu. A table of your own."],
  ["Birthday Celebrations", "An occasion shaped around the person at its heart."],
  ["Anniversaries", "Time together, with the details thoughtfully arranged."],
  ["Engagements", "A personal setting for the beginning of a new chapter."],
  ["Family Gatherings", "Different generations. One shared occasion."],
  ["Villa & Residence Events", "Hospitality planned around the place you are staying."],
  ["Corporate Gatherings", "Food, service and production around your business agenda."],
  ["Business Dinners", "Space for conversation, with the hospitality considered."],
  ["Holiday Celebrations", "Bring your guests together while you are in Thailand."],
  ["Bespoke Private Occasions", "Start with an idea. Let us explore the possibilities."],
];
const nextSteps = [
  ["01", "Share Your Vision", "Tell us about the occasion, guests, location and requirements."],
  ["02", "Personal Review", "Our team reviews the complete event brief and contacts you where clarification is required."],
  ["03", "Receive Your Proposal", "Once requirements and availability have been reviewed, we prepare the applicable event proposal and next steps."],
];
const pricingFactors = ["Guest count", "Menu", "Location", "Staffing", "Duration", "Equipment", "Entertainment", "Transport & logistics", "Special requests", "Taxes & applicable service charges"];

export default function EventsPage() {
  return <div className="pb-24 sm:pb-32">
    <header className="relative isolate overflow-hidden border-b border-border/50">
      <div className="absolute inset-0 -z-20"><Image src="/images/events-private-dining.webp" unoptimized alt="An elegantly set dining table, inspiration for a private occasion" fill priority sizes="100vw" className="object-cover object-center" /></div>
      <div className="absolute inset-0 -z-10 bg-gradient-to-r from-background/95 via-background/85 to-background/35" /><div className="absolute inset-0 -z-10 bg-gradient-to-t from-background via-transparent to-background/35" />
      <div className="mx-auto max-w-7xl px-5 pb-14 pt-36 sm:px-8 sm:pb-20 sm:pt-48 lg:pb-24">
        <p className="max-w-xl text-xs uppercase leading-6 tracking-[0.23em] text-gold">Private Events &amp; Bespoke Hospitality</p>
        <h1 className="mt-7 max-w-4xl font-display text-[clamp(3.4rem,7.5vw,7rem)] font-light leading-[0.98] tracking-[-0.035em]">Your occasion.<br /><span className="italic text-gold">Thoughtfully arranged.</span></h1>
        <p className="mt-8 max-w-xl text-base leading-8 text-foreground/85 sm:text-lg">From private dinners and villa celebrations to birthdays, corporate gatherings and special occasions, Sanbay Fusion coordinates tailored event experiences around your guests, location and schedule in Thailand.</p>
        <p className="mt-4 max-w-xl text-sm leading-7 text-foreground/70">Plan in advance, share your requirements, and let our team prepare a tailored proposal for your occasion.</p>
        <div className="mt-9 flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:gap-7"><a href="#event-builder" className="inline-flex min-h-12 items-center justify-center gap-4 rounded-full bg-gold px-7 py-4 text-xs font-medium uppercase tracking-[0.15em] text-gold-foreground">Build Your Event<ArrowDownRight size={17} aria-hidden="true" /></a><a href="#events-contact" className="inline-flex min-h-12 items-center gap-3 text-sm underline decoration-gold/50 underline-offset-8">Speak With Our Events Team<ArrowUpRight size={16} aria-hidden="true" /></a></div>
        <p className="mt-12 max-w-3xl border-t border-gold/25 pt-6 text-xs leading-7 tracking-wide text-foreground/65">Private gatherings <span className="px-2 text-gold">•</span> Villas <span className="px-2 text-gold">•</span> Residences <span className="px-2 text-gold">•</span> Offices <span className="px-2 text-gold">•</span> Selected venues</p>
      </div>
    </header>

    <section className="mx-auto max-w-7xl px-5 py-20 sm:px-8 sm:py-28" aria-labelledby="occasions-title">
      <Reveal variant="up" className="grid gap-7 lg:grid-cols-[1fr_0.8fr] lg:items-end"><div><p className="text-eyebrow text-gold">An occasion of your own</p><h2 id="occasions-title" className="mt-5 max-w-xl font-display text-4xl font-light leading-tight sm:text-5xl">A gathering.<br /><span className="italic">A reason to remember.</span></h2></div><p className="max-w-lg text-sm leading-8 text-muted-foreground">For international visitors, private groups, families and business travellers, the best starting point is your occasion. We consider catering, beverages, service requirements and entertainment together, with every arrangement subject to review.</p></Reveal>
      <div className="mt-12 grid gap-x-10 sm:grid-cols-2 lg:gap-x-16">{occasions.map(([title, description], index) => <article key={title} className="group flex gap-5 border-t border-border/70 py-6 sm:py-7"><span className="pt-1 text-xs text-gold/70">{String(index + 1).padStart(2, "0")}</span><div><h3 className="font-display text-2xl sm:text-3xl">{title}</h3><p className="mt-2 text-sm leading-7 text-muted-foreground">{description}</p></div></article>)}</div>
    </section>

    <section className="border-y border-border/60 bg-card/25" aria-labelledby="arrival-title"><div className="mx-auto grid max-w-7xl gap-10 px-5 py-16 sm:px-8 sm:py-24 lg:grid-cols-[0.85fr_1.15fr] lg:items-center lg:gap-20">
      <div className="relative aspect-[4/3] overflow-hidden lg:aspect-[4/5]"><Image src="/images/fancy-salmon-dish-with-wine-glasses-in-background.jpg" alt="A carefully presented dish in an intimate dining setting" fill sizes="(min-width: 1024px) 40vw, 100vw" className="object-cover" /><div className="absolute inset-0 bg-gradient-to-t from-background/55 to-transparent" /><p className="absolute bottom-6 left-6 max-w-xs font-display text-3xl italic">Arrive with more already considered.</p></div>
      <div><p className="text-xs uppercase leading-6 tracking-[0.2em] text-gold">Planning your occasion before you arrive?</p><h2 id="arrival-title" className="mt-5 font-display text-4xl font-light leading-tight sm:text-5xl">Begin the conversation<br /><span className="italic">from wherever you are.</span></h2><p className="mt-7 text-base leading-8 text-foreground/75">Your event can begin taking shape before you land in Thailand. Alongside accommodation and travel, share your hospitality requirements so our team can review the complete brief and coordinate a proposal before the occasion.</p><ul className="mt-7 grid grid-cols-2 gap-x-5 gap-y-3 text-sm text-muted-foreground">{["Travel dates", "Event date", "Location", "Number of guests", "Food preferences", "Beverage requirements", "Entertainment", "Special requests"].map(item => <li key={item} className="border-t border-border/60 pt-3">{item}</li>)}</ul><p className="mt-7 text-sm leading-7 text-muted-foreground">Whether you are arranging a family visit, a private stay or a business trip, we will review the location, logistics and service needs with you. You can also enquire while you are already in Thailand.</p></div>
    </div></section>

    <section id="event-builder" className="mx-auto max-w-7xl scroll-mt-24 px-5 py-20 sm:px-8 sm:py-28" aria-labelledby="builder-title">
      <div className="mb-10 grid gap-6 lg:grid-cols-[1fr_0.8fr]"><div><p className="text-eyebrow text-gold">Your occasion, in seven steps</p><h2 id="builder-title" className="mt-5 font-display text-4xl font-light sm:text-6xl">Build your <span className="italic">event brief.</span></h2></div><p className="max-w-lg self-end text-sm leading-8 text-muted-foreground">Share a direction, not a finished plan. Your selections help us understand what matters to you. This is an enquiry for a tailored proposal, with no instant booking, fixed quotation or payment.</p></div>
      <EventBookingForm />
    </section>

    <section className="mx-auto max-w-7xl px-5 sm:px-8" aria-labelledby="next-title"><p className="text-eyebrow text-gold">What happens next</p><h2 id="next-title" className="mt-5 font-display text-4xl font-light sm:text-5xl">From an idea <span className="italic">to a considered proposal.</span></h2><div className="mt-12 grid gap-8 md:grid-cols-3">{nextSteps.map(([number, title, description]) => <article key={number} className="border-t border-gold/40 pt-6"><p className="font-display text-4xl font-light text-gold/60">{number}</p><h3 className="mt-5 font-display text-2xl sm:text-3xl">{title}</h3><p className="mt-4 text-sm leading-8 text-muted-foreground">{description}</p></article>)}</div><p className="mt-10 max-w-4xl text-sm leading-8 text-muted-foreground">Our review covers availability, location, guest count, logistics, food requirements, staffing, entertainment, applicable beverage requirements and special arrangements. Submitting the brief does not confirm an event or guarantee availability. Your proposal sets out the applicable arrangements and next steps.</p></section>

    <section className="mx-auto my-20 grid max-w-7xl gap-8 px-5 sm:my-28 sm:px-8 lg:grid-cols-2 lg:gap-20" aria-labelledby="bespoke-title"><div><p className="text-eyebrow text-gold">Bespoke by nature</p><h2 id="bespoke-title" className="mt-5 font-display text-4xl font-light leading-tight sm:text-5xl">No two occasions<br /><span className="italic">ask for the same thing.</span></h2><p className="mt-6 text-sm leading-8 text-muted-foreground">A private dinner and a corporate gathering call for different arrangements. We do not assign identical packages or fixed prices to every enquiry. Final pricing depends on the scope agreed with you.</p></div><div className="grid grid-cols-2 gap-x-7 self-center">{pricingFactors.map(item => <p key={item} className="border-b border-border/60 py-4 text-sm leading-6 text-foreground/75">{item}</p>)}</div></section>

    <section id="events-contact" className="mx-auto max-w-7xl scroll-mt-28 px-5 sm:px-8" aria-labelledby="contact-title"><div className="grid gap-10 border border-gold/35 bg-gold/5 p-7 sm:p-12 lg:grid-cols-[1.1fr_0.9fr] lg:p-16"><div><p className="text-eyebrow text-gold">A personal conversation</p><h2 id="contact-title" className="mt-5 font-display text-4xl font-light sm:text-5xl">Prefer to plan it <span className="italic">personally?</span></h2><p className="mt-6 max-w-xl text-sm leading-8 text-foreground/75">For larger events, complex requirements or a conversation before writing the brief, speak with our events team. Tell us what you have in mind and we can explore the next steps together.</p></div><address className="flex min-w-0 flex-col justify-center gap-5 text-base not-italic sm:text-lg"><p className="text-sm text-gold">Manager: {site.managerName}</p><a href={`tel:${site.phone.replace(/\s/g, "")}`} className="inline-flex min-h-12 items-center justify-between gap-4 border-b border-gold/25 pb-4">{site.phone}<ArrowUpRight size={18} className="shrink-0 text-gold" aria-hidden="true" /></a><a href={`mailto:${site.email}`} className="inline-flex min-h-12 items-center justify-between gap-4 border-b border-gold/25 pb-4"><span className="break-all">{site.email}</span><ArrowUpRight size={18} className="shrink-0 text-gold" aria-hidden="true" /></a><Link href="/contact" className="min-h-12 py-3 text-sm text-gold underline underline-offset-4">Official business location &amp; contact details</Link><SocialLinks /></address></div></section>
  </div>;
}
