import Link from "next/link";
import type { MembershipPlan } from "@/lib/membership-plans";

export function PlanCard({ plan }: { plan: MembershipPlan }) {
  const price = plan.price === null ? "Custom" : `฿${plan.price.toLocaleString("en-US")}`;
  return (
    <article className={`relative flex h-full flex-col rounded-sm border p-7 sm:p-8 ${plan.featured ? "border-gold/70 bg-gold/5" : "border-border/60 bg-card/30"}`}>
      {plan.featured && <p className="text-eyebrow text-gold">Most popular</p>}
      <h2 className="mt-2 font-display text-3xl font-light italic">{plan.name}</h2>
      <p className="mt-5 text-3xl text-gold">{price}</p>
      <p className="text-sm text-muted-foreground">{plan.cadence} · {plan.deliveryDays ? `${plan.deliveryDays} delivery days` : "tailored schedule"}</p>
      <p className="mt-5 text-sm leading-relaxed text-foreground/75">{plan.description}</p>
      <dl className="mt-7 space-y-3 border-y border-border/50 py-5 text-sm">
        <div className="flex justify-between gap-4"><dt className="text-muted-foreground">Delivery rhythm</dt><dd className="text-right text-foreground/85">{plan.deliveries}</dd></div>
        <div className="flex justify-between gap-4"><dt className="text-muted-foreground">Package</dt><dd className="text-right text-foreground/85">{plan.portions}</dd></div>
      </dl>
      <ul className="mt-6 space-y-3 text-sm text-foreground/75">
        {plan.benefits.map((benefit) => <li key={benefit} className="flex gap-3"><span className="text-gold">+</span><span>{benefit}</span></li>)}
      </ul>
      <Link href={`/join?plan=${plan.slug}`} className="mt-auto inline-flex items-center justify-center rounded-full bg-gold px-6 py-3 text-eyebrow text-gold-foreground transition-transform hover:-translate-y-0.5 sm:mt-8">
        Choose {plan.name}
      </Link>
    </article>
  );
}