from pathlib import Path
import re
root=Path(__file__).resolve().parents[1]
def read(p): return (root/p).read_text(encoding='utf-8')
def write(p,s): (root/p).write_text(s,encoding='utf-8')

p='components/membership/membership-detail.tsx';s=read(p)
s=s.replace('alcoholSalesEnabled, membershipDeliveryAreas', 'alcoholSalesEnabled, beverageAddOns, membershipDeliveryAreas')
s=s.replace('  const [selectedProducts, setSelectedProducts] = useState<SelectedProduct[]>([]);','  const [selectedProducts, setSelectedProducts] = useState<SelectedProduct[]>([]);\n  const [selectedAddOns, setSelectedAddOns] = useState<SelectedProduct[]>([]);')
s=s.replace('        setPurchaseMode(savedMode);','        setPurchaseMode(savedMode);\n        setSelectedAddOns(savedMode === "membership_with_package" && alcoholAvailable ? configuration.selectedAddOns ?? [] : []);')
s=s.replace('selectedAddOns: [],', 'selectedAddOns,')
s=s.replace('      setSelectedProducts([]);','      setSelectedProducts([]);\n      setSelectedAddOns([]);')
s=s.replace('          if (!enabled) {','          if (!enabled) {\n            setSelectedAddOns([]);')
s=s.replace('!selectedProducts.length}', '!selectedProducts.length && !selectedAddOns.length}')
marker='      </div>\n      <aside'
addon='''        {purchaseMode === "membership_with_package" && alcoholOpen && <section><p className="text-eyebrow text-gold">Eligible add-ons</p><div className="mt-5 space-y-4">{beverageAddOns.filter(addon => plan.allowedBeverageCategories.includes(addon.category)).map(addon => {
          const selected = selectedAddOns.find(item => item.category === addon.category);
          return <div key={addon.category} className="grid gap-3 rounded-sm border border-border/60 p-4 sm:grid-cols-2"><label className="text-sm">{addon.label} · {addon.pricingType === "MONTHLY" ? "Monthly" : "One time"} · ฿{addon.price.toLocaleString("en-US")}<select className="mt-2 w-full rounded-sm border border-input bg-background p-2" value={selected?.name ?? ""} onChange={event => { const name = event.target.value; setSelectedAddOns(current => [...current.filter(item => item.category !== addon.category), ...(name ? [{ category: addon.category, name, quantity: selected?.quantity ?? 1 }] : [])]); }}><option value="">Not selected</option>{addon.options.map(name => <option key={name}>{name}</option>)}</select></label>{selected && <label className="text-sm">{addon.pricingType === "MONTHLY" ? "Monthly Quantity" : "One-time Quantity"}<input type="number" min={1} max={100} value={selected.quantity} onChange={event => { const quantity = Number(event.target.value); if (Number.isInteger(quantity) && quantity >= 1 && quantity <= 100) setSelectedAddOns(current => current.map(item => item.category === addon.category ? { ...item, quantity } : item)); }} className="mt-2 w-full rounded-sm border border-input bg-background p-2" /></label>}</div>;
        })}</div></section>}
'''
s=s.replace(marker, addon+marker)
marker='{purchaseMode === "membership_with_package" && <div className="flex justify-between gap-4 border-t'
s=s.replace(marker, '''{purchaseMode === "membership_with_package" && quote.selectedAddOns.map(item => <div key={`${item.category}:${item.name}`} className="border-t border-border/50 pt-3"><p className="flex justify-between gap-3"><span>{item.name}</span><span>฿{item.lineTotal.toLocaleString("en-US")}</span></p><p className="mt-1 text-xs text-muted-foreground">Unit Price: ฿{item.unitPrice.toLocaleString("en-US")} · {item.pricingType === "MONTHLY" ? "Monthly Quantity" : "One-time Quantity"}: {item.quantity} · Total Included Quantity: {item.totalTermQuantity}</p></div>)}'''+marker)
s=s.replace('Premium catalogue selection','Monthly prepaid quantity; delivery arranged separately')
write(p,s)

# Historical paid memberships retain their original ordering permissions, but
# these IDs are never offered or accepted for new membership purchases.
write('lib/legacy-membership-ordering.ts','''const legacyLevels = ["budget", "budget", "budget", "budget", "standard", "standard", "standard", "standard", "premium", "premium", "premium", "premium", "premium", "premium", "premium", "vip", "vip", "vip", "vip", "vip"] as const;
const categories = {
  budget: ["beer", "house-wine"],
  standard: ["beer", "wine", "whisky"],
  premium: ["beer", "wine", "whisky", "rum", "vodka", "gin"],
  vip: ["beer", "wine", "whisky", "rum", "vodka", "gin", "tequila"],
};
/** Read-only compatibility for existing paid 01–20 agreements. */
export function legacyOrderingPermissions(planId: string) {
  if (!/^(0[1-9]|1[0-9]|20)$/.test(planId)) return null;
  return { allowedBeverageCategories: categories[legacyLevels[Number(planId) - 1]] };
}
''')
p='lib/order.ts';s=read(p).replace('import { z }', 'import { legacyOrderingPermissions } from "@/lib/legacy-membership-ordering";\nimport { z }').replace('membershipPlans.find((item) => item.id === membershipPlanId);','membershipPlans.find((item) => item.id === membershipPlanId) ?? legacyOrderingPermissions(membershipPlanId);');write(p,s)
p='lib/membership-plans.ts';s=read(p).replace('plan: MembershipPlan, categoryName:', 'plan: Pick<MembershipPlan, "allowedBeverageCategories">, categoryName:');write(p,s)

# New customer-facing paths all lead through payment then review.
write('app/(site)/membership/apply/page.tsx','''import { redirect } from "next/navigation";
export default function MembershipApplyPage() { redirect("/membership/checkout"); }
''')
p='app/membership/actions.ts';s=read(p).replace('    deliveryDays: 0,\n    deliveryDaysPerYear: 0,\n','');write(p,s)
p='lib/db/schema.ts';s=read(p).replace('    durationMonths: integer("validity_months").notNull(),','    // Existing SQL column is retained to preserve all historical durations.\n    durationMonths: integer("validity_months").notNull(),').replace('    deliveryDays: integer("delivery_days").notNull(),','    // Historical delivery entitlements only; new duration plans store zero.\n    deliveryDays: integer("delivery_days").notNull(),');write(p,s)

p='app/(site)/admin/membership-deliveries/page.tsx';s=read(p)
s='import { hasActiveMembership, membershipDate } from "@/lib/membership-term";\n'+s
s=s.replace('new Date().toISOString().slice(0, 10)','membershipDate()').replace('record.membership.status !== "active"','!hasActiveMembership(record.membership)')
s=s.replace('scheduledDate < today ||', 'scheduledDate < today || scheduledDate >= (record.membership.membershipExpiryDate ?? "") ||')
s=s.replace('Delivery entitlements</h1>','Historical delivery schedules</h1>').replace('Schedule and record included delivery days. Prepaid package fulfilment is recorded here without creating an additional payment.','This ledger preserves earlier delivery agreements. New duration memberships contain monthly product quantities; their delivery scheduling is arranged separately.')
s=s.replace('{rows.map(({ entitlement, membership }) => {','{rows.filter(({ membership }) => hasActiveMembership(membership)).map(({ entitlement, membership }) => {')
write(p,s)

p='app/(site)/dashboard/page.tsx';s=read(p).replace('import { hasActiveMembership }','import { hasActiveMembership, membershipDate }').replace('new Date().toISOString().slice(0, 10)','membershipDate()');write(p,s)
p='app/(site)/membership/page.tsx';s=read(p).replace('ArrowRight, ','').replace('Members receive scheduled food packages on a predictable weekly or monthly rhythm.','Choose a membership lasting 1 to 12 months, starting after final approval.').replace('Choose delivery dates and package sizes that fit your household, team, or routine.','Select membership only or add monthly prepaid food and beverage quantities.').replace('Pause, adjust, or request support before the next recurring delivery cycle begins.','Your paid package quantities and prices are saved for your membership term.').replace('Choose your rhythm','Choose your duration');write(p,s)
