import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "Payment Not Completed", robots: { index: false, follow: false } };

export default function MembershipPaymentFailedPage() {
  return <main className="mx-auto max-w-3xl px-5 pb-28 pt-40 sm:px-8"><section className="border-y border-border/60 py-14 text-center sm:py-20"><p className="text-eyebrow text-gold">Payment not completed</p><h1 className="mt-5 font-display text-5xl font-light italic sm:text-6xl">Your payment wasn&apos;t completed</h1><p className="mx-auto mt-6 max-w-xl text-base leading-relaxed text-muted-foreground">We could not confirm a successful membership payment. Your membership has not been submitted for final review, activated, or assigned a Member ID.</p><div className="mt-10 flex flex-wrap justify-center gap-3"><Link href="/membership/checkout" className="rounded-full bg-gold px-6 py-3 text-eyebrow text-gold-foreground">TRY PAYMENT AGAIN</Link><Link href="/dashboard" className="rounded-full border border-foreground/30 px-6 py-3 text-eyebrow">GO TO DASHBOARD</Link></div></section></main>;
}
