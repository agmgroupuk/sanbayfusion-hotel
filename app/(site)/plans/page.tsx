import { MembershipEligibilityNotice } from "@/components/membership/eligibility-notice";
import type { Metadata } from "next";
import { PageHeader } from "@/components/site/page-header";
import { PlanCard } from "@/components/membership/plan-card";
import { membershipPlans } from "@/lib/membership-plans";
import { getCurrentAccount } from "@/lib/auth";
import { accountHasOngoingMembership } from "@/lib/membership-access";
export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Membership Plans", description: "Membership plans for eligible foreign visitors who normally live outside Thailand and visit temporarily.", alternates: { canonical: "/plans" } };
export default async function PlansPage() {
  const activeMembership = await accountHasOngoingMembership(await getCurrentAccount());
  return <div className="pb-28"><PageHeader eyebrow="Membership plans" title="Plan your visit, month by month" lead="Choose 1 to 12 service months in a calendar year. Your months do not have to be consecutive, and one complimentary member meal is included in each selected month after approval and payment." /><div className="mx-auto max-w-7xl px-5 sm:px-8"><MembershipEligibilityNotice /><div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">{membershipPlans.map(plan => <PlanCard key={plan.id} plan={plan} activeMembership={activeMembership} />)}</div><p className="mx-auto mt-10 max-w-2xl text-center text-sm text-muted-foreground">Choose membership only or add a prepaid package for your selected service months. Included member benefits, prepaid packages and separately paid extra orders are distinct. Your selected months become fixed on final submission.</p></div></div>;
}
