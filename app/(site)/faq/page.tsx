import type { Metadata } from "next";
import { PageHeader } from "@/components/site/page-header";
import { Reveal } from "@/components/motion/reveal";

export const metadata: Metadata = { title: "FAQ", description: "Frequently asked questions about Sanbay Fusion food memberships and delivery.", alternates: { canonical: "/faq" } };

const questions = [
  ["Is this a one-off food order?", "No. The core service is a recurring membership. Each plan includes a defined number of delivery days, packages, portions, or benefits."],
  ["Can I choose my delivery dates?", "Yes. Available dates and windows depend on your plan, route, and capacity. We confirm your selections before the cycle starts."],
  ["Can I pause or cancel?", "Plans are designed to be adjusted before the next cycle. The final pause, cancellation, and refund rules will be shown clearly before payment."],
  ["Do you deliver outside Bangkok?", "We are starting with defined Bangkok and Greater Bangkok routes. Use the delivery-area check during joining and contact us for business or special routes."],
  ["Are drinks and snacks included?", "It depends on the plan. Monthly Plus and selected premium programmes may include drinks, snacks, or seasonal add-ons."],
  ["Can businesses join?", "Yes. Corporate memberships support office meals, hospitality, recurring team packages, wholesale, and event supply by arrangement."],
  ["How are allergens handled?", "Tell us about allergies and dietary requirements before joining. We will confirm what each package can safely support before payment."],
  ["How do recurring payments work?", "Payment provider and billing terms are being finalised. The final checkout will show the billing date, renewal terms, fees, and cancellation rules before you confirm."],
] as const;

export default function FAQPage() { return <div className="pb-28"><PageHeader eyebrow="Questions" title="Before your first delivery" lead="A few clear answers about the membership model, delivery rhythm, and the details that matter." /><div className="mx-auto max-w-3xl px-5 sm:px-8"><div className="divide-y divide-border/50">{questions.map(([question, answer], index) => <Reveal key={question} variant="up" delay={index * 0.025}><details className="group py-6"><summary className="flex cursor-pointer list-none items-center justify-between gap-6 font-display text-2xl font-light italic marker:hidden"><span>{question}</span><span className="text-gold transition-transform group-open:rotate-45">+</span></summary><p className="mt-4 max-w-2xl text-base leading-relaxed text-foreground/75">{answer}</p></details></Reveal>)}</div></div></div>; }