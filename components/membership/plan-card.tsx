import Link from "next/link";
import { alcoholSalesEnabled, type MembershipPlan } from "@/lib/membership-plans";

export function PlanCard({ plan }: { plan: MembershipPlan }) {
  const price = `฿${plan.price.toLocaleString("en-US")}`;
  const containsAlcohol = plan.items.some((item) => item.alcohol);
  const unavailable = containsAlcohol && !alcoholSalesEnabled;
  return (
    <article className={`relative flex h-full flex-col rounded-sm border p-7 sm:p-8 ${plan.featured ? "border-gold/70 bg-gold/5" : "border-border/60 bg-card/30"}`}>
      {plan.featured && <p className="text-eyebrow text-gold">Most popular</p>}
      <h2 className="mt-2 font-display text-3xl font-light italic">{plan.name}</h2>
      <p className="mt-5 text-3xl text-gold">{price}</p>
      <p className="text-sm text-muted-foreground">{plan.cadence} · {plan.deliveryDays} delivery days</p>
      <p className="mt-5 text-sm leading-relaxed text-foreground/75">{plan.description}</p>
      <dl className="mt-7 space-y-3 border-y border-border/50 py-5 text-sm">
        <div className="flex justify-between gap-4"><dt className="text-muted-foreground">Package</dt><dd className="text-right text-foreground/85">Fixed contents</dd></div>
        <div className="flex justify-between gap-4"><dt className="text-muted-foreground">Alcohol</dt><dd className="text-right text-foreground/85">{containsAlcohol ? "Included allocation" : "Not included"}</dd></div>
      </dl>
      <ul className="space-y-2 text-sm text-foreground/80">
        {plan.items.map((item) => <li key={`${item.name}-${item.quantity}`} className="flex justify-between gap-4"><span className={item.alcohol ? "text-gold" : ""}>{item.name}{item.alcohol ? " *" : ""}</span><span className="shrink-0 text-muted-foreground">× {item.quantity}</span></li>)}
      </ul>
      <ul className="mt-6 space-y-3 text-sm text-foreground/75">
        {plan.benefits.map((benefit) => <li key={benefit} className="flex gap-3"><span className="text-gold">+</span><span>{benefit}</span></li>)}
      </ul>
      {unavailable ? <p className="mt-8 rounded-sm border border-border/60 px-5 py-3 text-center text-xs leading-relaxed text-muted-foreground">Unavailable until alcohol-sale compliance is enabled.</p> : <Link href={`/join?plan=${plan.slug}`} className="mt-auto inline-flex items-center justify-center rounded-full bg-gold px-6 py-3 text-eyebrow text-gold-foreground transition-transform hover:-translate-y-0.5 sm:mt-8">Join Package</Link>}
      {containsAlcohol && <p className="mt-3 text-[0.7rem] leading-relaxed text-muted-foreground">* Alcohol is age-restricted and subject to Thai licensing, sale-hour, delivery, and identity requirements.</p>}
    </article>
  );
}