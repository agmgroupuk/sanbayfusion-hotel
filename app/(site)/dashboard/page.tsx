import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { and, asc, desc, eq, gte, lte, sql } from "drizzle-orm";
import { CustomerDashboard } from "@/components/dashboard/customer-dashboard";
import { getCurrentAccount } from "@/lib/auth";
import { db } from "@/lib/db";
import { customerOrders, membershipDeliveryEntitlements, membershipRequests } from "@/lib/db/schema";
import { ensureMembershipDeliverySchedule } from "@/lib/membership-activation";

export const metadata: Metadata = { title: "Member Dashboard", description: "Your Sanbay Fusion membership overview.", robots: { index: false, follow: false } };

export default async function DashboardPage() {
  const account = await getCurrentAccount();
  if (!account) redirect("/signin?next=/dashboard");
  const membership = db ? (await db.select().from(membershipRequests).where(sql`lower(${membershipRequests.email}) = ${account.email}`).orderBy(desc(membershipRequests.createdAt)).limit(1))[0] ?? null : null;
  if (membership?.status === "active") await ensureMembershipDeliverySchedule(membership);
  const orders = db ? (await db.select().from(customerOrders).where(eq(customerOrders.accountId, account.id)).orderBy(desc(customerOrders.createdAt)).limit(5)) : [];
  const today = new Date().toISOString().slice(0, 10);
  const deliveryEntitlements = db && membership?.status === "active" ? await db.select().from(membershipDeliveryEntitlements)
    .where(and(
      eq(membershipDeliveryEntitlements.membershipRequestId, membership.id),
      lte(membershipDeliveryEntitlements.cycleStartDate, today),
      gte(membershipDeliveryEntitlements.cycleEndDate, today),
    ))
    .orderBy(asc(membershipDeliveryEntitlements.sequence)) : [];
  return <CustomerDashboard account={account} membership={membership} orders={orders} deliveryEntitlements={deliveryEntitlements} />;
}