import { PackageSummary } from "@/components/membership/package-summary";
import type { Metadata } from "next";
import Link from "next/link";
import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { PageHeader } from "@/components/site/page-header";
import { getCurrentAccount } from "@/lib/auth";
import { db } from "@/lib/db";
import { membershipRequests } from "@/lib/db/schema";
import { recordMembershipPayment } from "@/lib/membership-activation";
import type { MembershipPurchaseSnapshot } from "@/lib/membership-request";
import { stripe } from "@/lib/stripe";

export const metadata: Metadata = { title: "Membership Payment Received", robots: { index: false, follow: false } };
const money = (value: number) => `฿${value.toLocaleString("en-US")}`;
const date = (value: Date | string | null | undefined) => value ? new Intl.DateTimeFormat("en-GB", { day: "2-digit", month: "short", year: "numeric" }).format(new Date(value)) : "Not set";

function addressLines(value: unknown) {
  if (!value || typeof value !== "object") return [];
  const address = value as Record<string, unknown>;
  return [address.line1, address.line2, address.subdistrict, address.district, address.province, address.postalCode, address.country]
    .filter((part): part is string => typeof part === "string" && part.trim().length > 0);
}

export default async function MembershipThankYouPage({ searchParams }: { searchParams: Promise<{ payment_intent?: string }> }) {
  const account = await getCurrentAccount();
  if (!account) redirect("/signin?next=%2Fmembership%2Fthank-you");
  if (!db || !stripe) redirect("/membership/payment-failed");
  const { payment_intent: paymentIntentId } = await searchParams;
  if (!paymentIntentId?.startsWith("pi_")) redirect("/membership/payment-failed");

  let intent;
  try {
    intent = await stripe.paymentIntents.retrieve(paymentIntentId);
  } catch {
    redirect("/membership/payment-failed");
  }
  if (intent.status !== "succeeded" || intent.metadata.payment_type !== "MEMBERSHIP_PURCHASE") redirect("/membership/payment-failed");
  const membershipId = intent.metadata.membership_id;
  if (!membershipId) redirect("/membership/payment-failed");
  const membership = (await db.select().from(membershipRequests)
    .where(eq(membershipRequests.id, membershipId))
    .limit(1))[0];
  if (!membership || membership.customerAccountId !== account.id) redirect("/dashboard");

  const recorded = await recordMembershipPayment({
    id: membership.id,
    stripeCustomerId: typeof intent.customer === "string" ? intent.customer : "",
    paymentIntentId: intent.id,
    amount: intent.amount,
    currency: intent.currency,
    purchaseMode: intent.metadata.purchase_mode ?? "",
    snapshotHash: intent.metadata.purchase_snapshot_hash,
  });
  if (!recorded) redirect("/membership/payment-failed");

  const snapshot = recorded.purchaseSnapshot as MembershipPurchaseSnapshot | null;
  const address = recorded.address && typeof recorded.address === "object" ? recorded.address as Record<string, unknown> : {};
  const billing = addressLines(address.billing ?? recorded.address);
  const delivery = addressLines(address.delivery ?? recorded.address);
  const packageIncluded = snapshot?.purchaseMode === "membership_with_package";

  return <div className="pb-28"><PageHeader eyebrow="Payment received" title="Thank You" lead="Your payment was verified securely. This receipt relates to the earlier payment-first application process. Check your dashboard for the current membership status." /><main className="mx-auto max-w-4xl px-5 sm:px-8"><section className="rounded-sm border border-gold/50 bg-gold/5 p-6 sm:p-9"><p className="text-lg font-medium text-gold">Your payment has been received and your membership is now pending final review.</p><p className="mt-4 text-sm leading-relaxed text-foreground/80">Our team will review your membership details and contact you if further information is needed. After approval, your Member ID and final membership details will be issued and will appear in your dashboard.</p><div className="mt-7 grid gap-4 border-y border-border/60 py-6 text-sm sm:grid-cols-2"><div><p className="text-muted-foreground">Membership</p><p className="mt-1">{recorded.planName}</p></div><div><p className="text-muted-foreground">Payment status</p><p className="mt-1 text-gold">PAID</p></div><div><p className="text-muted-foreground">Membership status</p><p className="mt-1">PENDING REVIEW</p></div><div><p className="text-muted-foreground">Purchase option</p><p className="mt-1">{packageIncluded ? "Membership + prepaid package" : "Membership only"}</p></div><div><p className="text-muted-foreground">Membership fee</p><p className="mt-1">{money(snapshot?.membershipFee ?? recorded.annualFee)}</p></div>{packageIncluded && <div><p className="text-muted-foreground">Prepaid package subtotal</p><p className="mt-1">{money(snapshot?.packageSubtotal ?? recorded.addOnTotal)}</p></div>}<div><p className="text-muted-foreground">Total paid</p><p className="mt-1 text-gold">{money(recorded.estimatedTotal)}</p></div><div><p className="text-muted-foreground">Reference</p><p className="mt-1">{recorded.requestNumber}</p></div><div><p className="text-muted-foreground">Customer</p><p className="mt-1">{recorded.fullName}</p></div><div><p className="text-muted-foreground">Email</p><p className="mt-1 break-all">{recorded.email}</p></div><div><p className="text-muted-foreground">Phone</p><p className="mt-1">{recorded.phone}</p></div><div><p className="text-muted-foreground">Membership Duration</p><p className="mt-1">{recorded.durationMonths} months from final activation</p></div><div><p className="text-muted-foreground">Delivery area</p><p className="mt-1">{snapshot?.delivery.area ?? "Not set"}</p></div><div><p className="text-muted-foreground">Preferred delivery day</p><p className="mt-1">{snapshot?.delivery.preferredDay ?? "Not set"}</p></div><div><p className="text-muted-foreground">Preferred time</p><p className="mt-1">{snapshot?.delivery.preferredTime ?? "Not set"}</p></div><div><p className="text-muted-foreground">Billing address</p><p className="mt-1">{billing.length ? billing.join(", ") : "Not provided"}</p></div><div><p className="text-muted-foreground">Delivery address</p><p className="mt-1">{delivery.length ? delivery.join(", ") : "Not provided"}</p></div></div>{packageIncluded && snapshot && <div className="mt-7"><PackageSummary snapshot={snapshot} /></div>}<div className="mt-7 flex flex-wrap gap-3"><Link href="/dashboard" className="rounded-full bg-gold px-6 py-3 text-eyebrow text-gold-foreground">GO TO DASHBOARD</Link><Link href="/plans" className="rounded-full border border-foreground/30 px-6 py-3 text-eyebrow">VIEW MEMBERSHIP PLANS</Link></div><p className="mt-6 text-xs text-muted-foreground">Payment reference verified · {date(recorded.createdAt)}</p></section></main></div>;
}
