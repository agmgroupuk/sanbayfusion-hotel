import { PackageSummary } from "@/components/membership/package-summary";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { desc, eq } from "drizzle-orm";
import { AdminApprovalForm } from "@/components/membership/admin-approval-form";
import { getCurrentAccount } from "@/lib/auth";
import { db } from "@/lib/db";
import { membershipRequests } from "@/lib/db/schema";
import { activateMembershipRequest } from "@/lib/membership-activation";
import { isMembershipAdmin } from "@/lib/membership-admin";
import type { MembershipPurchaseSnapshot } from "@/lib/membership-request";

const money = (value: number) => `฿${value.toLocaleString("en-US")}`;

function AddressSummary({ title, address }: { title: string; address: unknown }) {
  const value = address && typeof address === "object" ? address as Record<string, unknown> : {};
  const parts = [value.line1, value.line2, value.subdistrict, value.district, value.province, value.postalCode, value.country].filter((part): part is string => typeof part === "string" && part.length > 0);
  return <div><p className="text-muted-foreground">{title}</p><p className="mt-1">{parts.length ? parts.join(", ") : "Not provided"}</p></div>;
}

export default async function ActivateMembershipPage() {
  const account = await getCurrentAccount();
  if (!account) redirect("/signin?next=%2Fadmin%2Factivate-membership");
  if (!isMembershipAdmin(account.email)) redirect("/dashboard");

  const pending = db ? await db.select().from(membershipRequests)
    .where(eq(membershipRequests.status, "payment_received"))
    .orderBy(desc(membershipRequests.createdAt))
    .limit(50) : [];

  return <main className="mx-auto max-w-6xl px-5 py-28 sm:px-8"><p className="text-eyebrow text-gold">Staff review</p><h1 className="mt-3 font-display text-5xl font-light italic">Paid memberships pending approval</h1><p className="mt-4 max-w-2xl text-sm leading-relaxed text-muted-foreground">Review the paid commercial agreement, customer information, and delivery details before final activation.</p><div className="mt-8 space-y-6">{pending.length === 0 && <p className="border-t border-border/60 pt-5 text-sm text-muted-foreground">No paid memberships are waiting for review.</p>}{pending.map((item) => {
    const snapshot = item.purchaseSnapshot as MembershipPurchaseSnapshot | null;
    const address = item.address && typeof item.address === "object" ? item.address as Record<string, unknown> : {};
    const billingAddress = address.billing ?? item.address;
    const deliveryAddress = address.delivery ?? item.address;
    const approve = async () => {
      "use server";
      const current = await getCurrentAccount();
      if (!current || !isMembershipAdmin(current.email)) redirect("/dashboard");
      await activateMembershipRequest({ id: item.id, actor: current.email });
      revalidatePath("/admin/activate-membership");
      revalidatePath("/dashboard");
    };
    return <article key={item.id} className="rounded-sm border border-border/60 bg-card/30 p-6 sm:p-8"><div className="flex flex-wrap justify-between gap-4 border-b border-border/50 pb-5"><div><p className="text-eyebrow text-gold">{item.requestNumber}</p><h2 className="mt-2 font-display text-2xl font-light italic">{item.fullName}</h2></div><div className="text-right"><p className="text-sm text-gold">PAID · PENDING REVIEW</p><p className="mt-1 text-xs text-muted-foreground">{item.email}</p></div></div><div className="mt-5 grid gap-5 text-sm sm:grid-cols-2 lg:grid-cols-3"><div><p className="text-muted-foreground">Plan</p><p className="mt-1">{item.planName}</p></div><div><p className="text-muted-foreground">Purchase mode</p><p className="mt-1">{snapshot?.purchaseMode === "membership_with_package" ? "Membership + prepaid package" : "Membership only"}</p></div><div><p className="text-muted-foreground">Membership fee</p><p className="mt-1">{money(snapshot?.membershipFee ?? item.annualFee)}</p></div><div><p className="text-muted-foreground">Package subtotal</p><p className="mt-1">{money(snapshot?.packageSubtotal ?? 0)}</p></div><div><p className="text-muted-foreground">Total paid</p><p className="mt-1 text-gold">{money(item.estimatedTotal)}</p></div><div><p className="text-muted-foreground">Payment reference</p><p className="mt-1 break-all">{item.stripePaymentIntentId ?? "Missing reference"}</p></div><div><p className="text-muted-foreground">Stripe Customer</p><p className="mt-1 break-all">{item.stripeCustomerId ?? "Not linked"}</p></div><div><p className="text-muted-foreground">Membership Duration</p><p className="mt-1">{item.durationMonths} months from final activation</p></div><div><p className="text-muted-foreground">Schedule</p><p className="mt-1">{snapshot?.delivery.area ?? "Not set"} · {snapshot?.delivery.preferredDay ?? "Not set"} · {snapshot?.delivery.preferredTime ?? "Not set"}</p></div><AddressSummary title="Billing address" address={billingAddress} /><AddressSummary title="Delivery address" address={deliveryAddress} /><div><p className="text-muted-foreground">Mobile</p><p className="mt-1">{item.phone || "Not provided"}</p></div></div>{snapshot && <div className="mt-6"><PackageSummary snapshot={snapshot} /></div>}<AdminApprovalForm action={approve} /></article>;
  })}</div></main>;
}
