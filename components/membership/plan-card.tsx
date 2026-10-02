"use client";

import { useState } from "react";
import Link from "next/link";
import { Info, UtensilsCrossed } from "lucide-react";
import type { MembershipPlan } from "@/lib/membership-plans";
import { complimentaryBenefitConditions } from "@/lib/membership-service-months";
import { ActiveMembershipNotice } from "./active-membership-notice";
import { MembershipDialog } from "./membership-dialog";

const money = (value: number) => `฿${value.toLocaleString("en-US")}`;

export function PlanCard({ plan, activeMembership = false }: { plan: MembershipPlan; activeMembership?: boolean }) {
  const [open, setOpen] = useState(false);
  const action = (label: string) => activeMembership ? <ActiveMembershipNotice /> : <Link href={`/plans/${plan.slug}`} className="inline-flex w-full justify-center rounded-full bg-gold px-6 py-3 text-eyebrow leading-relaxed text-gold-foreground transition-colors hover:bg-gold/85">{label}</Link>;
  return <article className="flex h-full flex-col rounded-sm border border-border/60 bg-card/30 p-7 sm:p-8">
    <p className="text-eyebrow text-gold">Plan {String(plan.durationMonths).padStart(2, "0")}</p>
    <h2 className="mt-4 font-display text-3xl font-light italic">{plan.name}</h2>
    <p className="mt-6 text-3xl text-gold">{money(plan.price)}<span className="mt-2 block text-xs text-muted-foreground">Membership fee · one payment</span></p>
    <p className="mt-6 border-t border-border/60 pt-5 text-sm text-muted-foreground">Choose any<strong className="mt-1 block text-xl font-normal text-foreground">{plan.durationMonths} service {plan.durationMonths === 1 ? "month" : "months"}</strong></p>
    <div className="my-6 flex gap-3 text-sm"><UtensilsCrossed className="mt-1 size-5 shrink-0 text-gold" aria-hidden="true" /><div><p className="text-xs text-muted-foreground">Included</p><p className="mt-1">{plan.includedBenefit.name}</p><p className="mt-1 text-gold">Up to {money(plan.includedBenefit.menuValue)} / selected month</p></div></div>
    <button type="button" onClick={() => setOpen(true)} className="mb-5 inline-flex items-center gap-2 self-start text-sm text-gold underline-offset-4 hover:underline"><Info className="size-4" aria-hidden="true" />Plan details<span className="sr-only"> for {plan.name}</span></button>
    <div className="mt-auto">{action("Select plan")}</div>
    <MembershipDialog open={open} onClose={() => setOpen(false)} title={plan.name}>
      <dl className="mt-7 grid gap-5 border-y border-border py-6 sm:grid-cols-2"><div><dt className="text-sm text-muted-foreground">Membership fee</dt><dd className="mt-2 text-3xl text-gold">{money(plan.price)}</dd></div><div><dt className="text-sm text-muted-foreground">Service months</dt><dd className="mt-2">Choose exactly {plan.durationMonths} eligible {plan.durationMonths === 1 ? "month" : "months"}.</dd></div></dl>
      <div className="mt-6 space-y-4 text-sm leading-relaxed text-muted-foreground"><p>Select your service year and actual calendar months. Your selected months do not have to be consecutive.{plan.durationMonths === 3 && " For example: February, July and November in the chosen year."}{plan.durationMonths === 12 && " Select all 12 months of an eligible calendar year."} Past months are unavailable; the current month requires at least three days for advance scheduling.</p>
        <div className="border border-gold/40 bg-gold/5 p-5"><h3 className="text-eyebrow leading-relaxed text-gold">Included Standard Meal</h3><p className="mt-3 text-foreground">One {plan.includedBenefit.name} per selected service month, with eligible menu value up to {money(plan.includedBenefit.menuValue)} per month.</p><p className="mt-3">Included in the membership fee: {plan.durationMonths} Standard {plan.durationMonths === 1 ? "Meal" : "Meals"}, one for each selected month. {complimentaryBenefitConditions}</p></div>
        <p>You may choose <strong className="text-foreground">Membership only</strong> or <strong className="text-foreground">Membership + prepaid food/beverage package</strong>. This membership package accepts food and non-alcoholic beverages. Eligible Standard Meal orders above the allowance pay only the difference; additional orders are charged separately. You may schedule any, all or none of your included meals now and schedule available meals later in your dashboard.</p><p>Activation requires approval and successful payment. Service is available only in selected months, which become fixed on final submission. Availability, supported service areas, advance scheduling and applicable Thai laws apply.</p>
      </div><div className="mt-7">{action("Select this plan")}</div>
    </MembershipDialog>
  </article>;
}
