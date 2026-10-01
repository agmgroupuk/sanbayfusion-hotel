import type { MembershipPurchaseSnapshot } from "@/lib/membership-request";

const money = (value: number) => `฿${value.toLocaleString("en-US")}`;

/** Render saved prices, never reprice a paid agreement from today's catalogue. */
export function PackageSummary({ snapshot }: { snapshot: MembershipPurchaseSnapshot }) {
  if (snapshot.purchaseMode !== "membership_with_package") return <p className="text-sm text-muted-foreground">Membership only. Additional orders are paid separately.</p>;
  const months = snapshot.plan.durationMonths ?? snapshot.plan.validityMonths;
  return <section className="space-y-4 text-sm">
    <p className="text-eyebrow text-gold">Prepaid package</p>
    {months && <p>Membership Duration: {months} {months === 1 ? "Month" : "Months"}</p>}
    {snapshot.products.map(item => <div key={`${item.category}:${item.name}`} className="border-t border-border/50 pt-3">
      <div className="flex justify-between gap-3"><strong>{item.name}</strong><span>{money(item.lineTotal)}</span></div>
      <p className="mt-1 text-xs text-muted-foreground">{item.category} · Unit Price: {money(item.unitPrice)}</p>
      {snapshot.version === 3 ? <div className="mt-2 text-xs text-muted-foreground"><p>Monthly Quantity: {item.monthlyQuantity}</p><p>Membership Duration: {item.durationMonths} Months</p><p>Total Included Quantity: {item.totalTermQuantity}</p><p>Pricing: Monthly</p></div> : <p className="mt-2 text-xs text-muted-foreground">Historical package: {item.quantityPerDelivery} per delivery · {item.annualQuantity} total units under the original agreement</p>}
    </div>)}
    {snapshot.addOns.map(item => <div key={`${item.category}:${item.name}`} className="border-t border-border/50 pt-3">
      <div className="flex justify-between gap-3"><strong>{item.name}</strong><span>{money(item.lineTotal)}</span></div>
      <p className="mt-1 text-xs text-muted-foreground">Unit Price: {money(item.unitPrice)} · {item.pricingType === "MONTHLY" ? "Monthly Quantity" : "One-time Quantity"}: {item.quantity}</p>
      <p className="text-xs text-muted-foreground">Total Included Quantity: {item.totalTermQuantity ?? item.quantity} · Pricing: {item.pricingType === "MONTHLY" ? "Monthly" : "One time"}</p>
    </div>)}
    <p className="flex justify-between border-t border-border/50 pt-3"><span>Package Subtotal</span><strong>{money(snapshot.packageSubtotal)}</strong></p>
    <p className="text-xs text-muted-foreground">Included during this membership term. Package quantities do not determine the number of deliveries; scheduling is arranged separately.</p>
  </section>;
}
