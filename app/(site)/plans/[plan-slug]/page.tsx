import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { MembershipDetail } from "@/components/membership/membership-detail";
import { membershipPlans } from "@/lib/membership-plans";

type PlanPageProps = {
  params: Promise<{ "plan-slug": string }>;
};

export function generateStaticParams() {
  return membershipPlans.map((plan) => ({ "plan-slug": plan.slug }));
}

export async function generateMetadata({ params }: PlanPageProps): Promise<Metadata> {
  const { "plan-slug": slug } = await params;
  const plan = membershipPlans.find((item) => item.slug === slug);
  return {
    title: plan ? `${plan.name} · Membership` : "Membership detail",
    description: plan ? `${plan.name}: ฿${plan.price.toLocaleString("en-US")} per year, ${plan.deliveryDays} delivery days per month, valid for 12 months.` : "Membership details.",
  };
}

export default async function PlanDetailPage({ params }: PlanPageProps) {
  const { "plan-slug": slug } = await params;
  const plan = membershipPlans.find((item) => item.slug === slug);
  if (!plan) notFound();
  return <MembershipDetail plan={plan} />;
}
