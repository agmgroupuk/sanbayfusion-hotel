from pathlib import Path

root = Path(__file__).resolve().parents[1]
def read(p): return (root / p).read_text(encoding='utf-8')
def write(p, s): (root / p).write_text(s, encoding='utf-8')

# Retain the SQL validity_months column and its historical values; expose its
# actual meaning in application code without a destructive column migration.
for folder in ['app', 'components', 'lib', 'scripts']:
    for p in (root / folder).rglob('*'):
        if p.suffix in ['.ts', '.tsx']:
            s = p.read_text(encoding='utf-8').replace('validityMonths', 'durationMonths')
            p.write_text(s, encoding='utf-8')

p = 'lib/membership-plans.ts'
s = read(p)
# This historical generator must preserve the authoritative fees, never seed its own prices.
membership_fees = s.split('export const membershipPlans: MembershipPlan[] = ', 1)[1].split('.map(', 1)[0]
tail = s[s.index('// Keep alcohol disabled'):]
tail = tail[:tail.index('export const membershipValueProps')]+'''export const membershipValueProps = [
  ["Choose", "Select a membership lasting 1 to 12 months."],
  ["Pay", "Buy membership only or add a prepaid package."],
  ["Activate", "Your term starts after payment, team review, and final approval."],
] as const;
'''
write(p, '''export type MembershipPlan = {
  id: string;
  slug: string;
  name: string;
  description: string;
  price: number;
  durationMonths: number;
  allowedBeverageCategories: string[];
};

export const membershipDeliveryAreas = ["Bangkok"] as const;
export const membershipPreferredDays = ["Monday", "Wednesday", "Friday", "Saturday", "Sunday"] as const;
export const membershipPreferredTimes = ["09:00–12:00", "12:00–15:00", "17:00–20:00"] as const;

export function membershipPlanAllowsCatalogueCategory(plan: MembershipPlan, categoryName: string, group: string) {
  if (group !== "alcohol") return true;
  const category = categoryName === "Champagne & sparkling wine" ? "wine" : categoryName.toLowerCase().replace(/[^a-z]+/g, "-").replace(/^-|-$/g, "");
  return plan.allowedBeverageCategories.includes(category);
}

// Distinct IDs preserve the meaning of historical 01–20 plan references.
export const membershipPlans: MembershipPlan[] = ''' + membership_fees + '''.map((price, index) => {
  const durationMonths = index + 1;
  return {
    id: `duration-${durationMonths}`,
    slug: `${durationMonths}-month-membership`,
    name: `${durationMonths}-Month Membership`,
    description: `${durationMonths} calendar ${durationMonths === 1 ? "month" : "months"} of membership from final activation.`,
    price,
    durationMonths,
    allowedBeverageCategories: ["beer", "wine", "whisky", "rum", "vodka", "gin", "tequila"],
  };
});

'''+tail)

write('components/membership/plan-card.tsx', '''import Link from "next/link";
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
''')
write('app/(site)/plans/page.tsx', '''import type { Metadata } from "next";
import { PageHeader } from "@/components/site/page-header";
import { PlanCard } from "@/components/membership/plan-card";
import { membershipPlans } from "@/lib/membership-plans";

export const metadata: Metadata = { title: "Membership Plans", description: "Choose a 1 to 12 month Sanbay Fusion membership.", alternates: { canonical: "/plans" } };
export default function PlansPage() {
  return <div className="pb-28"><PageHeader eyebrow="Membership plans" title="Choose your membership duration" lead="Twelve plans, from 1 to 12 months. Pay once for your selected term, beginning on final activation after team approval." /><div className="mx-auto max-w-7xl px-5 sm:px-8"><div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">{membershipPlans.map(plan => <PlanCard key={plan.id} plan={plan} />)}</div><p className="mx-auto mt-10 max-w-2xl text-center text-sm text-muted-foreground">Choose membership only or add a prepaid package for the same membership period. Additional orders are paid separately. Renewal requires a new purchase.</p></div></div>;
}
''')

for p in ['app/membership/actions.ts','app/api/membership/payment-intent/route.ts']:
    s=read(p)
    s=s.replace('checked.plan.deliveryDaysPerYear','0').replace('checked.plan.deliveryDays','0').replace('plan.deliveryDaysPerYear','0').replace('plan.deliveryDays','0')
    for field in ['foodLevel','items','exampleMenu','foodValueRange']:
        s='\n'.join(line for line in s.split('\n') if f'checked.plan.{field}' not in line)
    write(p,s)
