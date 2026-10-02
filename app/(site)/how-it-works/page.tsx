import { ContactAssistance } from "@/components/site/contact-assistance";
import { pageMetadata } from "@/lib/seo";
import Link from "next/link";
import { CalendarDays, ClipboardCheck, CreditCard, FileCheck2, MapPin, ShoppingBag, UserRound, UtensilsCrossed } from "lucide-react";
import { MembershipEligibilityNotice } from "@/components/membership/eligibility-notice";
import { PageHeader } from "@/components/site/page-header";

export const metadata = pageMetadata("/how-it-works");

const steps = [
  { title: "Start as an eligible foreign visitor", text: "This membership is for foreign visitors who normally live outside Thailand and travel temporarily for tourism, holidays, business or an extended visit. If eligible, create an account or sign in; an account alone does not create membership.", icon: UserRound, href: "/signup", action: "Create an account" },
  { title: "Complete Account Center", text: "Save your personal information, billing address and delivery address. Check delivery eligibility, verify a saved card and choose a default payment method before applying.", icon: MapPin, href: "/dashboard", action: "Open Account Center" },
  { title: "Choose your service months", text: "Choose a 1–12 month plan, then select exactly that many eligible months within one calendar year. Choose the current or next year; months may be non-consecutive. Past months are unavailable.", icon: CalendarDays, href: "/plans", action: "Compare plans" },
  { title: "Make it yours", text: "Choose membership only or add an eligible prepaid food and non-alcoholic beverage package. Review quantities, preferences and your plan's included Standard Meal allowance.", icon: ShoppingBag },
  { title: "Schedule your Standard Meals", text: "Choose a date and time in each selected month now, or select Schedule later and return through Account Center. Allow at least three calendar days. Times run from 11:00 AM to midnight in Bangkok time, in half-hour steps. Scheduling alone does not place a meal order.", icon: UtensilsCrossed },
  { title: "Review and submit", text: "Confirm international-visitor eligibility and check the final amount, selected months, addresses and saved card. Accept the terms and payment authorization. Submission creates an application and draft invoice for review, without collecting the membership fee.", icon: ClipboardCheck },
  { title: "Team review and payment", text: "The team reviews your visitor eligibility, account, delivery information and selections and may contact you for clarification. Submission does not guarantee approval. Approval makes the agreed invoice ready for staff collection. Further bank authentication may be needed; approval alone does not activate membership.", icon: CreditCard },
  { title: "Use your membership", text: "After approval and verified successful payment, your membership activates and your Member ID is issued. During each selected service month, place your eligible Standard Meal order or separately paid additional orders. Track status in Account Center.", icon: FileCheck2, href: "/dashboard", action: "View your membership" },
];

export default function HowItWorksPage() {
  return <div className="pb-28">
    <PageHeader eyebrow="The membership process" title="Your months. Your table. Your plan." lead="Plan before travelling or during your temporary Thailand visit. Complete your account, choose service months around your trip and submit for review. An application does not guarantee approval." />
    <div className="mx-auto max-w-7xl px-5 sm:px-8"><MembershipEligibilityNotice />
      <ol className="grid gap-5 md:grid-cols-2 xl:grid-cols-4" aria-label="Membership journey">
        {steps.map(({ title, text, icon: Icon, href, action }, index) => <li key={title} className="flex flex-col border border-border/60 bg-card/20 p-6 sm:p-7">
          <div className="flex items-center justify-between text-gold"><span className="text-eyebrow">Step {String(index + 1).padStart(2, "0")}</span><Icon className="size-6" aria-hidden="true" /></div>
          <h2 className="mt-6 font-display text-2xl">{title}</h2><p className="mt-4 flex-1 text-sm leading-7 text-foreground/75">{text}</p>
          {href && <Link href={href} className="mt-6 text-sm text-gold underline underline-offset-4">{action}</Link>}
        </li>)}
      </ol>
      <section aria-labelledby="payment-notice" className="mt-12 border border-gold/40 bg-gold/5 p-6 sm:p-8">
        <h2 id="payment-notice" className="font-display text-3xl">Two separate payment steps</h2>
        <div className="mt-5 grid gap-6 text-sm leading-7 text-foreground/80 md:grid-cols-2">
          <p><strong>Card verification:</strong> Account Center uses a USD $2 verification payment. A refund is initiated after successful verification; your issuer may take additional time to show it. This is separate from your membership fee.</p>
          <p><strong>Membership payment:</strong> Your submitted amount is authorized for collection only after approval. If payment needs action or fails, follow the status shown in Account Center or contact the team. A declined application does not collect the membership fee.</p>
        </div>
        <p className="mt-5 border-t border-gold/20 pt-4 text-sm leading-7"><strong>Payment availability:</strong> Online payments currently operate in test mode. Live card payments are not available.</p>
      </section>
      <section className="mt-12 grid gap-6 md:grid-cols-2" aria-label="Membership options">
        <article className="border border-border/60 p-7"><h2 className="font-display text-3xl">Membership only</h2><p className="mt-4 text-sm leading-7 text-foreground/75">Your membership fee includes one Standard Meal allowance per selected service month. Additional purchases are separate. View the current fee and allowance on your plan before applying.</p></article>
        <article className="border border-border/60 p-7"><h2 className="font-display text-3xl">Membership + prepaid package</h2><p className="mt-4 text-sm leading-7 text-foreground/75">Monthly product cost = unit price × monthly quantity × selected service months. Monthly add-ons use the same multiplier; one-time add-ons are charged once. Quantities describe products, not a number of deliveries.</p></article>
      </section>
      <section className="mt-12 border-y border-border/60 py-8"><h2 className="font-display text-3xl">One Standard Meal in each selected month</h2><p className="mt-5 max-w-3xl text-sm leading-7 text-foreground/75">You may schedule future selected months in advance, but place each included meal order during its own selected month. The allowance applies to eligible food in one meal order; pay any excess at checkout. Order drinks and other products separately. Unused allowance has no cash value and does not roll over.</p><p className="mt-4 max-w-3xl text-sm leading-7 text-foreground/75">Benefits are unavailable in gaps between selected months. Membership expires after the last selected month; it does not automatically renew. You cannot purchase another membership while an existing membership is ongoing or has service months remaining.</p></section>
      <section className="mt-10 border border-border/60 p-7"><h2 className="font-display text-3xl">Planning a private occasion?</h2><p className="mt-4 text-sm leading-7 text-foreground/75">Our separate <Link href="/events" className="text-gold underline">Private Events &amp; Bespoke Hospitality</Link> service lets you share a brief before or during your Thailand visit. The events team reviews catering, beverages, staffing, entertainment and logistics before preparing a tailored proposal. Event enquiries do not use the membership checkout or create an automatic booking or charge.</p></section><div className="mt-10 flex flex-wrap gap-5"><Link href="/plans" className="inline-flex rounded-full bg-gold px-7 py-3 text-eyebrow text-gold-foreground">View membership plans</Link><Link href="/faq" className="inline-flex items-center text-sm text-gold underline underline-offset-4">Read the FAQ</Link></div>
    </div>
  <ContactAssistance /></div>;
}
