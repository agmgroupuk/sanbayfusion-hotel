from pathlib import Path
import re
root=Path(__file__).resolve().parents[1]
def read(p): return (root/p).read_text(encoding='utf-8')
def write(p,s): (root/p).write_text(s,encoding='utf-8')

# All runtime gates resolve the persisted status, then independently check the
# date so stale status alone can never grant access.
for p in ['app/(site)/dashboard/page.tsx','app/(site)/dashboard/order/page.tsx','app/(site)/dashboard/checkout/page.tsx','app/api/orders/payment-intent/route.ts','app/(site)/membership/success/page.tsx']:
    s=read(p)
    s='import { resolveMembershipStatus } from "@/lib/membership-status";\nimport { hasActiveMembership } from "@/lib/membership-term";\n'+s
    s=re.sub(r'const membership = (.*);', r'const membership = await resolveMembershipStatus(\1);',s,count=1)
    s=s.replace('membership?.status === "active"','hasActiveMembership(membership)').replace('!membership || membership.status !== "active"','!membership || !hasActiveMembership(membership)').replace('membership?.status !== "active"','!membership || !hasActiveMembership(membership)')
    if p.endswith('dashboard/page.tsx'): s=s.replace('if (db && hasActiveMembership(membership))','if (db && membership && hasActiveMembership(membership))')
    s=s.replace('Your verified Stripe Sandbox payment has activated your Sanbay Fusion membership.','Your membership has been approved and activated by our team.').replace('Your membership will become active after the signed webhook confirms payment.','After payment, our team reviews your membership within up to 3 days. Your term begins only after final approval.')
    write(p,s)

p='lib/membership-activation.ts';s=read(p)
s=s.replace('import { addMonths, formatISO, parseISO } from "date-fns";', 'import { parseISO } from "date-fns";\nimport { membershipTerm } from "@/lib/membership-term";')
s=s.replace('const expiryDate = addMonths(activatedAt, membership.durationMonths || 12);\n    const membershipStartDate = formatISO(activatedAt, { representation: "date" });\n    const membershipExpiryDate = formatISO(expiryDate, { representation: "date" });','const { startDate: membershipStartDate, expiryDate: membershipExpiryDate } = membershipTerm(activatedAt, membership.durationMonths);')
s=s.replace('membership.durationMonths || 12','membership.durationMonths')
s=s.replace('const schedule = buildMembershipDeliverySchedule({','const schedule = buildMembershipDeliverySchedule({')
s=s.replace('await tx.insert(membershipDeliveryEntitlements).values(schedule).onConflictDoNothing();','if (schedule.length) await tx.insert(membershipDeliveryEntitlements).values(schedule).onConflictDoNothing();')
s=s.replace('deliveryDaysPerMonth: row.deliveryDays,\n        deliveryDaysPerYear: row.annualDeliveryDays,','durationMonths: row.durationMonths,')
write(p,s)

p='app/api/membership/payment-intent/route.ts';s=read(p)
s='import { resolveMembershipStatus } from "@/lib/membership-status";\n'+s
s=s.replace('if (membership?.status === "active"', '''membership = await resolveMembershipStatus(membership);
    // Renewal creates a separate term and preserves the previous paid agreement.
    if (membership?.status === "expired" || membership?.status === "cancelled") membership = undefined as unknown as typeof membership;
    if (membership?.status === "active"''')
s=s.replace('const checked = validateMembershipConfiguration(selection.configuration);','if (selection.configuration.planSlug !== plan.slug) return NextResponse.json({ error: "Membership selection does not match the configuration." }, { status: 400 });\n  const checked = validateMembershipConfiguration(selection.configuration);')
write(p,s)

# Safe catalog snapshots retain old fields as optional legacy values, but new
# agreements contain only duration and monthly/term product quantities.
p='lib/membership-request.ts';s=read(p)
s=s.replace('quantity: z.number().int().min(1).max(5)', 'quantity: z.number().int().min(1).max(100)')
s=s.replace('version: 1 | 2;', 'version: 1 | 2 | 3;')
s=s.replace('durationMonths: number; membershipFee: number','durationMonths?: number; validityMonths?: number; membershipFee: number')
s=s.replace('deliveriesPerMonth: number; deliveriesPerYear: number','deliveriesPerMonth?: number; deliveriesPerYear?: number')
s=s.replace('quantityPerDelivery: number; annualQuantity: number; lineTotal: number','monthlyQuantity?: number; durationMonths?: number; totalTermQuantity?: number; pricingType?: "MONTHLY"; quantityPerDelivery?: number; annualQuantity?: number; lineTotal: number')
s=s.replace('quantityPerDelivery: number }>;', 'monthlyQuantity?: number; quantityPerDelivery?: number }>;')
s=s.replace('unitPrice: number; quantity: number; lineTotal: number','unitPrice: number; quantity: number; pricingType?: "MONTHLY" | "ONE_TIME"; monthlyQuantity?: number; durationMonths?: number; totalTermQuantity?: number; lineTotal: number')
s=s.replace('const annualQuantity = selected.quantity * plan.deliveryDaysPerYear;', 'const totalTermQuantity = selected.quantity * plan.durationMonths;')
s=s.replace('quantityPerDelivery: selected.quantity, annualQuantity, lineTotal: unitPrice * annualQuantity','monthlyQuantity: selected.quantity, durationMonths: plan.durationMonths, totalTermQuantity, pricingType: "MONTHLY" as const, lineTotal: unitPrice * totalTermQuantity')
s=s.replace('return addOn ? [{ category: selected.category, name: selected.name, unitPrice: addOn.price, quantity: selected.quantity, lineTotal: addOn.price * selected.quantity }] : [];','''if (!addOn) return [];
    const totalTermQuantity = selected.quantity * (addOn.pricingType === "MONTHLY" ? plan.durationMonths : 1);
    return [{ category: selected.category, name: selected.name, unitPrice: addOn.price, quantity: selected.quantity, pricingType: addOn.pricingType, monthlyQuantity: addOn.pricingType === "MONTHLY" ? selected.quantity : undefined, durationMonths: plan.durationMonths, totalTermQuantity, lineTotal: addOn.price * totalTermQuantity }];''')
s=s.replace('version: 2,','version: 3,').replace('pricingVersion: 1,','pricingVersion: 2,')
s=s.replace('      deliveriesPerMonth: plan.deliveryDays,\n      deliveriesPerYear: plan.deliveryDaysPerYear,\n','')
s=s.replace('quantityPerDelivery }) => ({ category, name, productName, variant, quantityPerDelivery })','monthlyQuantity }) => ({ category, name, productName, variant, monthlyQuantity })')
s=s.replace('export function validateMembershipConfiguration(configuration: MembershipConfiguration) {','''export function validateMembershipConfiguration(raw: unknown) {
  const parsed = membershipConfigurationSchema.safeParse(raw);
  if (!parsed.success) return { ok: false as const, error: "Invalid membership configuration or quantities." };
  const configuration = parsed.data;''')
s=s.replace('prepaid annual package','prepaid package')
write(p,s)
p='lib/membership-plans.ts';s=read(p)
s=s.replace('export const beverageAddOns = [','export type AddOnPricingType = "MONTHLY" | "ONE_TIME";\n\n// Existing beverage add-ons are one-time purchases; only catalog data sets pricing.\nexport const beverageAddOns: ReadonlyArray<{ category: string; label: string; options: readonly string[]; price: number; pricingType: AddOnPricingType }> = [')
s=re.sub(r'price: (\d+) }',r'price: \1, pricingType: "ONE_TIME" }',s)
write(p,s)

# The historical schedule is preserved, but new duration agreements never
# manufacture deliveries from monthly product quantities.
p='lib/membership-delivery.ts';s=read(p).replace('  const schedule = [];','  if (purchaseSnapshot?.version === 3) return [];\n  const schedule = [];').replace('quantity: item.quantityPerDelivery,','quantity: item.quantityPerDelivery ?? 0,');write(p,s)

for p in ['lib/email/templates/membership-request.tsx','lib/email/templates/membership-payment-review.tsx']:
    s=read(p)
    s=s.replace('deliveryDaysPerMonth: number;\n  deliveryDaysPerYear: number;', 'durationMonths: number;').replace('deliveryDays: number;', 'durationMonths: number;').replace('planName, deliveryDays,','planName, durationMonths,')
    s=s.replace('Delivery: {deliveryDays} days per month','Membership duration: {durationMonths} months').replace('Delivery entitlement: {data.deliveryDaysPerMonth} days/month · {data.deliveryDaysPerYear} days/year','Membership duration: {data.durationMonths} months from final activation')
    write(p,s)
p='app/membership/actions.ts';s=read(p).replace('      deliveryDays: 0,\n      estimatedTotal:', '      durationMonths: checked.plan.durationMonths,\n      estimatedTotal:');write(p,s)

# Copy shared by new purchases must not imply a universal annual term.
for folder in ['app','components','lib']:
    for p in (root/folder).rglob('*'):
        if p.suffix in ['.tsx','.ts'] and not p.name.endswith('.test.ts'):
            s=p.read_text(encoding='utf-8')
            s=s.replace('prepaid annual package','prepaid package').replace('Prepaid annual package','Prepaid package').replace('annual membership fee','membership fee').replace('Annual membership fee','Membership fee').replace('annual membership request','membership request')
            p.write_text(s,encoding='utf-8')
