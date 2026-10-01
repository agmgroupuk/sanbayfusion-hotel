import Link from "next/link";
import type { MembershipPlan } from "@/lib/membership-plans";

export function PlanCard({ plan }: { plan: MembershipPlan }) {
  return <article className="flex h-full flex-col rounded-sm border border-border/60 bg-card/30 p-7 sm:p-8">
    <h2 className="font-display text-3xl font-light italic">{plan.name}</h2>
    <dl className="my-7 space-y-5 border-y border-border/50 py-5">
      <div><dt className="text-sm text-muted-foreground">Membership Duration</dt><dd className="mt-2 text-xl">{plan.durationMonths} {plan.durationMonths === 1 ? "Month" : "Months"}</dd></div>
      <div><dt className="text-sm text-muted-foreground">Membership Fee</dt><dd className="mt-2 text-3xl text-gold">฿{plan.price.toLocaleString("en-US")}</dd></div>
    </dl>
    <Link href={`/plans/${plan.slug}`} className="mt-auto inline-flex justify-center rounded-full bg-gold px-6 py-3 text-eyebrow text-gold-foreground">SELECT PLAN</Link>
  </article>;
}
