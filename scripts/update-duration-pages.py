from pathlib import Path
import re
root=Path(__file__).resolve().parents[1]
def read(p): return (root/p).read_text(encoding='utf-8')
def write(p,s): (root/p).write_text(s,encoding='utf-8')

write('components/dashboard/customer-dashboard.tsx','''import Link from "next/link";
import { signOut } from "@/app/auth/actions";
import type { CustomerAccount, CustomerOrder, MembershipRequest, MembershipDeliveryEntitlement } from "@/lib/db/schema";
import type { MembershipPurchaseSnapshot } from "@/lib/membership-request";
import { hasActiveMembership, membershipDaysRemaining } from "@/lib/membership-term";
import { PackageSummary } from "@/components/membership/package-summary";

const money = (value: number) => `฿${value.toLocaleString("en-US")}`;
const date = (value: Date | string | null | undefined) => value ? new Intl.DateTimeFormat("en-GB", { timeZone: "Asia/Bangkok", day: "numeric", month: "long", year: "numeric" }).format(new Date(value)) : "Pending activation";
const statusLabel = (value: string) => value === "payment_received" ? "PENDING REVIEW" : value.replaceAll("_", " ").toUpperCase();

export function CustomerDashboard({ account, membership, orders, deliveryEntitlements }: { account: CustomerAccount; membership: MembershipRequest | null; orders: CustomerOrder[]; deliveryEntitlements: MembershipDeliveryEntitlement[] }) {
  const active = hasActiveMembership(membership);
  const final = membership?.finalMembershipSnapshot as { purchase?: MembershipPurchaseSnapshot } | null;
  const snapshot = final?.purchase ?? membership?.purchaseSnapshot as MembershipPurchaseSnapshot | null;
  const remaining = membershipDaysRemaining(membership?.membershipExpiryDate ?? null);
  return <div className="mx-auto max-w-7xl px-5 pb-28 pt-28 sm:px-8 sm:pt-36">
    <div className="flex flex-wrap justify-between gap-6 border-b border-border/60 pb-10"><div><p className="text-eyebrow text-gold">Customer portal</p><h1 className="mt-4 font-display text-5xl font-light italic">Welcome, {account.fullName?.split(/\\s+/)[0] || "there"}</h1></div><form action={signOut}><button className="rounded-full border border-foreground/30 px-5 py-3 text-eyebrow">SIGN OUT</button></form></div>
    {!membership ? <section className="mt-10 space-y-5"><h2 className="font-display text-3xl">No Active Membership</h2><Link href="/plans" className="text-gold underline">VIEW MEMBERSHIP PLANS</Link></section> : <>
      <section className="mt-10 rounded-sm border border-gold/50 bg-gold/5 p-7"><p className="text-eyebrow text-gold">Membership status</p><p className="mt-3 text-xl">{statusLabel(membership.status)}</p><dl className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {[["Plan", membership.planName], ["Membership Duration", `${membership.durationMonths} ${membership.durationMonths === 1 ? "Month" : "Months"}`], ["Member ID", membership.membershipNumber ?? "Pending issuance"], ["Start Date", date(membership.membershipStartDate)], ["Expiry Date", date(membership.membershipExpiryDate)], ["Time Remaining", active ? `${remaining} ${remaining === 1 ? "day" : "days"}` : membership.status === "expired" ? "Expired" : "Not active"]].map(([label, value]) => <div key={label}><dt className="text-sm text-muted-foreground">{label}</dt><dd className="mt-2">{value}</dd></div>)}
      </dl></section>
      {membership.status === "payment_received" && <section className="mt-8 border border-gold/40 p-6"><h2 className="text-eyebrow text-gold">PAID · PENDING REVIEW</h2><p className="mt-4 text-sm">Our team will review your details and contact you within up to 3 days. Your Member ID is issued and your selected term begins only after final approval.</p></section>}
      {membership.status === "expired" && <section className="mt-8 border border-border/60 p-6"><h2 className="font-display text-2xl">Your membership has expired</h2><p className="mt-3 text-sm">Ordering access has ended. Choose any 1 to 12 month plan to purchase a new term.</p><Link href="/plans" className="mt-5 inline-flex rounded-full bg-gold px-6 py-3 text-eyebrow text-gold-foreground">RENEW MEMBERSHIP</Link></section>}
      {snapshot && <div className="mt-8 rounded-sm border border-border/60 p-6 sm:p-8"><PackageSummary snapshot={snapshot} /></div>}
      <section id="invoices" className="mt-8 grid gap-6 border-y border-border/60 py-7 sm:grid-cols-3"><div><p className="text-sm text-muted-foreground">Payment Status</p><p className="mt-2 text-gold">{membership.invoiceStatus === "paid" ? "PAID" : statusLabel(membership.invoiceStatus ?? "awaiting_payment")}</p></div><div><p className="text-sm text-muted-foreground">Membership Fee</p><p className="mt-2">{money(snapshot?.membershipFee ?? membership.annualFee)}</p></div><div><p className="text-sm text-muted-foreground">{membership.invoiceStatus === "paid" ? "Total Paid" : "Total Due"}</p><p className="mt-2">{money(membership.estimatedTotal)}</p></div></section>
      {deliveryEntitlements.length > 0 && <section className="mt-8"><h2 className="text-eyebrow text-gold">Historical delivery schedule</h2><div className="mt-4 space-y-3">{deliveryEntitlements.map(item => <p key={item.id} className="text-sm">{item.scheduledDate ? date(item.scheduledDate) : "Date to be arranged"} · {statusLabel(item.status)}</p>)}</div></section>}
      <section className="mt-8"><h2 className="text-eyebrow text-gold">Quick actions</h2><div className="mt-5 flex flex-wrap gap-4">{active && <Link href="/dashboard/order" className="rounded-full bg-gold px-6 py-3 text-eyebrow text-gold-foreground">PLACE ORDER</Link>}<Link href="/plans" className="rounded-full border border-foreground/30 px-6 py-3 text-eyebrow">VIEW PLANS</Link></div></section>
    </>}
    <section className="mt-12"><h2 className="text-eyebrow text-gold">Recent orders</h2><div className="mt-5 space-y-4">{orders.length === 0 ? <p className="text-sm text-muted-foreground">No orders yet.</p> : orders.map(order => <article key={order.id} className="flex flex-wrap justify-between gap-4 border border-border/60 p-5 text-sm"><span>{order.orderNumber} · {date(order.createdAt)}</span><span>{money(order.total)} · {statusLabel(order.paymentStatus)}</span></article>)}</div></section>
  </div>;
}
''')

write('app/(site)/how-it-works/page.tsx','''import type { Metadata } from "next";
import Link from "next/link";
import { PageHeader } from "@/components/site/page-header";

export const metadata: Metadata = { title: "How It Works", description: "Membership duration, prepaid packages, payment, approval, and renewal.", alternates: { canonical: "/how-it-works" } };
const steps = [
  ["Choose your duration", "Select one of 12 plans: 1 to 12 months. The selected duration is your membership term."],
  ["Choose your purchase", "Buy membership only, or add a prepaid food and beverage package with eligible add-ons."],
  ["Pay once", "Review the actual products, monthly quantities, term quantities, prices, and total due today before secure checkout."],
  ["Team review", "Successful payment means PAID / PENDING REVIEW. Our team contacts you within up to 3 days."],
  ["Final activation", "After admin approval, your Member ID is issued. Your membership starts on activation and expires after the selected number of calendar months."],
  ["Order and renew", "Active members may buy additional products separately from the dashboard. Ordering access ends at expiry. Renewal requires a new authorized purchase."],
];
export default function HowItWorksPage() {
  return <div className="pb-28"><PageHeader eyebrow="The membership process" title="Choose your term. Make it yours." lead="One payment for a membership lasting 1 to 12 months, beginning after final approval." /><main className="mx-auto max-w-7xl px-5 sm:px-8">
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">{steps.map(([title, description], index) => <article key={title} className="rounded-sm border border-border/60 p-7"><p className="text-eyebrow text-gold">0{index + 1}</p><h2 className="mt-5 font-display text-2xl">{title}</h2><p className="mt-4 text-sm leading-relaxed text-muted-foreground">{description}</p></article>)}</div>
    <section className="mt-16 grid gap-6 md:grid-cols-2"><article className="border border-gold/40 bg-gold/5 p-7"><h2 className="font-display text-3xl">Membership only</h2><p className="mt-5">Total due today = membership fee.</p><p className="mt-4 text-sm text-muted-foreground">For example, a 3-Month Membership costs ฿15,000. Additional food and beverage orders are paid separately after activation.</p></article><article className="border border-gold/40 bg-gold/5 p-7"><h2 className="font-display text-3xl">Membership + prepaid package</h2><p className="mt-5">Product total = unit price × monthly quantity × membership months.</p><p className="mt-4 text-sm text-muted-foreground">Monthly add-ons use the same duration multiplier. One-time add-ons are charged once. All selected products and add-ons are paid together with the membership fee.</p></article></section>
    <section className="mt-12 border-y border-border/60 py-8"><h2 className="font-display text-3xl">Package quantities and delivery scheduling</h2><p className="mt-5 max-w-3xl text-sm leading-relaxed text-muted-foreground">Four units per month means four units in each membership month, not four separate deliveries. Delivery dates and distribution are arranged separately. Your paid package prices and quantities are saved for your selected term and do not change when catalog prices change.</p><p className="mt-4 text-sm text-muted-foreground">A 3-month term activated on 10 October 2026 expires on 10 January 2027. Benefits end at the start of the expiry date in Bangkok time.</p></section>
    <Link href="/plans" className="mt-10 inline-flex rounded-full bg-gold px-7 py-3 text-eyebrow text-gold-foreground">VIEW MEMBERSHIP PLANS</Link>
  </main></div>;
}
''')

p='components/membership/application-form.tsx';s=read(p)
s=s.replace('import { useEffect, useMemo, useState, useTransition }','import { startTransition, useEffect, useState, useTransition }')
s=s.replace('import { catalogueCategories } from "@/lib/catalogue";', 'import Link from "next/link";\nimport { PackageSummary } from "@/components/membership/package-summary";\nimport { calculateMembershipQuote } from "@/lib/membership-request";')
s=s.replace('beverageAddOns, ','')
s=re.sub(r'type ApplicationFormState = \{.*?\};\n','',s,flags=re.S)
s=re.sub(r'  const addOnTotal = useMemo\(.*?\}, \[configuration\]\);','  const quote = configuration && plan ? calculateMembershipQuote(configuration, plan) : null;\n  const addOnTotal = quote?.packageSubtotal ?? 0;',s,flags=re.S)
s=s.replace('<a href="/plans"','<Link href="/plans"').replace('View Membership Plans</a>','View Membership Plans</Link>')
s=s.replace('12-month membership','{plan.durationMonths}-month membership').replace('<span>12 months</span>','<span>{plan.durationMonths} months</span>')
s=s.replace('>Delivery</dt>','>Membership Duration</dt>').replace("3 days' advance",'3 days&apos; advance')
start=s.index('{configuration.selectedProducts.length > 0 && <div')
end=s.index('<div className="mt-6 flex items-center justify-between',start)
s=s[:start]+'{quote && <div className="mt-6"><PackageSummary snapshot={quote.purchaseSnapshot} /></div>}'+s[end:]
write(p,s)

p='components/membership/admin-approval-form.tsx';s=read(p).replace('its 12-month term','its selected membership term');write(p,s)
p='components/delivery/delivery-check.tsx';s=read(p).replace('{ fields: ["place_id"','{ componentRestrictions: { country: ["th"] }, fields: ["place_id"').replace('{plan.name} · {plan.level}','{plan.name}').replace('membership level','membership plan');write(p,s)
p='app/api/delivery/eligibility/route.ts';s=read(p).replace('const result = checkDeliveryEligibility(data, selectedPlan?.level);','if (data.selectedPlanId && !selectedPlan) return NextResponse.json({ error: "Membership plan is not available." }, { status: 400 });\n  const result = checkDeliveryEligibility(data);');write(p,s)
p='app/(site)/pricing/page.tsx';s=read(p);s='import { membershipPlans } from "@/lib/membership-plans";\n'+s
s=re.sub(r'const membershipPrices = \[.*?\];', 'const membershipPrices = membershipPlans.map(plan => [plan.name, `฿${plan.price.toLocaleString("en-US")} one time`, plan.description]);',s,flags=re.S);write(p,s)

p='app/(site)/faq/page.tsx';s=read(p)
s=s.replace('All standard memberships are valid for 12 months from the confirmed membership start date, unless otherwise stated in the final membership agreement.','Choose 1 to 12 months. Your selected duration is the actual membership term, beginning on final activation after admin approval.')
s=s.replace('Payment authorizes the membership and activates access once the payment lifecycle confirms it.','Payment marks your purchase paid and pending review. Our team contacts you within up to 3 days; access starts after admin approval.')
s=s.replace('The initial invoice is for the membership fee only unless an administrator explicitly adds another approved charge. Future food, beverage, delivery, or order charges are separate where applicable.','Membership only charges the plan fee. Membership with a prepaid package also charges selected monthly products multiplied by membership months, monthly add-ons, and one-time add-ons. All charges are shown before payment.')
s=s.replace('delivery entitlement, ','').replace('12-month membership','selected membership term').replace('12-month term','selected duration')
s=s.replace('Unused monthly opportunities do not roll over indefinitely by default.','Package quantities and delivery scheduling are separate. Contact the team about scheduling and distribution.')
s=s.replace('After payment is confirmed, the team begins membership setup. You will normally receive your membership number, card/details, activation date, expiry date, finalized package, and ordering instructions within approximately 3 days.','After payment you are PAID / PENDING REVIEW. The team contacts you within up to 3 days. Final admin approval issues your Member ID and starts your selected membership term.')
s=s.replace('["What happens when my membership expires?",','["How are prepaid quantities calculated?", "Each product costs its unit price × monthly quantity × membership months. A quantity of 4 per month in a 3-month term includes 12 units. Monthly add-ons use the duration multiplier; one-time add-ons are charged once. Delivery frequency does not determine pricing."],\n      ["What happens when my membership expires?",')
write(p,s)

p='app/(site)/terms-and-conditions/page.tsx';s=read(p)
s=s.replace('["12-month membership", "The term begins on the confirmed activation date."]','["1 to 12 month membership", "Your selected duration begins on final activation after admin approval."]')
s=s.replace('["3-day invoice window", "Approved members must pay the annual invoice within 3 days."]','["Paid, pending review", "After payment, our team contacts you within up to 3 days before final approval."]')
s=s.replace('annual invoices','payments').replace('delivery entitlements','package quantities').replace('delivery entitlement','package quantity').replace('annual membership invoice','membership invoice').replace('annual fee','membership fee').replace('annual membership\n          fee','membership\n          fee').replace('12-month term','selected membership term')
s=s.replace('Unless the final membership agreement says otherwise, every membership lasts\n          12 months from the official confirmed activation date.', 'Each new membership lasts for the selected 1 to 12 calendar months from final\n          activation after admin approval. The start and exclusive expiry dates appear in the dashboard.')
s=s.replace('Each plan has a defined number of eligible delivery days per month. An\n          entitlement means the member may request a delivery according to the plan; it\n          does not mean a package is sent automatically.', 'Selected prepaid product quantities are monthly quantities. Each product is priced\n          at its unit price multiplied by its monthly quantity and the membership duration.\n          Monthly add-ons follow the same rule; one-time add-ons are charged once.\n          Package quantities do not specify delivery counts. Scheduling and distribution\n          are arranged separately within the membership term.')
s=s.replace('updated="20 September 2026"','updated="1 October 2026"')
s=s.replace('Submitting a membership request does not create or activate a membership and\n          does not take payment. Every application is subject to review by {site.name}.','Selecting a plan does not activate membership. Checkout collects the membership fee\n          and any selected prepaid package charges once. Successful payment places the\n          membership in paid, pending review status with {site.name}.')
s=s.replace('An approved application may receive an membership invoice.', 'A paid application is reviewed before activation.')
s=s.replace('An approved application may receive an membership invoice.', 'A paid application is reviewed before activation.')
s=s.replace('An approved application may receive an membership invoice.', 'A paid application is reviewed before activation.')
s=s.replace('An approved application may receive an membership invoice.', 'A paid application is reviewed before activation.')
s=s.replace('An approved application may receive an membership invoice.', 'A paid application is reviewed before activation.')
s=s.replace('An approved application may receive an membership invoice.', 'A paid application is reviewed before activation.')
write(p,s)
