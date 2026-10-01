import type { Metadata } from "next";
import Link from "next/link";
import { PageHeader } from "@/components/site/page-header";

export const metadata: Metadata = { title: "How It Works", description: "Membership duration, prepaid packages, payment, approval, and renewal.", alternates: { canonical: "/how-it-works" } };
const steps = [
  ["Choose your duration", "Select one of 12 plans, then choose exactly that many eligible service months in the current or next calendar year. Months do not have to be consecutive."],
  ["Choose your purchase", "Buy membership only, or add a prepaid food and beverage package with eligible add-ons."],
  ["Save your payment method", "Review your exact quote and save a card securely. Submit your authorization without a membership charge."],
  ["Team review", "Submit your application for review. If approved, we attempt the exact authorized charge. Declined applications are not charged."],
  ["Final activation", "After admin approval and successful payment, your Member ID is issued. Service and monthly benefits are available only during your selected months. The dashboard shows each month as upcoming, current or completed."],
  ["Order and renew", "Active members may buy additional products separately from the dashboard. Ordering access ends at expiry. Renewal requires a new authorized purchase."],
];
export default function HowItWorksPage() {
  return <div className="pb-28"><PageHeader eyebrow="The membership process" title="Choose your term. Make it yours." lead="One payment for 1 to 12 selected service months, with a complimentary meal in each month after approval and payment." /><main className="mx-auto max-w-7xl px-5 sm:px-8">
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">{steps.map(([title, description], index) => <article key={title} className="rounded-sm border border-border/60 p-7"><p className="text-eyebrow text-gold">0{index + 1}</p><h2 className="mt-5 font-display text-2xl">{title}</h2><p className="mt-4 text-sm leading-relaxed text-muted-foreground">{description}</p></article>)}</div>
    <section className="mt-16 grid gap-6 md:grid-cols-2"><article className="border border-gold/40 bg-gold/5 p-7"><h2 className="font-display text-3xl">Membership only</h2><p className="mt-5">Expected charge upon approval = membership fee.</p><p className="mt-4 text-sm text-muted-foreground">For example, a 3-Month Membership costs ฿15,000. Additional food and beverage orders are paid separately after activation.</p></article><article className="border border-gold/40 bg-gold/5 p-7"><h2 className="font-display text-3xl">Membership + prepaid package</h2><p className="mt-5">Product total = unit price × monthly quantity × selected service months.</p><p className="mt-4 text-sm text-muted-foreground">Monthly add-ons use the same duration multiplier. One-time add-ons are charged once. All selected products and add-ons are paid together with the membership fee.</p></article></section>
    <section className="mt-12 border-y border-border/60 py-8"><h2 className="font-display text-3xl">Package quantities and delivery scheduling</h2><p className="mt-5 max-w-3xl text-sm leading-relaxed text-muted-foreground">Four units per month means four units in each membership month, not four separate deliveries. Delivery dates and distribution are arranged separately. Your paid package prices and quantities are saved for your selected term and do not change when catalog prices change.</p><p className="mt-4 text-sm text-muted-foreground">For example, a 3-Month Membership can cover February, July and November 2027. There is no service entitlement in the intervening months. Selected months become fixed on final submission. One included member meal applies per selected month, separately from prepaid quantities and extra orders; unused benefits do not roll over or convert to cash.</p></section>
    <Link href="/plans" className="mt-10 inline-flex rounded-full bg-gold px-7 py-3 text-eyebrow text-gold-foreground">VIEW MEMBERSHIP PLANS</Link>
  </main></div>;
}
