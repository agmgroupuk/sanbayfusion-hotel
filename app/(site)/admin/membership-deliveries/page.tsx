import { hasActiveMembership, membershipDate } from "@/lib/membership-term";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { and, asc, desc, eq, gte } from "drizzle-orm";
import { getCurrentAccount } from "@/lib/auth";
import { db } from "@/lib/db";
import { membershipDeliveryEntitlements, membershipRequests } from "@/lib/db/schema";
import type { MembershipDeliveryPackageSnapshot } from "@/lib/membership-delivery";
import { isMembershipAdmin } from "@/lib/membership-admin";

const date = (value: Date | string | null | undefined) => {
  if (!value) return "Not scheduled";
  const parsed = value instanceof Date ? value : new Date(`${value.slice(0, 10)}T00:00:00.000Z`);
  return new Intl.DateTimeFormat("en-GB", { day: "2-digit", month: "short", year: "numeric", timeZone: "UTC" }).format(parsed);
};
const money = (value: number) => `฿${value.toLocaleString("en-US")}`;

function readPackageSnapshot(value: unknown): MembershipDeliveryPackageSnapshot | null {
  if (!value || typeof value !== "object") return null;
  const snapshot = value as Partial<MembershipDeliveryPackageSnapshot>;
  if (!Array.isArray(snapshot.products) || !Array.isArray(snapshot.addOns)) return null;
  return snapshot as MembershipDeliveryPackageSnapshot;
}

export default async function MembershipDeliveriesPage() {
  const account = await getCurrentAccount();
  if (!account) redirect("/signin?next=%2Fadmin%2Fmembership-deliveries");
  if (!isMembershipAdmin(account.email)) redirect("/dashboard");
  const today = membershipDate();

  const scheduleDelivery = async (formData: FormData) => {
    "use server";
    const current = await getCurrentAccount();
    if (!current || !isMembershipAdmin(current.email) || !db) redirect("/dashboard");
    const id = String(formData.get("id") ?? "");
    const scheduledDate = String(formData.get("scheduledDate") ?? "");
    if (!/^\d{4}-\d{2}-\d{2}$/.test(scheduledDate)) return;
    const parsed = new Date(`${scheduledDate}T00:00:00.000Z`);
    if (Number.isNaN(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== scheduledDate) return;
    const [record] = await db.select({ entitlement: membershipDeliveryEntitlements, membership: membershipRequests })
      .from(membershipDeliveryEntitlements)
      .innerJoin(membershipRequests, eq(membershipDeliveryEntitlements.membershipRequestId, membershipRequests.id))
      .where(eq(membershipDeliveryEntitlements.id, id))
      .limit(1);
    const today = membershipDate();
    if (!record || !hasActiveMembership(record.membership) || record.entitlement.status !== "available" || scheduledDate < today || scheduledDate >= (record.membership.membershipExpiryDate ?? "") || scheduledDate < record.entitlement.cycleStartDate || scheduledDate > record.entitlement.cycleEndDate) return;
    await db.update(membershipDeliveryEntitlements)
      .set({ status: "scheduled", scheduledDate, updatedAt: new Date() })
      .where(and(eq(membershipDeliveryEntitlements.id, id), eq(membershipDeliveryEntitlements.status, "available")));
    revalidatePath("/admin/membership-deliveries");
    revalidatePath("/dashboard");
  };

  const fulfillDelivery = async (formData: FormData) => {
    "use server";
    const current = await getCurrentAccount();
    if (!current || !isMembershipAdmin(current.email) || !db) redirect("/dashboard");
    const id = String(formData.get("id") ?? "");
    const [record] = await db.select({ entitlement: membershipDeliveryEntitlements, membership: membershipRequests })
      .from(membershipDeliveryEntitlements)
      .innerJoin(membershipRequests, eq(membershipDeliveryEntitlements.membershipRequestId, membershipRequests.id))
      .where(eq(membershipDeliveryEntitlements.id, id))
      .limit(1);
    const today = membershipDate();
    if (!record || !hasActiveMembership(record.membership) || record.entitlement.status !== "scheduled" || !record.entitlement.scheduledDate || record.entitlement.scheduledDate > today) return;
    await db.update(membershipDeliveryEntitlements)
      .set({ status: "fulfilled", fulfilledAt: new Date(), fulfilledBy: current.email, updatedAt: new Date() })
      .where(and(eq(membershipDeliveryEntitlements.id, id), eq(membershipDeliveryEntitlements.status, "scheduled")));
    revalidatePath("/admin/membership-deliveries");
    revalidatePath("/dashboard");
  };

  const rows = db ? await db.select({ entitlement: membershipDeliveryEntitlements, membership: membershipRequests })
    .from(membershipDeliveryEntitlements)
    .innerJoin(membershipRequests, eq(membershipDeliveryEntitlements.membershipRequestId, membershipRequests.id))
    .where(and(eq(membershipRequests.status, "active"), gte(membershipDeliveryEntitlements.cycleEndDate, today)))
    .orderBy(asc(membershipDeliveryEntitlements.cycleStartDate), desc(membershipRequests.createdAt), asc(membershipDeliveryEntitlements.sequence))
    .limit(500) : [];

  return <main className="mx-auto max-w-6xl px-5 py-28 sm:px-8"><p className="text-eyebrow text-gold">Membership operations</p><h1 className="mt-3 font-display text-5xl font-light italic">Historical delivery schedules</h1><p className="mt-4 max-w-2xl text-sm leading-relaxed text-muted-foreground">This ledger preserves earlier delivery agreements. New duration memberships contain monthly product quantities; their delivery scheduling is arranged separately.</p><div className="mt-8 space-y-5">{rows.length === 0 && <p className="border-t border-border/60 pt-5 text-sm text-muted-foreground">No active delivery entitlements are available.</p>}{rows.filter(({ membership }) => hasActiveMembership(membership)).map(({ entitlement, membership }) => {
    const snapshot = readPackageSnapshot(entitlement.packageSnapshot);
    const includedItems = [...(snapshot?.products ?? []), ...(snapshot?.addOns ?? [])];
    const minDate = entitlement.cycleStartDate > today ? entitlement.cycleStartDate : today;
    return <article key={entitlement.id} className="rounded-sm border border-border/60 bg-card/30 p-5 sm:p-7"><div className="flex flex-wrap items-start justify-between gap-4"><div><p className="text-eyebrow text-gold">{membership.requestNumber} · {membership.fullName}</p><h2 className="mt-2 font-display text-2xl font-light italic">{membership.planName}</h2><p className="mt-2 text-sm text-muted-foreground">Membership month {date(entitlement.cycleStartDate)} to {date(entitlement.cycleEndDate)} · delivery {entitlement.sequence} of {membership.deliveryDays}</p></div><p className="text-sm text-gold">{entitlement.status.replaceAll("_", " ").toUpperCase()}</p></div>{includedItems.length > 0 && <div className="mt-5 border-t border-border/50 pt-4"><p className="text-xs text-eyebrow text-gold">Included package · no additional charge</p><div className="mt-2 divide-y divide-border/40">{includedItems.map((item) => <div key={`${item.category}:${item.name}`} className="flex flex-wrap justify-between gap-2 py-2 text-sm"><span>{item.name}<span className="ml-2 text-xs text-muted-foreground">{item.category} · qty {item.quantity}</span></span><span>{money(item.unitPrice * item.quantity)}</span></div>)}</div></div>}{entitlement.status === "available" && <form action={scheduleDelivery} className="mt-5 flex flex-wrap items-end gap-3 border-t border-border/50 pt-4"><input type="hidden" name="id" value={entitlement.id} /><label className="text-xs text-muted-foreground">Delivery date<input required type="date" name="scheduledDate" min={minDate} max={entitlement.cycleEndDate} className="mt-2 block h-10 rounded-sm border border-input bg-background px-3 text-sm" /></label><button className="h-10 rounded-full bg-gold px-5 text-eyebrow text-gold-foreground">SCHEDULE DELIVERY</button></form>}{entitlement.status === "scheduled" && <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-border/50 pt-4"><p className="text-sm">Scheduled for {date(entitlement.scheduledDate)}</p><form action={fulfillDelivery}><input type="hidden" name="id" value={entitlement.id} /><button className="rounded-full border border-gold px-5 py-3 text-eyebrow text-gold">MARK FULFILLED · NO CHARGE</button></form></div>}{entitlement.status === "fulfilled" && <p className="mt-5 border-t border-border/50 pt-4 text-sm text-muted-foreground">Fulfilled {date(entitlement.fulfilledAt)} by {entitlement.fulfilledBy ?? "staff"}. No payment was collected for this included delivery.</p>}</article>;
  })}</div></main>;
}