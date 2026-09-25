import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { MemberOrderMenu } from "@/components/orders/member-order-menu";
import { getCurrentAccount } from "@/lib/auth";
import { db } from "@/lib/db";
import { membershipRequests } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";

export const metadata: Metadata = { title: "Member Order", description: "Build a Sanbay Fusion food and beverage order.", robots: { index: false, follow: false } };

export default async function MemberOrderPage() {
  const account = await getCurrentAccount();
  if (!account) redirect("/signin?next=/dashboard/order");
  const membership = db ? (await db.select().from(membershipRequests).where(eq(membershipRequests.email, account.email)).orderBy(desc(membershipRequests.createdAt)).limit(1))[0] ?? null : null;
  if (membership?.status !== "active") redirect("/dashboard");
  return <MemberOrderMenu />;
}