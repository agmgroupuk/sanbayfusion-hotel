export const dynamic = "force-dynamic";
import { redirect, notFound } from "next/navigation";
import { getCurrentAccount } from "@/lib/auth";
import { getRecoveryPayment, getApplicationForAccount } from "@/lib/membership-application";
import { stripePublishableKey } from "@/lib/stripe";
import { MembershipPaymentRecovery } from "@/components/membership/membership-payment-recovery";
export default async function PaymentRecovery({ searchParams }: { searchParams: Promise<{ id?: string }> }) {
  const { id } = await searchParams;
  const account = await getCurrentAccount();
  if (!account) redirect(`/signin?next=${encodeURIComponent(`/membership/payment?id=${id ?? ""}`)}`);
  if (!id || !/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const row = await getApplicationForAccount(id, account.id).catch(() => null);
  if (!row || !row.approvedAt) notFound();
  const initial = await getRecoveryPayment(id, account.id);
  return <div className="mx-auto max-w-2xl space-y-6 px-5 py-32"><h1 className="font-display text-4xl">Confirm your approved membership payment</h1><p>{row.planName} · Authorized amount ฿{row.estimatedTotal.toLocaleString("en-US")}</p><MembershipPaymentRecovery applicationId={id} publishableKey={stripePublishableKey} initial={initial} /></div>;
}
