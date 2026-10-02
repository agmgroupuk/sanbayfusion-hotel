import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowDownRight,
  ArrowRight,
  CalendarDays,
  Check,
  Clock3,
  Compass,
  CreditCard,
  MapPin,
  ShieldCheck,
  Sparkles,
  UserRoundCheck,
  UtensilsCrossed,
  Wine,
} from "lucide-react";
import { site } from "@/lib/site";
import { Reveal } from "@/components/motion/reveal";
import { KineticText } from "@/components/motion/kinetic-text";

export const metadata: Metadata = {
  title: "About Us",
  description:
    "Sanbay Fusion Foods Company Limited created this membership service exclusively for eligible foreign visitors who normally live outside Thailand and visit temporarily.",
  alternates: { canonical: "/about" },
};

const journeySteps = [
  ["01", "Check visitor eligibility", "This membership is exclusively for foreign visitors who normally live outside Thailand and visit temporarily. Create your account and complete your profile, addresses and verified default card."],
  ["02", "Choose your service months", "Select a 1 to 12 month plan and the same number of eligible months in one calendar year."],
  ["03", "Configure and schedule", "Choose membership only or an eligible prepaid package. Schedule Standard Meals now or later."],
  ["04", "Apply for review", "Review your selections and authorize the agreed amount. Submission does not collect the membership fee."],
  ["05", "Approval and payment", "The team reviews your application. After approval, staff can collect the agreed invoice. Verified payment activates membership."],
  ["06", "Enjoy your selected months", "Use your Standard Meal allowance, place eligible additional orders and track everything in Account Center."],
] as const;

const membershipReasons = [
  ["Plan ahead", "Organize requirements before arrival.", CalendarDays],
  ["Personal schedule", "Arrange confirmed services around your Thailand itinerary.", Clock3],
  ["One account", "Keep membership, addresses, payment methods, requests, and records together.", UserRoundCheck],
  ["Prepared arrival", "Spend less of your trip organizing arrangements that could have been planned beforehand.", Compass],
] as const;

const offerings = ["Thai cuisine", "International cuisine", "Seafood", "Appetizers", "Main courses", "Desserts", "Non-alcoholic beverages"];
const spirits = ["Beer", "Wine", "Champagne", "Whisky", "Rum", "Vodka", "Gin"];

function SectionLabel({ children }: { children: React.ReactNode }) {
  return <p className="text-eyebrow text-gold">{children}</p>;
}

export default function AboutPage() {
  return (
    <div className="overflow-hidden pb-28">
      <section className="relative isolate flex min-h-[min(820px,100svh)] items-end overflow-hidden border-b border-border/50">
        <Image
          src="/images/outdoors-of-the-restaurant.jpg"
          alt="Warmly lit Sanbay Fusion restaurant exterior"
          fill
          priority
          sizes="100vw"
          className="object-cover object-center"
        />
        <div className="overlay-cinematic absolute inset-0" />
        <div className="absolute inset-0 bg-gradient-to-r from-background/70 via-background/20 to-transparent" />
        <div className="relative mx-auto w-full max-w-7xl px-5 pb-14 pt-40 sm:px-8 sm:pb-24 lg:pb-28">
          <div className="max-w-4xl">
            <Reveal variant="fade" className="text-eyebrow text-gold">Sanbay Fusion · About Us</Reveal>
            <KineticText
              as="h1"
              text="CREATED FOR INTERNATIONAL VISITORS TO THAILAND"
              delay={0.1}
              stagger={0.07}
              className="text-h1 mt-6 max-w-4xl font-display font-light capitalize"
            />
            <Reveal variant="up" delay={0.3}>
              <p className="lead mt-8 max-w-2xl">
                This membership service is exclusively for foreign visitors who normally live outside Thailand and travel here temporarily. Arrange eligible food and service requirements before travelling or during your visit. This program is not offered to domestic Thai customers.
              </p>
            </Reveal>
            <Reveal variant="up" delay={0.42} className="mt-9 flex flex-wrap gap-3">
              <Link href="/plans" className="inline-flex items-center gap-3 rounded-full bg-gold px-6 py-3.5 text-eyebrow text-gold-foreground transition-transform hover:-translate-y-0.5">
                Explore membership <ArrowRight className="size-4" />
              </Link>
              <Link href="/how-it-works" className="inline-flex items-center gap-3 rounded-full border border-foreground/40 bg-background/20 px-6 py-3.5 text-eyebrow backdrop-blur-sm transition-colors hover:border-gold hover:text-gold">
                How it works <ArrowDownRight className="size-4" />
              </Link>
            </Reveal>
          </div>
          <Reveal variant="fade" delay={0.6} className="mt-16 flex items-center gap-3 text-xs uppercase tracking-[0.24em] text-foreground/65">
            <span className="h-px w-12 bg-gold" />
            A considered way to prepare for Thailand
          </Reveal>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-12 px-5 py-24 sm:px-8 lg:grid-cols-[1.05fr_0.95fr] lg:gap-24 lg:py-36">
        <Reveal variant="up">
          <SectionLabel>About Sanbay Fusion</SectionLabel>
          <KineticText as="h2" text="Hospitality experience, shaped around the way people travel" className="text-h2 mt-6 max-w-3xl font-display font-light" />
          <div className="mt-8 max-w-2xl space-y-5 text-base leading-relaxed text-foreground/75">
            <p>{site.name} is operated by {site.legalName}, based in {site.address.city}, {site.address.country}. Visit our <Link href="/contact" className="text-gold underline underline-offset-4">Contact page</Link> for our business address and contact details.</p>
            <p>Our business was established in 2018, with experience connected to restaurants, food service, food products, beverages, sourcing, and customer hospitality.</p>
            <p>Sanbay Fusion Foods Company Limited created this particular membership service in response to the needs of international customers visiting Thailand: tourists, holidaymakers, business travellers, returning visitors and people planning extended temporary visits.</p>
            <p>For occasions during your stay, our separate <Link href="/events" className="text-gold underline underline-offset-4">Private Events &amp; Bespoke Hospitality</Link> service brings catering, beverages, staffing and entertainment requirements into one event brief. Begin planning before arrival; the team reviews your requirements and prepares a tailored proposal. An enquiry is not a confirmed booking or payment.</p>
            <p>Travellers often arrange hotels and transportation before leaving home. Sanbay Fusion lets eligible foreign visitors also plan applicable food and service requirements in advance, with selected service months and meal schedules shaped around their travel plans. Applications remain subject to review and approval.</p>
          </div>
        </Reveal>

        <Reveal variant="scale" className="relative self-start border border-gold/50 bg-gold/[0.06] p-7 sm:p-10 lg:mt-12">
          <div className="absolute right-0 top-0 h-20 w-20 border-l border-b border-gold/40" />
          <SectionLabel>Company information</SectionLabel>
          <dl className="mt-8 divide-y divide-border/70">
            <div className="grid gap-1 py-4 first:pt-0 sm:grid-cols-[0.85fr_1.15fr] sm:gap-6"><dt className="text-sm text-muted-foreground">Established</dt><dd className="font-display text-xl">October 2018</dd></div>
            <div className="grid gap-1 py-4 sm:grid-cols-[0.85fr_1.15fr] sm:gap-6"><dt className="text-sm text-muted-foreground">Juristic person / registration number</dt><dd className="font-display text-xl">0105561169024</dd></div>
            <div className="grid gap-1 py-4 sm:grid-cols-[0.85fr_1.15fr] sm:gap-6"><dt className="text-sm text-muted-foreground">Business activities</dt><dd className="text-sm leading-relaxed text-foreground/80">Restaurant and food-service operations and related food and beverage activities, according to the company&apos;s registered business scope.</dd></div>
            <div className="grid gap-1 py-4 sm:grid-cols-[0.85fr_1.15fr] sm:gap-6"><dt className="text-sm text-muted-foreground">Primary business category</dt><dd className="text-sm leading-relaxed text-foreground/80">Food service in restaurants / food establishments</dd></div>
            <div className="grid gap-1 py-4 last:pb-0 sm:grid-cols-[0.85fr_1.15fr] sm:gap-6"><dt className="text-sm text-muted-foreground">Authorized / registered person</dt><dd className="font-display text-xl">Yuwalak Chaiya</dd></div>
          </dl>
        </Reveal>
      </section>

      <section className="border-y border-border/50 bg-card/25">
        <div className="mx-auto grid max-w-7xl gap-12 px-5 py-24 sm:px-8 lg:grid-cols-[0.85fr_1.15fr] lg:items-center lg:gap-24 lg:py-32">
          <Reveal variant="scale" className="relative aspect-[4/5] overflow-hidden">
            <Image src="/images/fancy-salmon-dish-with-wine-glasses-in-background.jpg" alt="A carefully prepared dish at Sanbay Fusion" fill sizes="(min-width: 1024px) 38vw, 100vw" className="object-cover transition-transform duration-1000 hover:scale-105" />
            <div className="absolute inset-0 bg-gradient-to-t from-background/70 via-transparent to-transparent" />
            <div className="absolute bottom-6 left-6 flex items-center gap-3 text-xs uppercase tracking-[0.22em] text-gold"><UtensilsCrossed className="size-4" /> Prepared with context</div>
          </Reveal>
          <Reveal variant="up">
            <SectionLabel>Built around your Thailand visit</SectionLabel>
            <KineticText as="h2" text="Make room for the parts of your stay you came to enjoy" className="text-h2 mt-6 max-w-3xl font-display font-light" />
            <div className="mt-8 space-y-5 text-base leading-relaxed text-foreground/75">
              <p>Many travelers arrange important parts of their trip before they arrive: flights, hotels, accommodation, transportation, and activities.</p>
              <p>We believe food, beverages, and personal hospitality requirements can also be planned in advance. Tell us when you expect to be in Thailand, where you will be staying within our supported service areas, and what you expect to need during your visit.</p>
              <p>This gives our team a chance to prepare around an agreed schedule rather than asking you to start organizing everything after arrival.</p>
            </div>
            <div className="mt-10 grid gap-4 sm:grid-cols-2">
              {[[MapPin, "Where", "Your supported service area"], [CalendarDays, "When", "Your planned dates"], [Sparkles, "What", "Your eligible requirements"], [ShieldCheck, "How", "Your confirmed arrangement"]].map(([Icon, title, text]) => {
                const IconComponent = Icon as typeof MapPin;
                return <div key={title as string} className="border-l border-gold/60 pl-4"><IconComponent className="size-4 text-gold" /><p className="mt-2 text-eyebrow text-foreground/60">{title as string}</p><p className="mt-1 text-sm text-foreground/80">{text as string}</p></div>;
              })}
            </div>
          </Reveal>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-24 sm:px-8 lg:py-36">
        <Reveal variant="up" className="max-w-3xl">
          <SectionLabel>Your travel journey</SectionLabel>
          <KineticText as="h2" text="A clearer path from planning to arrival" className="text-h2 mt-6 font-display font-light" />
          <p className="mt-6 max-w-2xl text-base leading-relaxed text-foreground/70">Membership turns a loose idea into a shared schedule. Each step gives both sides a better view of what can be prepared and confirmed.</p>
        </Reveal>
        <ol className="mt-14 grid gap-5 lg:grid-cols-6 lg:gap-3">
          {journeySteps.map(([number, title, description], index) => (
            <Reveal key={number} variant="up" delay={index * 0.06} as="li" className="relative border-l border-gold/50 pl-5 lg:border-l-0 lg:border-t lg:pl-0 lg:pt-6">
              <span className="absolute -left-[5px] top-0 h-2.5 w-2.5 rounded-full bg-gold lg:-top-[5px] lg:left-0" />
              <p className="text-eyebrow text-gold">Step {number}</p>
              <h3 className="mt-4 font-display text-2xl font-light capitalize">{title}</h3>
              <p className="mt-3 text-sm leading-relaxed text-foreground/65">{description}</p>
            </Reveal>
          ))}
        </ol>
      </section>

      <Reveal variant="scale" className="mx-auto max-w-7xl px-5 sm:px-8">
        <section className="relative overflow-hidden border border-gold/70 bg-gold/[0.07] px-6 py-14 sm:px-12 sm:py-16 lg:px-20">
          <div className="absolute -right-12 -top-16 h-48 w-48 rounded-full border border-gold/20" />
          <div className="absolute -right-2 -top-6 h-28 w-28 rounded-full border border-gold/20" />
          <SectionLabel>The core idea</SectionLabel>
          <div className="mt-6 grid gap-10 lg:grid-cols-[1fr_1.1fr] lg:items-end">
            <h2 className="font-display text-4xl font-light leading-tight sm:text-5xl">Arrive with a plan already in place.</h2>
            <div className="space-y-4 text-base leading-relaxed text-foreground/80"><p>The idea behind Sanbay Fusion is simple.</p><p>When you book a hotel before traveling, you arrive knowing where you will stay. When you arrange transportation in advance, you know how you will get around.</p><p>We apply the same planning mindset to eligible food, beverage, and hospitality requirements. Tell us your schedule, arrange what you need, complete the required membership and order process, then arrive knowing confirmed arrangements have been planned around your visit.</p></div>
          </div>
        </section>
      </Reveal>

      <section className="mx-auto grid max-w-7xl gap-12 px-5 py-24 sm:px-8 lg:grid-cols-[1.15fr_0.85fr] lg:py-36">
        <Reveal variant="up">
          <SectionLabel>A practical example</SectionLabel>
          <KineticText as="h2" text="Three months, thought through before touchdown" className="text-h2 mt-6 max-w-3xl font-display font-light" />
          <p className="mt-6 max-w-2xl text-base leading-relaxed text-foreground/70">A visitor plans to stay in Thailand for three months. Before arriving, the customer creates an account, selects an appropriate membership, provides Thailand delivery or service information, chooses eligible requirements, shares expected dates, and completes the applicable confirmation and payment process.</p>
          <p className="mt-6 max-w-2xl text-base leading-relaxed text-foreground/70">Once confirmed, Sanbay Fusion can prepare around that agreed schedule during the membership period.</p>
        </Reveal>
        <Reveal variant="scale" className="border border-border/70 bg-card/40 p-7 sm:p-10">
          <p className="text-eyebrow text-gold">Before arrival</p>
          <ul className="mt-7 space-y-4">
            {["Create a Sanbay Fusion account", "Select an appropriate membership", "Provide delivery or service information", "Select eligible food and beverage requirements", "Share expected dates and schedule", "Complete the applicable confirmation / payment process"].map((item) => <li key={item} className="flex gap-3 text-sm leading-relaxed text-foreground/80"><Check className="mt-0.5 size-4 shrink-0 text-gold" />{item}</li>)}
          </ul>
          <p className="mt-9 border-t border-border/60 pt-6 text-xs leading-relaxed text-muted-foreground">All products, schedules, delivery arrangements, and services remain subject to availability, confirmed service areas, applicable law, and the customer&apos;s finalized arrangement.</p>
        </Reveal>
      </section>

      <section className="border-y border-border/50 bg-card/20">
        <div className="mx-auto max-w-7xl px-5 py-24 sm:px-8 lg:py-32">
          <Reveal variant="up" className="max-w-3xl"><SectionLabel>More than a last-minute order</SectionLabel><KineticText as="h2" text="Membership is about preparation" className="text-h2 mt-6 font-display font-light" /><p className="mt-6 text-base leading-relaxed text-foreground/70">The membership model lets us understand your planned requirements before service begins. Depending on the selected membership and arrangements, we can know in advance:</p></Reveal>
          <div className="mt-12 grid gap-px overflow-hidden border border-border/60 bg-border/60 sm:grid-cols-2 lg:grid-cols-4">
            {[["When", "The customer expects service", CalendarDays], ["Where", "The customer requires delivery or service", MapPin], ["What", "Has been selected", UtensilsCrossed], ["How long", "The membership or service period lasts", Clock3]].map(([title, text, Icon], index) => { const IconComponent = Icon as typeof CalendarDays; return <Reveal key={title as string} variant="up" delay={index * 0.06} className="bg-background p-7 sm:p-8"><IconComponent className="size-5 text-gold" /><p className="mt-7 font-display text-3xl capitalize">{title as string}</p><p className="mt-3 text-sm leading-relaxed text-foreground/65">{text as string}</p></Reveal>; })}
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-12 px-5 py-24 sm:px-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-center lg:py-36">
        <Reveal variant="up"><SectionLabel>Membership duration</SectionLabel><KineticText as="h2" text="Choose the period that fits your stay" className="text-h2 mt-6 max-w-xl font-display font-light" /><p className="mt-6 max-w-xl text-base leading-relaxed text-foreground/70">Choose 1 to 12 eligible service months within one calendar year. Months may be non-consecutive. After approval and verified payment, benefits apply only during your selected months; the membership ends after the last selected month.</p></Reveal>
        <Reveal variant="scale" className="grid grid-cols-3 border-y border-border/70">
          {["1 Month", "3 Months", "12 Months"].map((duration, index) => <div key={duration} className="border-r border-border/70 px-4 py-8 last:border-r-0 sm:px-7 sm:py-10"><p className="text-eyebrow text-gold">{index === 1 ? "Plan ahead" : index === 2 ? "All twelve months" : "One selected month"}</p><p className="mt-5 font-display text-2xl sm:text-3xl">{duration}</p><p className="mt-3 text-xs leading-relaxed text-muted-foreground">Benefits in {duration.toLowerCase()} of selected calendar service, after approval and payment.</p></div>)}
        </Reveal>
      </section>

      <section className="border-y border-border/50 bg-card/25">
        <div className="mx-auto grid max-w-7xl gap-12 px-5 py-24 sm:px-8 lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:py-32">
          <Reveal variant="up"><SectionLabel>Food &amp; beverage experience</SectionLabel><KineticText as="h2" text="A broad catalogue, with the right context" className="text-h2 mt-6 max-w-2xl font-display font-light" /><p className="mt-6 max-w-2xl text-base leading-relaxed text-foreground/70">Sanbay Fusion can present a broad catalogue of eligible offerings as availability allows, from Thai and international cooking to drinks and pantry-ready additions.</p><div className="mt-9 flex flex-wrap gap-2">{offerings.map((item) => <span key={item} className="rounded-full border border-border/80 px-4 py-2 text-sm text-foreground/75">{item}</span>)}</div><div className="mt-10 flex items-start gap-4 border-l border-gold/60 pl-5"><Wine className="mt-1 size-5 shrink-0 text-gold" /><div><p className="font-display text-2xl">Where legally permitted and available</p><p className="mt-3 text-sm leading-relaxed text-foreground/70">Alcohol-related products and services are subject to applicable Thai law, age requirements, permitted sales or service conditions, availability, and service-area restrictions.</p><div className="mt-4 flex flex-wrap gap-x-4 gap-y-2 text-xs text-muted-foreground">{spirits.map((item) => <span key={item}>{item}</span>)}</div></div></div></Reveal>
          <Reveal variant="scale" className="relative aspect-[4/5] overflow-hidden"><Image src="/images/chef-preparing-the-plates.jpg" alt="Chef preparing plates at Sanbay Fusion" fill sizes="(min-width: 1024px) 38vw, 100vw" className="object-cover" /><div className="absolute inset-0 bg-gradient-to-t from-background/80 via-transparent to-transparent" /><p className="absolute bottom-7 left-7 max-w-[12rem] font-display text-3xl italic text-foreground">Good planning leaves more room for good food.</p></Reveal>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-12 px-5 py-24 sm:px-8 lg:grid-cols-[1.05fr_0.95fr] lg:py-36">
        <Reveal variant="scale" className="relative order-2 aspect-[4/3] overflow-hidden lg:order-1"><Image src="/images/fire-from-wok.jpg" alt="Fire rising from a wok in the Sanbay Fusion kitchen" fill sizes="(min-width: 1024px) 48vw, 100vw" className="object-cover" /><div className="absolute inset-0 bg-gradient-to-r from-transparent to-background/60" /></Reveal>
        <Reveal variant="up" className="order-1 lg:order-2 lg:pl-8"><SectionLabel>Serving from an established foundation</SectionLabel><KineticText as="h2" text="The story did not begin with a website" className="text-h2 mt-6 max-w-2xl font-display font-light" /><div className="mt-8 space-y-5 text-base leading-relaxed text-foreground/75"><p>Sanbay Fusion&apos;s story began with a business foundation dating to 2018 and experience associated with restaurant and food-service operations and related food and beverage activities.</p><p>The Sanbay Fusion platform represents the next stage of that journey: combining hospitality experience with advance planning and a membership-based digital service for visitors to Thailand.</p></div><Link href="/catalogue" className="mt-9 inline-flex items-center gap-3 text-eyebrow text-gold transition-colors hover:text-foreground">Explore the catalogue <ArrowRight className="size-4" /></Link></Reveal>
      </section>

      <section className="border-y border-border/50 bg-card/20">
        <div className="mx-auto max-w-7xl px-5 py-24 sm:px-8 lg:py-32"><Reveal variant="up" className="max-w-3xl"><SectionLabel>Why membership?</SectionLabel><KineticText as="h2" text="A better frame for the visit you have in mind" className="text-h2 mt-6 font-display font-light" /></Reveal><div className="mt-12 grid gap-5 md:grid-cols-2 lg:grid-cols-4">{membershipReasons.map(([title, description, Icon], index) => { const IconComponent = Icon as typeof CalendarDays; return <Reveal key={title} variant="up" delay={index * 0.06} className="border border-border/70 bg-background p-7"><IconComponent className="size-5 text-gold" /><h3 className="mt-7 font-display text-2xl capitalize">{title}</h3><p className="mt-3 text-sm leading-relaxed text-foreground/65">{description}</p></Reveal>; })}</div></div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-5 px-5 py-24 sm:px-8 lg:grid-cols-2 lg:py-32">
        <Reveal variant="up" className="border border-gold/40 bg-gold/[0.05] p-7 sm:p-10"><SectionLabel>Good to know</SectionLabel><h2 className="mt-6 font-display text-4xl font-light">Clear expectations make better arrangements.</h2><p className="mt-6 text-sm leading-relaxed text-foreground/75">Membership does not guarantee that every requested product, date, location, or service will always be available. Requests remain subject to:</p><ul className="mt-6 grid gap-3 text-sm text-foreground/75 sm:grid-cols-2">{["Service-area eligibility", "Product availability", "Advance scheduling", "Successful payment", "Customer / account verification", "Applicable Thai laws and regulations", "Age verification for age-restricted products", "Final confirmation by Sanbay Fusion"].map((item) => <li key={item} className="flex gap-2"><span className="mt-2 size-1.5 shrink-0 rounded-full bg-gold" />{item}</li>)}</ul></Reveal>
        <Reveal variant="up" delay={0.1} className="border border-border/70 bg-card/40 p-7 sm:p-10"><CreditCard className="size-6 text-gold" /><h2 className="mt-6 font-display text-4xl font-light">Your account. Your payment method.</h2><p className="mt-6 text-sm leading-relaxed text-foreground/75">Customers manage personal information, addresses, security settings, and supported payment methods through their Sanbay Fusion account.</p><p className="mt-5 text-sm leading-relaxed text-muted-foreground">Payment information is handled through the site&apos;s secure payment-provider integration. Sanbay Fusion stores safe payment references, card brand, last four digits and expiry; complete card numbers and CVC are handled through Stripe.</p><Link href="/signup" className="mt-8 inline-flex items-center gap-3 rounded-full border border-foreground/30 px-5 py-3 text-eyebrow transition-colors hover:border-gold hover:text-gold">Create an account <ArrowRight className="size-4" /></Link></Reveal>
      </section>

      <Reveal variant="scale" className="mx-auto max-w-7xl px-5 sm:px-8">
        <section className="relative overflow-hidden bg-gold px-6 py-16 text-gold-foreground sm:px-12 sm:py-20 lg:px-20">
          <div className="absolute right-0 top-0 h-full w-1/3 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.28),transparent_62%)] opacity-60" />
          <div className="relative max-w-3xl"><p className="text-eyebrow text-gold-foreground/70">Begin before you arrive</p><h2 className="mt-6 font-display text-5xl font-light leading-[0.98] sm:text-6xl">Plan more of your Thailand stay before you arrive.</h2><p className="mt-7 max-w-2xl text-base leading-relaxed text-gold-foreground/80">Create your account, explore Sanbay Fusion memberships, and begin arranging your requirements around your planned time in Thailand.</p><div className="mt-9 flex flex-wrap gap-3"><Link href="/plans" className="inline-flex items-center gap-3 rounded-full bg-gold-foreground px-6 py-3.5 text-eyebrow text-gold transition-transform hover:-translate-y-0.5">Explore memberships <ArrowRight className="size-4" /></Link><Link href="/how-it-works" className="inline-flex items-center gap-3 rounded-full border border-gold-foreground/50 px-6 py-3.5 text-eyebrow transition-colors hover:bg-gold-foreground/10">How it works</Link><Link href="/signup" className="inline-flex items-center gap-3 rounded-full border border-gold-foreground/50 px-6 py-3.5 text-eyebrow transition-colors hover:bg-gold-foreground/10">Create account</Link></div></div>
        </section>
      </Reveal>
    </div>
  );
}
