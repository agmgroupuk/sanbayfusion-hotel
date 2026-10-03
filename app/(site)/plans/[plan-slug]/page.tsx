import type { Metadata } from "next";
import { createPageMetadata } from "@/lib/seo";
import { notFound } from "next/navigation";
import { MembershipDetail } from "@/components/membership/membership-detail";
import { membershipPlans } from "@/lib/membership-plans";
import { getCurrentAccount } from "@/lib/auth";
import { membershipPlanStatus } from "@/lib/membership-access";
export const dynamic = "force-dynamic";

type PlanPageProps = {
  params: Promise<{ "plan-slug": string }>;
};

export async function generateMetadata({ params }: PlanPageProps): Promise<Metadata> {
  const { "plan-slug": slug } = await params;
  const plan = membershipPlans.find((item) => item.slug === slug);
  if (!plan) return { title: "Membership not found", robots: { index: false, follow: false } };
  return createPageMetadata(`/plans/${plan.slug}`, `${plan.name} for International Visitors`, `${plan.name}: THB ${plan.price.toLocaleString("en-US")} for ${plan.durationMonths} selected service months. For eligible international visitors to Thailand; application approval required.`);
}

export default async function PlanDetailPage({ params }: PlanPageProps) {
  const { "plan-slug": slug } = await params;
  const plan = membershipPlans.find((item) => item.slug === slug);
  if (!plan) notFound();
  const blockedStatus = await membershipPlanStatus(await getCurrentAccount(), plan.id);
  return <MembershipDetail plan={plan} blockedStatus={blockedStatus} today={new Date().toISOString()} />;
}
