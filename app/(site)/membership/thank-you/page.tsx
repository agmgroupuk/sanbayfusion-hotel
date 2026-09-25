import type { Metadata } from "next";
import Link from "next/link";
import { PageHeader } from "@/components/site/page-header";
import { membershipPlans } from "@/lib/membership-plans";

export const metadata: Metadata = {
  title: "Membership Request Received",
  description: "Your Sanbay Fusion membership request has been received and is pending review.",
  alternates: { canonical: "/membership/thank-you" },
  robots: { index: false, follow: false },
};

type ThankYouProps = { searchParams: Promise<{ request?: string; plan?: string }> };

export default async function MembershipThankYouPage({ searchParams }: ThankYouProps) {
  const { request, plan: planSlug } = await searchParams;
  const plan = membershipPlans.find((item) => item.slug === planSlug);
  return <div className="pb-28"><PageHeader eyebrow="Request received" title="Thank You!" lead="Your Sanbay Fusion membership request has been successfully submitted." /><div className="mx-auto max-w-2xl px-5 text-center sm:px-8"><div className="rounded-sm border border-gold/50 bg-gold/5 p-8 sm:p-12"><p className="text-eyebrow text-gold">Request number</p><p className="mt-4 font-display text-3xl font-light">{request || "Pending"}</p><p className="mt-8 text-base leading-relaxed text-foreground/80">Our team will review your membership request and provide an update within approximately 3 days.</p><p className="mt-4 text-sm leading-relaxed text-muted-foreground">A member of our team may contact you by phone, email, LINE, WhatsApp, or your selected contact method to confirm your membership details.</p><div className="mt-8 border-t border-border/50 pt-8 text-left text-sm"><p className="text-eyebrow text-gold">Your request</p><p className="mt-4">{plan?.name ?? "Your selected membership"}</p>{plan && <p className="mt-2">12 months · {plan.deliveryDays} delivery days/month · {plan.deliveryDaysPerYear} delivery days/year</p>}<p className="mt-3">Request status: <strong className="text-gold">Pending review</strong></p></div></div><div className="mt-8 flex flex-wrap justify-center gap-4"><Link href="/" className="inline-flex rounded-full bg-gold px-7 py-3 text-eyebrow text-gold-foreground">Back to Home</Link><Link href="/plans" className="inline-flex rounded-full border border-foreground/30 px-7 py-3 text-eyebrow">View Membership Plans</Link></div></div></div>;
}
