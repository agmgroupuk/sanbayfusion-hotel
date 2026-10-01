export const dynamic = "force-dynamic";
import Link from "next/link";
import { redirect, notFound } from "next/navigation";
import { getCurrentAccount } from "@/lib/auth";
import { getApplicationForAccount } from "@/lib/membership-application";
import type { ApplicationSnapshot } from "@/lib/membership-application-types";
import { PackageSummary } from "@/components/membership/package-summary";
export default async function RequestReceived({ searchParams }: { searchParams: Promise<{ id?: string }> }) {
  const { id } = await searchParams;
  const account = await getCurrentAccount();
  if (!account) redirect(`/signin?next=${encodeURIComponent(`/membership/request-received?id=${id ?? ""}`)}`);
  if (!id || !/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const row = await getApplicationForAccount(id, account.id).catch(() => null);
  const application = row?.applicationSnapshot as ApplicationSnapshot | null;
  if (!row || !application) notFound();
  return <div className="mx-auto max-w-3xl space-y-6 px-5 py-32"><p className="text-eyebrow text-gold">REQUEST RECEIVED</p><h1 className="font-display text-4xl">Thank you for applying for Sanbay Fusion membership.</h1><div className="space-y-3 border border-gold/40 p-6"><p>Application reference: {row.requestNumber}</p><p>Membership: {row.planName} · {row.durationMonths} months</p><p>{application.purchase.purchaseMode === "membership_with_package" ? "Membership + prepaid package" : "Membership only"}</p><p>Expected charge upon approval: <strong className="text-gold">฿{application.expectedAmount.toLocaleString("en-US")}</strong></p><p>Application status: {row.status.replaceAll("_", " ").toUpperCase()}</p><p>Payment method: {application.paymentMethod.brand} •••• {application.paymentMethod.last4}</p></div>{row.status === "pending_review" ? <div className="space-y-3"><p>No membership charge has been completed at this stage.</p><p>Your application will be reviewed by our team.</p><p>If approved, the authorized membership/package amount will be processed using the payment method provided with your application.</p></div> : <p>Your application status has changed since submission. Check your dashboard for current payment and membership details.</p>}<PackageSummary snapshot={application.purchase} /><Link className="inline-block rounded-full bg-gold px-6 py-3 text-gold-foreground" href="/dashboard">Go to dashboard</Link></div>;
}
