import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { getCurrentAccount } from "@/lib/auth";
import { addresses, listCards, accountMemberships, accountPayments } from "@/lib/account/service";
import { securityStatus } from "@/lib/account/security";
import { AddressManager, PersonalInformation, PaymentMethods, SecuritySettings } from "@/components/account/account-forms";
import { stripePublishableKey } from "@/lib/stripe";
import { hasActiveMembership, membershipHasExpired } from "@/lib/membership-term";
import { PackageSummary } from "@/components/membership/package-summary";
import type { MembershipPurchaseSnapshot } from "@/lib/membership-request";
export const dynamic = "force-dynamic";
export default async function AccountSection({ params, searchParams }: { params: Promise<{ section: string }>; searchParams: Promise<{ emailToken?: string; setup_intent?: string }> }) {
 const { section } = await params; const query = await searchParams;
 if (!["personal", "addresses", "payment-methods", "security", "membership", "payments"].includes(section)) notFound();
 const account = await getCurrentAccount(); if (!account) redirect(`/signin?next=${encodeURIComponent(`/dashboard/${section}${query.emailToken ? `?emailToken=${query.emailToken}` : ""}`)}`);
 if (section === "personal") return <PersonalInformation account={{ fullName: account.fullName ?? "", displayName: account.displayName ?? "", phone: account.phone ?? "", email: account.email }} emailToken={query.emailToken} />;
 if (section === "addresses") return <AddressManager initial={await addresses(account.id)} name={account.fullName ?? ""} phone={account.phone ?? ""} />;
 if (section === "payment-methods") { const cards = await listCards(account.id).catch(() => null); return <PaymentMethods initial={cards ?? []} unavailable={cards === null} publishableKey={stripePublishableKey} setupId={query.setup_intent} />; }
 if (section === "security") { const security = await securityStatus(account.id); return <SecuritySettings enabled={security.enabled} email={account.email} recoveryCount={security.recoveryCodesRemaining} />; }
 if (section === "membership") {
   const memberships = await accountMemberships(account.id);
   return <div className="space-y-6"><h2 className="font-display text-3xl">Membership</h2>{!memberships.some(row => hasActiveMembership(row)) && <div className="rounded-sm border border-gold/40 p-6"><p className="text-eyebrow text-gold">No active membership</p><p className="mt-3 text-sm text-muted-foreground">Your existing applications and membership history appear below.</p><Link href="/plans" className="mt-4 inline-block text-sm text-gold underline">View plans</Link></div>}{memberships.map(row => <article key={row.id} className="space-y-5 rounded-sm border border-border/60 bg-card/40 p-6"><div className="flex flex-wrap justify-between gap-3"><h3 className="text-2xl">{row.planName}</h3><p className="text-sm text-gold">{(membershipHasExpired(row) ? "expired" : row.status).replaceAll("_", " ").toUpperCase()}</p></div><dl className="grid gap-4 text-sm sm:grid-cols-2">{[["Reference", row.requestNumber], ["Member ID", row.memberId ?? "Not issued"], ["Activation date", row.membershipStartDate ?? "Not activated"], ["Expiry date", row.membershipExpiryDate ?? "Not activated"], ["Payment status", row.invoiceStatus === "paid" ? "PAID" : "NOT PAID"], ["Membership duration", `${row.durationMonths} months`]].map(([label, value]) => <div key={label}><dt className="text-muted-foreground">{label}</dt><dd className="mt-1">{value}</dd></div>)}</dl>{!!row.purchaseSnapshot && <PackageSummary snapshot={row.purchaseSnapshot as MembershipPurchaseSnapshot} />}{hasActiveMembership(row) && <Link href="/dashboard/order" className="inline-block rounded-full bg-gold px-5 py-3 text-sm text-gold-foreground">Place order</Link>}</article>)}</div>;
 }
 const payments = await accountPayments(account.id);
 return <div className="space-y-6"><h2 className="font-display text-3xl">Invoices / payments</h2><p className="text-sm text-muted-foreground">Membership and order records linked to your account.</p>{!payments.length && <p className="rounded-sm border border-border/60 p-6">No invoices or payments yet.</p>}{payments.map(payment => <article key={payment.reference} className="grid gap-4 rounded-sm border border-border/60 bg-card/40 p-5 text-sm sm:grid-cols-[1fr_auto]"><div><h3 className="text-lg">{payment.description}</h3><p className="mt-2 break-all text-muted-foreground">{payment.reference} · {new Date(payment.date).toLocaleDateString("en-GB", { timeZone: "Asia/Bangkok" })}</p></div><div className="sm:text-right"><p className="text-lg text-gold">{payment.currency} {payment.amount.toLocaleString("en-US")}</p><p className="mt-2">{payment.status.replaceAll("_", " ").toUpperCase()}</p></div></article>)}</div>;
}
