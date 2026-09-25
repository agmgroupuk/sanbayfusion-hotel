import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { desc, eq, sql } from "drizzle-orm";
import { CustomerDashboard } from "@/components/dashboard/customer-dashboard";
import { getCurrentAccount } from "@/lib/auth";
import { db } from "@/lib/db";
import { customerOrders, membershipRequests } from "@/lib/db/schema";

export const metadata: Metadata = { title: "Member Dashboard", description: "Your Sanbay Fusion membership overview.", robots: { index: false, follow: false } };

export default async function DashboardPage() {
  const account = await getCurrentAccount();
  if (!account) redirect("/signin?next=/dashboard");
  const membership = db ? (await db.select().from(membershipRequests).where(sql`lower(${membershipRequests.email}) = ${account.email}`).orderBy(desc(membershipRequests.createdAt)).limit(1))[0] ?? null : null;
  const orders = db ? (await db.select().from(customerOrders).where(eq(customerOrders.accountId, account.id)).orderBy(desc(customerOrders.createdAt)).limit(5)) : [];
  return <CustomerDashboard account={account} membership={membership} orders={orders} now={Date.now()} />;
}