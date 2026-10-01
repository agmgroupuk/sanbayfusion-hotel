import type { Metadata } from "next";
import { PageHeader } from "@/components/site/page-header";
import { PlanCard } from "@/components/membership/plan-card";
import { membershipPlans } from "@/lib/membership-plans";

export const metadata: Metadata = { title: "Membership Plans", description: "Choose a 1 to 12 month Sanbay Fusion membership.", alternates: { canonical: "/plans" } };
export default function PlansPage() {
  return <div className="pb-28"><PageHeader eyebrow="Membership plans" title="Choose your membership duration" lead="Twelve plans, from 1 to 12 months. Pay once for your selected term, beginning on final activation after team approval." /><div className="mx-auto max-w-7xl px-5 sm:px-8"><div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">{membershipPlans.map(plan => <PlanCard key={plan.id} plan={plan} />)}</div><p className="mx-auto mt-10 max-w-2xl text-center text-sm text-muted-foreground">Choose membership only or add a prepaid package for the same membership period. Additional orders are paid separately. Renewal requires a new purchase.</p></div></div>;
}
