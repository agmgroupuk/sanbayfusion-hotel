export const dynamic = "force-dynamic";
import { PackageSummary } from "@/components/membership/package-summary";
import { AdminApprovalForm } from "@/components/membership/admin-approval-form";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { desc, inArray } from "drizzle-orm";
import { getCurrentAccount } from "@/lib/auth";
import { db } from "@/lib/db";
import { membershipRequests } from "@/lib/db/schema";
import { activateMembershipRequest } from "@/lib/membership-activation";
import { approveApplication, declineApplication, ApplicationError } from "@/lib/membership-application";
import { isMembershipAdmin } from "@/lib/membership-admin";
import type { ApplicationSnapshot } from "@/lib/membership-application-types";
import type { MembershipPurchaseSnapshot } from "@/lib/membership-request";
const money = (value: number) => `฿${value.toLocaleString("en-US")}`;
export default async function ReviewMembershipPage() {
  const account = await getCurrentAccount();
  if (!account) redirect("/signin?next=%2Fadmin%2Factivate-membership");
  if (!isMembershipAdmin(account.email)) redirect("/dashboard");
  const pending = db ? await db.select().from(membershipRequests).where(inArray(membershipRequests.status, ["pending_review", "approved_payment_pending", "approved_payment_action_required", "approved_payment_failed", "payment_received"])).orderBy(desc(membershipRequests.createdAt)).limit(100) : [];
  return <div className="mx-auto max-w-6xl px-5 py-28"><p className="text-eyebrow text-gold">Staff review</p><h1 className="mt-3 font-display text-5xl">Membership applications</h1><p className="mt-4 text-muted-foreground">Review the saved agreement. Approval attempts the exact authorized charge; activation follows verified payment success.</p><div className="mt-8 space-y-6">{!pending.length && <p>No applications awaiting review.</p>}{pending.map(item => {
    const application = item.applicationSnapshot as ApplicationSnapshot | null;
    const purchase = item.purchaseSnapshot as MembershipPurchaseSnapshot;
    const legacy = !application && item.status === "payment_received";
    async function review(decline: boolean) {
      "use server";
      const current = await getCurrentAccount();
      if (!current || !isMembershipAdmin(current.email)) return "Administrator access required.";
      try {
        const row = decline ? await declineApplication(item.id, current.email) : legacy ? await activateMembershipRequest({ id: item.id, actor: current.email }) : await approveApplication(item.id, current.email);
        revalidatePath("/admin/activate-membership"); revalidatePath("/dashboard");
        return `Application status: ${row?.status.replaceAll("_", " ").toUpperCase() ?? "UNCHANGED"}`;
      } catch (error) { return error instanceof ApplicationError ? error.message : "The payment service could not complete this step. Refresh and retry; duplicate charges are prevented."; }
    }
    const address = (value: object) => Object.values(value).filter(Boolean).join(", ");
    return <article key={item.id} className="space-y-5 rounded-sm border border-gold/40 bg-card/30 p-6"><header><p className="text-eyebrow text-gold">{item.requestNumber} · {item.status.replaceAll("_", " ").toUpperCase()}</p><h2 className="mt-3 text-2xl">{item.fullName}</h2><p>{item.email} · {item.phone}</p></header><div className="grid gap-4 text-sm sm:grid-cols-2"><p>Plan: {item.planName} · {item.durationMonths} months</p><p>Expected charge: <strong className="text-gold">{money(item.estimatedTotal)}</strong> · {item.invoiceStatus === "paid" ? "PAID" : "NOT YET PAID"}</p><p>Purchase mode: {purchase?.purchaseMode === "membership_with_package" ? "Membership + prepaid package" : "Membership only"}</p><p>Stripe Customer: {item.stripeCustomerId}</p>{application && <><p>Account created: {application.accountCreatedAt}</p><p>Application submitted: {application.submittedAt}</p><p>Billing address: {address(application.billingAddress)}</p><p>Thailand delivery address: {address(application.deliveryAddress)}</p><p>Eligibility: {application.deliveryEligibility.status} · {application.deliveryEligibility.zoneId} · Checked {application.deliveryEligibility.checkedAt}</p><p>Saved card: {application.paymentMethod.brand} •••• {application.paymentMethod.last4} · {application.paymentMethod.expMonth}/{application.paymentMethod.expYear}</p><p className="break-all">PaymentMethod: {application.stripePaymentMethodId}</p><p>Consent version: {application.consent.version} · Accepted {application.consent.acceptedAt}</p><p className="sm:col-span-2">{application.consent.authorization} Authorized amount: {money(application.consent.amount)}. Terms and privacy accepted.</p></>}</div>{purchase && <PackageSummary snapshot={purchase} />}{item.paymentFailure && <p>{item.paymentFailure}</p>}{(application && ["pending_review", "approved_payment_pending"].includes(item.status) || legacy) && <AdminApprovalForm approve={review.bind(null, false)} decline={item.status === "pending_review" ? review.bind(null, true) : undefined} legacy={legacy} />}{!application && !legacy && <p>This historical request has no saved-payment authorization. New customer confirmation is required; it cannot be charged here.</p>}</article>;
  })}</div></div>;
}
