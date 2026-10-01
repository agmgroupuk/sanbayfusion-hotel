from pathlib import Path
import re
root=Path(__file__).resolve().parents[1]
def read(p): return (root/p).read_text(encoding='utf-8')
def write(p,s): (root/p).write_text(s,encoding='utf-8')

p='components/membership/membership-detail.tsx';s=read(p)
s=s.replace('{plan.id} · {plan.foodLevel}', '{plan.durationMonths} {plan.durationMonths === 1 ? "Month" : "Months"}')
s=s.replace('A fixed annual package with a defined menu, delivery rhythm, and 12-month membership validity.','{plan.description}')
s=s.replace(' / year',' one time').replace('{plan.deliveryDays} delivery days/month · {plan.deliveryDaysPerYear} delivery days/year','Membership Duration: {plan.durationMonths} {plan.durationMonths === 1 ? "Month" : "Months"}')
s=s.replace('[["Membership fee", `฿${plan.price.toLocaleString("en-US")}`], ["Validity", "12 months from activation"], ["Monthly delivery entitlement", `${plan.deliveryDays} days`], ["Annual delivery entitlement", `${plan.deliveryDaysPerYear} days`], ["Delivery rhythm", plan.rhythm], ["Food level", plan.foodLevel]]','[["Membership fee", `฿${plan.price.toLocaleString("en-US")}`], ["Membership Duration", `${plan.durationMonths} ${plan.durationMonths === 1 ? "Month" : "Months"} from final activation`]]')
s=s.replace('Prepay selected items for each scheduled annual delivery.','Prepay monthly product quantities for your selected membership duration.').replace('prepaid annual delivery package','prepaid package')
s=s.replace('`Prepaid for ${plan.deliveryDaysPerYear} scheduled deliveries`','`Membership Duration: ${plan.durationMonths} Months`')
s=s.replace('quantityPerDelivery','monthlyQuantity').replace('annualQuantity','totalTermQuantity')
s=s.replace('{item.monthlyQuantity} per delivery','Monthly Quantity: {item.monthlyQuantity}').replace('` · ${item.totalTermQuantity} annually`','` · Total Included Quantity: ${item.totalTermQuantity}`')
s=s.replace('if (quantity > 5)', 'if (quantity > 100)')
s=s.replace('Your selected package is prepaid for the applicable membership term and fulfilled according to its delivery schedule. Included items are not charged again.','Product total = unit price × monthly quantity × membership months. Delivery scheduling is arranged separately. Included items are not charged again.')
s=s.replace('<span className="shrink-0 text-right text-gold">{purchaseMode', '<span className="shrink-0 text-right text-gold"><span className="block text-xs text-muted-foreground">Unit ฿{item.unitPrice.toLocaleString("en-US")}</span>{purchaseMode')
write(p,s)

p='components/membership/membership-checkout-form.tsx';s=read(p)
s=s.replace('import type { MembershipPlan }', 'import { PackageSummary } from "@/components/membership/package-summary";\nimport type { MembershipPlan }')
s=s.replace('{plan.durationMonths}-month membership · {plan.deliveryDays} delivery days/month','Membership Duration: {plan.durationMonths} {plan.durationMonths === 1 ? "Month" : "Months"}')
start=s.index('{prepaid ? <><div className="border-t')
end=s.index('<div className="flex justify-between gap-4 border-t border-border/50 pt-4"><span>Membership fee',start)
s=s[:start]+'{prepaid && <PackageSummary snapshot={purchaseSnapshot} />}'+s[end:]
write(p,s)

for p,var in [('app/(site)/membership/thank-you/page.tsx','recorded'),('app/(site)/admin/activate-membership/page.tsx','item')]:
    s=read(p)
    s='import { PackageSummary } from "@/components/membership/package-summary";\n'+s
    s=s.replace(f'Delivery entitlement</p><p className="mt-1">{{{var}.deliveryDays}} delivery days/month · {{{var}.annualDeliveryDays}} days/year',f'Membership Duration</p><p className="mt-1">{{{var}.durationMonths}} months from final activation')
    s=s.replace(f'Delivery entitlement</p><p className="mt-1">{{{var}.deliveryDays}} days/month · {{{var}.annualDeliveryDays}} days/year',f'Membership Duration</p><p className="mt-1">{{{var}.durationMonths}} months from final activation')
    if var=='recorded':
        start=s.index('{packageIncluded && snapshot && <section')
        end=s.index('<div className="mt-7 flex flex-wrap gap-3">',start)
        s=s[:start]+'{packageIncluded && snapshot && <div className="mt-7"><PackageSummary snapshot={snapshot} /></div>}'+s[end:]
    else:
        start=s.index('{snapshot?.purchaseMode === "membership_with_package" && <section')
        end=s.index('<AdminApprovalForm',start)
        s=s[:start]+'{snapshot && <div className="mt-6"><PackageSummary snapshot={snapshot} /></div>}'+s[end:]
    write(p,s)

p='components/membership/application-form.tsx';s=read(p)
s=s.replace('{plan.deliveryDays} days/month · {plan.deliveryDaysPerYear} days/year','{plan.durationMonths} months from final activation')
s=s.replace('import { useEffect, useState }','import { startTransition, useEffect, useState }')
s=s.replace('      setConfiguration(next);\n      setPlan(membershipPlans.find((item) => item.slug === next.planSlug) ?? null);','      startTransition(() => {\n        setConfiguration(next);\n        setPlan(membershipPlans.find((item) => item.slug === next.planSlug) ?? null);\n      });')
s=s.replace("customer's",'customer&apos;s')
write(p,s)

p='app/(site)/plans/[plan-slug]/page.tsx';s=read(p)
s=s.replace('per year, ${plan.deliveryDays} delivery days per month, valid for 12 months.','one time for ${plan.durationMonths} calendar months from final activation.')
write(p,s)
