import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { MembershipDetail } from "@/components/membership/membership-detail";
import { membershipPlans } from "@/lib/membership-plans";
import { getCurrentAccount } from "@/lib/auth";
import { accountHasOngoingMembership } from "@/lib/membership-access";
export const dynamic = "force-dynamic";

type PlanPageProps = {
  params: Promise<{ "plan-slug": string }>;
};

export async function generateMetadata({ params }: PlanPageProps): Promise<Metadata> {
  const { "plan-slug": slug } = await params;
  const plan = membershipPlans.find((item) => item.slug === slug);
  return {
    title: plan ? `${plan.name} · Membership` : "Membership detail",
    description: plan ? `${plan.name}: ฿${plan.price.toLocaleString("en-US")} for ${plan.durationMonths} selected service months for eligible foreign visitors normally living outside Thailand, with an included Standard Meal allowance.` : "Membership details.",
  };
}

export default async function PlanDetailPage({ params }: PlanPageProps) {
  const { "plan-slug": slug } = await params;
  const plan = membershipPlans.find((item) => item.slug === slug);
  if (!plan) notFound();
  const activeMembership = await accountHasOngoingMembership(await getCurrentAccount());
  return <MembershipDetail plan={plan} activeMembership={activeMembership} today={new Date().toISOString()} />;
}
