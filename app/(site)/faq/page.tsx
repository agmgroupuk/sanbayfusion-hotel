import type { Metadata } from "next";
import { PageHeader } from "@/components/site/page-header";
import { Reveal } from "@/components/motion/reveal";

export const metadata: Metadata = { title: "FAQ", description: "Frequently asked questions about Sanbay Fusion food memberships, invoices, delivery, and package rules.", alternates: { canonical: "/faq" } };

const sections = [
  {
    title: "Membership FAQ",
    questions: [
      ["How long is a Sanbay Fusion membership?", "All standard memberships are valid for 12 months from the confirmed membership start date, unless otherwise stated in the final membership agreement."],
      ["How do I become a member?", "Choose a plan, configure the available preferences, submit a request, and wait for team review. If approved, you will receive a membership invoice."],
      ["Do I pay when I submit my membership request?", "No. Submitting a request does not activate membership or take payment. The team reviews it first."],
      ["How long do I have to pay my membership invoice?", "The standard payment period is 3 days from invoice issue. The exact deadline appears on the invoice. An unpaid invoice may expire without activating membership."],
      ["What does the first invoice include?", "The initial invoice is for the annual membership fee only unless an administrator explicitly adds another approved charge. Future food, beverage, delivery, or order charges are separate where applicable."],
      ["What happens after I pay the membership fee?", "After payment is confirmed, the team begins membership setup. You will normally receive your membership number, card/details, activation date, expiry date, delivery entitlement, finalized package, and ordering instructions within approximately 3 days."],
      ["When does my 12-month membership begin?", "It begins on the confirmed activation/start date shown in your finalized membership details."],
      ["Is the membership fee refundable?", "Membership fees are non-refundable after payment and activation except where a refund is required by applicable law."],
      ["Can I cancel my membership?", "You may request cancellation at any time. Cancellation ends future membership use according to the applicable terms and does not automatically create a refund."],
      ["Can I change my package after activation?", "No. Once finalized and activated, the agreed plan, package, delivery entitlement, and included products are locked for that membership term unless the team approves an exception."],
      ["Can I upgrade or downgrade later?", "Not during the active term unless Sanbay Fusion specifically approves an exception. Review the final configuration carefully before paying the invoice."],
      ["What happens if an included product is unavailable?", "The team may contact you and offer a suitable replacement. This is a delivery-specific substitution and does not permanently change your membership package."],
    ],
  },
  {
    title: "Delivery & order FAQ",
    questions: [
      ["How early must I request a delivery?", "Eligible deliveries should normally be requested at least 3 days before the requested date. The actual cut-off date and time should be shown when a future delivery system is available."],
      ["What happens if I order too late?", "The requested delivery date may be unavailable. Where the finalized terms say the opportunity expires, the missed entitlement will not silently roll over."],
      ["Do I need to pay for each delivery?", "The annual membership fee and individual food, beverage, delivery, or order charges are separate where the selected membership requires them. Items, fees, taxes, and total must be shown before confirmation."],
      ["When is my delivery confirmed?", "After the request is submitted within the notice period, selections are complete, any required payment is made, and Sanbay Fusion confirms the delivery."],
      ["Can unused deliveries be carried forward?", "Not automatically unless the finalized membership terms specifically allow it. Unused monthly opportunities do not roll over indefinitely by default."],
      ["What if I receive the wrong or damaged item?", "Contact Sanbay Fusion promptly. The team will review the order and determine an appropriate correction or replacement under company policy and applicable law."],
      ["What are members responsible for?", "Members must request deliveries on time, provide accurate address and contact details, complete applicable payments, be available for confirmed deliveries, provide accurate allergy information, and comply with age or identity requirements for regulated products."],
    ],
  },
  {
    title: "Food, alcohol & account FAQ",
    questions: [
      ["What if I have food allergies?", "Provide allergy and dietary details before ordering. The team will review them, but no requirement is guaranteed until Sanbay Fusion confirms it."],
      ["How are alcohol products handled?", "Alcohol is subject to applicable Thai law, licensing, age and identity checks, permitted sales conditions, and delivery restrictions. Website availability does not override legal restrictions."],
      ["Can someone else use my membership?", "Memberships are personal to the registered member unless the plan expressly permits household members or another approved arrangement."],
      ["What happens when my membership expires?", "Future benefits stop at the expiry date unless the membership is renewed or a new membership is created. Renewal terms and prices may differ."],
      ["What are the important membership rules?", "Before submitting a request, review the 12-month term, 3-day invoice payment window, non-refundable fee rule, minimum 3-day delivery notice, locked finalized package, and possible product substitutions."],
    ],
  },
] as const;

export default function FAQPage() {
  return <div className="pb-28"><PageHeader eyebrow="Questions" title="Before your first delivery" lead="Clear answers about membership requests, invoices, activation, delivery deadlines, package rules, and regulated products." /><div className="mx-auto max-w-3xl px-5 sm:px-8"><div className="mb-12 grid gap-4 border-y border-gold/50 bg-gold/5 p-6 text-sm leading-relaxed sm:grid-cols-2"><p><strong className="text-gold">12-month membership</strong><br />Starts on confirmed activation.</p><p><strong className="text-gold">3-day invoice window</strong><br />Unpaid invoices may expire.</p><p><strong className="text-gold">Non-refundable fee</strong><br />Except where required by law.</p><p><strong className="text-gold">3-day delivery notice</strong><br />Late requests may be unavailable.</p></div>{sections.map((section) => <section key={section.title} className="mb-16"><h2 className="text-eyebrow text-gold">{section.title}</h2><div className="mt-4 divide-y divide-border/50">{section.questions.map(([question, answer], index) => <Reveal key={question} variant="up" delay={index * 0.015}><details className="group py-6"><summary className="flex cursor-pointer list-none items-center justify-between gap-6 font-display text-2xl font-light italic marker:hidden"><span>{question}</span><span className="text-gold transition-transform group-open:rotate-45">+</span></summary><p className="mt-4 max-w-2xl text-base leading-relaxed text-foreground/75">{answer}</p></details></Reveal>)}</div></section>)}</div></div>;
}
