import type { Metadata } from "next";
import Link from "next/link";
import { desc, eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { getCurrentAccount } from "@/lib/auth";
import { db } from "@/lib/db";
import { membershipRequests } from "@/lib/db/schema";

export const metadata: Metadata = { title: "Membership Payment", robots: { index: false, follow: false } };

const date = (value: Date | string | null | undefined) => value ? new Intl.DateTimeFormat("en-GB", { day: "2-digit", month: "short", year: "numeric" }).format(new Date(value)) : "Pending confirmation";

export default async function MembershipSuccessPage({ searchParams }: { searchParams: Promise<{ membershipRequestId?: string }> }) {
  const account = await getCurrentAccount();
  if (!account) redirect("/signin?next=/membership/success");
  const params = await searchParams;
  const membership = db ? (await db.select().from(membershipRequests).where(eq(membershipRequests.customerAccountId, account.id)).orderBy(desc(membershipRequests.createdAt)).limit(1))[0] ?? null : null;
  const active = membership?.status === "active";
  return <main className="mx-auto max-w-4xl px-5 pb-28 pt-40 sm:px-8"><div className="border-y border-gold/50 py-14 text-center sm:py-20"><p className="text-eyebrow text-gold">{active ? "Membership activated" : "Payment received"}</p><h1 className="mt-5 font-display text-5xl font-light italic sm:text-7xl">{active ? "Welcome to Sanbay Fusion" : "We are confirming your payment"}</h1><p className="mx-auto mt-6 max-w-2xl text-base leading-relaxed text-muted-foreground">{active ? "Your verified Stripe Sandbox payment has activated your Sanbay Fusion membership." : "Stripe has returned the payment flow. Your membership will become active after the signed webhook confirms payment."}</p>{membership && <div className="mx-auto mt-10 grid max-w-xl gap-4 border-y border-border/60 py-6 text-left text-sm sm:grid-cols-2"><div><p className="text-muted-foreground">Member ID</p><p className="mt-1 text-gold">{membership.memberId ?? "Pending activation"}</p></div><div><p className="text-muted-foreground">Plan</p><p className="mt-1">{membership.planName}</p></div><div><p className="text-muted-foreground">Status</p><p className="mt-1">{membership.status.replaceAll("_", " ").toUpperCase()}</p></div><div><p className="text-muted-foreground">Valid until</p><p className="mt-1">{date(membership.membershipExpiryDate)}</p></div></div>}{params.membershipRequestId && !membership && <p className="mt-8 text-sm text-muted-foreground">Payment reference received. Check your dashboard for the latest status.</p>}<div className="mt-10 flex flex-wrap justify-center gap-3"><Link href="/dashboard" className="rounded-full bg-gold px-6 py-3 text-eyebrow text-gold-foreground">GO TO DASHBOARD</Link><Link href={active ? "/dashboard/order" : "/dashboard"} className="rounded-full border border-foreground/30 px-6 py-3 text-eyebrow hover:border-gold hover:text-gold">PLACE YOUR FIRST ORDER</Link></div></div></main>;
}
