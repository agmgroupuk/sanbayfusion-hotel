import { StandardMealScheduleSummary } from "./standard-meal-schedule";
import type { MembershipPurchaseSnapshot } from "@/lib/membership-request";
import { serviceMonthLabel, complimentaryBenefitConditions } from "@/lib/membership-service-months";

const money = (value: number) => `฿${value.toLocaleString("en-US")}`;

/** Render saved prices, never reprice a paid agreement from today's catalogue. */
function PrepaidPackageSummary({ snapshot }: { snapshot: MembershipPurchaseSnapshot }) {
  if (snapshot.purchaseMode !== "membership_with_package") return <p className="text-sm text-muted-foreground">Membership only. Additional orders are paid separately.</p>;
  const months = snapshot.plan.durationMonths ?? snapshot.plan.validityMonths;
  return <section className="space-y-4 text-sm">
    <p className="text-eyebrow text-gold">Prepaid package</p>
    {months && <p>Service month count: {months} {months === 1 ? "Month" : "Months"}</p>}
    {snapshot.products.map(item => <div key={`${item.category}:${item.name}`} className="border-t border-border/50 pt-3">
      <div className="flex justify-between gap-3"><strong>{item.name}</strong><span>{money(item.lineTotal)}</span></div>
      <p className="mt-1 text-xs text-muted-foreground">{item.category} · Unit Price: {money(item.unitPrice)}</p>
      {snapshot.version >= 3 ? <div className="mt-2 text-xs text-muted-foreground"><p>Monthly Quantity: {item.monthlyQuantity}</p><p>Service month count: {item.durationMonths} Months</p><p>Total Included Quantity: {item.totalTermQuantity}</p><p>Pricing: Monthly</p></div> : <p className="mt-2 text-xs text-muted-foreground">Historical package: {item.quantityPerDelivery} per delivery · {item.annualQuantity} total units under the original agreement</p>}
    </div>)}
    {snapshot.addOns.map(item => <div key={`${item.category}:${item.name}`} className="border-t border-border/50 pt-3">
      <div className="flex justify-between gap-3"><strong>{item.name}</strong><span>{money(item.lineTotal)}</span></div>
      <p className="mt-1 text-xs text-muted-foreground">Unit Price: {money(item.unitPrice)} · {item.pricingType === "MONTHLY" ? "Monthly Quantity" : "One-time Quantity"}: {item.quantity}</p>
      <p className="text-xs text-muted-foreground">Total Included Quantity: {item.totalTermQuantity ?? item.quantity} · Pricing: {item.pricingType === "MONTHLY" ? "Monthly" : "One time"}</p>
    </div>)}
    <p className="flex justify-between border-t border-border/50 pt-3"><span>Package Subtotal</span><strong>{money(snapshot.packageSubtotal)}</strong></p>
    <p className="text-xs text-muted-foreground">Prepaid quantities apply in the selected service months for calendar-month agreements. Package quantities do not determine the number of deliveries; scheduling is arranged separately.</p>
  </section>;
}

export function PackageSummary({ snapshot, showSchedule = true }: { snapshot: MembershipPurchaseSnapshot; showSchedule?: boolean }) {
  return <div className="space-y-6">{snapshot.version === 4 && <>
    <section className="space-y-3 text-sm"><h3 className="text-eyebrow leading-relaxed text-gold">Selected service months</h3><ul className="flex flex-wrap gap-2">{snapshot.selectedServiceMonths?.map(month => <li key={month} className="rounded-full border border-gold/30 px-3 py-2">{serviceMonthLabel(month)}</li>)}</ul><p className="text-xs text-muted-foreground">Service applies only in these months after approval and payment. Months become fixed on final submission.</p></section>
    {snapshot.includedBenefit && <section className="space-y-3 border border-gold/40 bg-gold/5 p-4 text-sm"><h3 className="text-eyebrow leading-relaxed text-gold">Included member benefit</h3><p>One {snapshot.includedBenefit.name} per selected service month · Eligible menu value up to {money(snapshot.includedBenefit.menuValue)} per month</p><p className="text-gold">Allowance included in your membership fee · Pay only eligible food above the allowance</p><p className="text-xs text-muted-foreground">{complimentaryBenefitConditions}</p></section>}
    {showSchedule && !!snapshot.standardMealSlots?.length && <StandardMealScheduleSummary slots={snapshot.standardMealSlots} />}
  </>}<PrepaidPackageSummary snapshot={snapshot} /></div>;
}
