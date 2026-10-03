"use client";

import { MembershipEligibilityNotice } from "./eligibility-notice";
import { startTransition, useEffect, useState } from "react";
import Link from "next/link";
import { ServiceMonthPicker } from "./service-month-picker";
import { StandardMealSchedule, StandardMealScheduleSummary } from "./standard-meal-schedule";
import { validateStandardMealSlots, type StandardMealSlot } from "@/lib/standard-meal";
import { calendarMonths, complimentaryBenefitConditions, isEligibleServiceMonth, serviceMonthLabel, serviceYears, validateServiceMonths } from "@/lib/membership-service-months";
import { toast } from "sonner";
import { catalogueCategories, type CatalogueCategory, type CatalogueProduct } from "@/lib/catalogue";
import { membershipDeliveryAreas, membershipPreferredDays, membershipPreferredTimes, type MembershipPlan } from "@/lib/membership-plans";
import { calculateMembershipQuote, type MembershipConfiguration, type MembershipPurchaseMode } from "@/lib/membership-request";
import { membershipApplicationPath, membershipSignInPath } from "@/lib/auth-redirect";
import type { MembershipPlanBlockState } from "@/lib/membership-plan-state";
import { membershipPlanBlockLabel, membershipPlanBlockMessage } from "@/lib/membership-plan-state";

export const membershipConfigurationStorageKey = "sbf-membership-configuration";

const preferenceOptions = ["Thai Food", "Seafood", "Chicken", "Beef", "Pork", "Vegetarian", "Western Food", "Asian Food"];
const foodCategories = catalogueCategories.filter((category) => category.group === "food");
const drinkCategories = catalogueCategories.filter((category) => category.group === "drinks");
type SelectedProduct = { category: string; name: string; quantity: number };

function productKey(category: string, name: string) {
  return `${category}:${name}`;
}

type MembershipQuote = ReturnType<typeof calculateMembershipQuote>;

export function MembershipSelectionCart({
  plan,
  selectedServiceMonths,
  quote,
  purchaseMode,
  area,
  day,
  time,
  blockedStatus,
  saving,
  onContinue,
  onRemove,
  onQuantityChange,
}: {
  plan: MembershipPlan;
  selectedServiceMonths: string[];
  quote: MembershipQuote;
  purchaseMode: MembershipPurchaseMode;
  area: string;
  day: string;
  time: string;
  blockedStatus: MembershipPlanBlockState | null;
  saving: boolean;
  onContinue: () => void;
  onRemove: (category: string, name: string) => void;
  onQuantityChange: (category: string, name: string, quantity: number) => void;
}) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const items = [
    ...quote.selectedProducts.map(item => ({
      category: item.category,
      name: item.name,
      quantity: item.monthlyQuantity,
      unitPrice: item.unitPrice,
      lineTotal: item.lineTotal,
      quantityLabel: `${item.monthlyQuantity} / month · ${item.totalTermQuantity} total`,
    })),
  ];
  const itemCount = items.reduce((total, item) => total + item.quantity, 0);
  const canContinue = !blockedStatus &&
    !validateServiceMonths(selectedServiceMonths, plan.durationMonths, new Date()) &&
    !(purchaseMode === "membership_with_package" && items.length === 0);

  const header = <div className="shrink-0 border-b border-border/60 px-5 py-4 sm:px-6">
    <p className="text-eyebrow text-gold">Your selection</p>
    <h2 className="mt-2 font-display text-2xl font-light italic">{plan.name}</h2>
    <p className="mt-2 text-xs text-muted-foreground">{selectedServiceMonths.length} of {plan.durationMonths} service months selected · {itemCount} item{itemCount === 1 ? "" : "s"}</p>
  </div>;

  const selectedItems = <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 py-2 sm:px-6">
    <p className="py-3 text-xs text-muted-foreground">
      {selectedServiceMonths.length
        ? selectedServiceMonths.map(month => serviceMonthLabel(month)).join(" · ")
        : "Choose your service months to continue."}
    </p>
    <p className="border-t border-border/50 py-3 text-xs leading-relaxed text-muted-foreground">
      Included: one {plan.includedBenefit.name} per selected month, up to ฿{plan.includedBenefit.menuValue.toLocaleString("en-US")} eligible food value. No additional benefit charge.
    </p>
    <StandardMealScheduleSummary slots={quote.purchaseSnapshot.standardMealSlots ?? []} />
    <div className="grid grid-cols-2 gap-x-3 gap-y-2 border-t border-border/50 py-3 text-xs">
      <span className="text-muted-foreground">Delivery area</span><span className="text-right">{area}</span>
      <span className="text-muted-foreground">Preferred day</span><span className="text-right">{day}</span>
      <span className="text-muted-foreground">Preferred time</span><span className="text-right">{time}</span>
    </div>
    {items.length === 0
      ? <p className="border-t border-border/50 py-4 text-sm text-muted-foreground">
          {purchaseMode === "membership_only" ? "No product preferences selected." : "Select products for your prepaid package."}
        </p>
      : <div className="mt-2 border-t border-border/50">
          <p className="py-3 text-xs text-eyebrow text-gold">
            {purchaseMode === "membership_with_package" ? "Prepaid package items" : "Selected preferences · not prepaid"}
          </p>
          {items.map(item => <div key={`${item.category}:${item.name}`} className="border-t border-border/40 py-3">
            <div className="flex min-w-0 items-start justify-between gap-3">
              <p className="min-w-0 flex-1 break-words text-sm leading-snug text-foreground/90">{item.name}</p>
              <div className="shrink-0 text-right text-sm text-gold">
                {purchaseMode === "membership_with_package" ? `฿${item.lineTotal.toLocaleString("en-US")}` : "Not prepaid"}
                <span className="mt-1 block text-[0.68rem] text-muted-foreground">Unit ฿{item.unitPrice.toLocaleString("en-US")}</span>
              </div>
            </div>
            <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
              <button type="button" aria-label={`Decrease ${item.name} quantity`} onClick={() => onQuantityChange(item.category, item.name, item.quantity - 1)} className="inline-flex size-7 items-center justify-center rounded-sm border border-border/60 text-base hover:border-gold/60">−</button>
              <span className="min-w-5 text-center" aria-label={`Quantity ${item.quantity}`}>{item.quantity}</span>
              <button type="button" aria-label={`Increase ${item.name} quantity`} onClick={() => onQuantityChange(item.category, item.name, item.quantity + 1)} className="inline-flex size-7 items-center justify-center rounded-sm border border-border/60 text-base hover:border-gold/60">+</button>
              <span className="min-w-0 break-words text-muted-foreground">{item.quantityLabel}</span>
              <button type="button" onClick={() => onRemove(item.category, item.name)} className="ml-auto text-muted-foreground underline underline-offset-2 hover:text-gold">Remove</button>
            </div>
          </div>)}
        </div>}
  </div>;

  const footer = <div className="shrink-0 border-t border-border/60 bg-card/80 px-5 py-4 sm:px-6">
    <div className="space-y-2 text-sm">
      <div className="flex justify-between gap-4"><span className="text-muted-foreground">Membership fee</span><span>฿{quote.membershipFee.toLocaleString("en-US")}</span></div>
      {purchaseMode === "membership_with_package" && <div className="flex justify-between gap-4"><span className="text-muted-foreground">Food package</span><span>฿{quote.packageSubtotal.toLocaleString("en-US")}</span></div>}
      <div className="flex justify-between gap-4 border-t border-border/50 pt-2 text-base"><span>Due after approval</span><span className="text-gold">฿{quote.total.toLocaleString("en-US")}</span></div>
    </div>
    {purchaseMode === "membership_with_package" && <p className="mt-2 text-[0.68rem] leading-relaxed text-muted-foreground">Package prices reflect quantity × unit price × selected service months. Delivery scheduling is arranged separately.</p>}
    <div className="mt-4">
      {blockedStatus
        ? <div role="status" className="rounded-sm border border-gold/35 bg-gold/5 p-3 text-center">
            <p className="text-eyebrow text-gold">{membershipPlanBlockLabel(blockedStatus)}</p>
            <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{membershipPlanBlockMessage(blockedStatus)}</p>
            {blockedStatus === "active" && <Link href="/dashboard/membership" className="mt-2 inline-block text-xs text-gold underline">View membership</Link>}
          </div>
        : <button type="button" disabled={saving || !canContinue} onClick={onContinue} className="inline-flex min-h-12 w-full items-center justify-center rounded-full bg-gold px-6 py-3 text-eyebrow text-gold-foreground disabled:opacity-50">{saving ? "Saving…" : "Continue to Application"}</button>}
    </div>
  </div>;

  return <>
    <aside className="hidden min-w-0 self-start lg:sticky lg:top-24 lg:block">
      <div className="flex max-h-[calc(100dvh-7rem)] min-h-0 flex-col overflow-hidden rounded-sm border border-gold/45 bg-card/90 shadow-xl shadow-black/20">
        {header}
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">{selectedItems}</div>
        {footer}
      </div>
    </aside>
    <div className="fixed inset-x-0 bottom-0 z-40 px-3 pb-3 lg:hidden">
      <button type="button" aria-expanded={mobileOpen} aria-controls="mobile-membership-selection" onClick={() => setMobileOpen(true)} className={`${mobileOpen ? "hidden " : ""}mx-auto flex min-h-14 max-w-xl items-center justify-between gap-4 rounded-full border border-gold/60 bg-background/95 px-5 text-left shadow-xl shadow-black/40 backdrop-blur`}>
        <span className="min-w-0">
          <span className="block truncate text-sm text-foreground">Cart · {itemCount} item{itemCount === 1 ? "" : "s"}</span>
          <span className="block text-xs text-muted-foreground">Membership selection</span>
        </span>
        <span className="shrink-0 text-sm text-gold">฿{quote.total.toLocaleString("en-US")} · VIEW</span>
      </button>
      <div id="mobile-membership-selection" className={`${mobileOpen ? "" : "hidden "}mx-auto flex max-h-[78dvh] max-w-xl flex-col overflow-hidden rounded-t-lg border border-gold/45 bg-card shadow-2xl shadow-black/50`}>
        <div className="flex shrink-0 items-start justify-between gap-4">
          {header}
          <button type="button" onClick={() => setMobileOpen(false)} aria-label="Close selection" className="mr-4 mt-4 inline-flex size-9 shrink-0 items-center justify-center rounded-full border border-border/70 text-lg text-gold">×</button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">{selectedItems}</div>
        {footer}
      </div>
    </div>
  </>;
}

export function MembershipDetail({ plan, blockedStatus = null, today }: { plan: MembershipPlan; blockedStatus?: MembershipPlanBlockState | null; today: string }) {
  const [selectedServiceMonths, setServiceMonths] = useState<string[]>([]);
  const [year, setYear] = useState(() => serviceYears(new Date(today)).find(value => calendarMonths(value).filter(month => isEligibleServiceMonth(month, new Date(today))).length >= plan.durationMonths)!);
  const [saving, setSaving] = useState(false);
  const [currentBlockStatus, setCurrentBlockStatus] = useState(blockedStatus);
  const [area, setArea] = useState<(typeof membershipDeliveryAreas)[number]>(membershipDeliveryAreas[0]);
  const [day, setDay] = useState<(typeof membershipPreferredDays)[number]>(membershipPreferredDays[0]);
  const [time, setTime] = useState<(typeof membershipPreferredTimes)[number]>(membershipPreferredTimes[0]);
  const [preferences, setPreferences] = useState<string[]>([]);
  const [purchaseMode, setPurchaseMode] = useState<MembershipPurchaseMode>("membership_only");
  const [standardMealSlots, setStandardMealSlots] = useState<StandardMealSlot[]>([]);
  const [openCategories, setOpenCategories] = useState<string[]>([]);
  const [selectedProducts, setSelectedProducts] = useState<SelectedProduct[]>([]);

  useEffect(() => {
    try {
      const stored = window.sessionStorage.getItem(membershipConfigurationStorageKey);
      if (!stored) return;
      const configuration = JSON.parse(stored) as MembershipConfiguration;
      if (configuration.planSlug !== plan.slug) return;
      startTransition(() => {
        setStandardMealSlots(configuration.standardMealSlots ?? []);
        if (Array.isArray(configuration.selectedServiceMonths) && !validateServiceMonths(configuration.selectedServiceMonths, plan.durationMonths, new Date(today))) {
          setServiceMonths(configuration.selectedServiceMonths);
          setYear(Number(configuration.selectedServiceMonths[0].slice(0, 4)));
        }
        if ((membershipDeliveryAreas as readonly string[]).includes(configuration.deliveryArea)) setArea(configuration.deliveryArea as (typeof membershipDeliveryAreas)[number]);
        if ((membershipPreferredDays as readonly string[]).includes(configuration.preferredDay)) setDay(configuration.preferredDay as (typeof membershipPreferredDays)[number]);
        if ((membershipPreferredTimes as readonly string[]).includes(configuration.preferredTime)) setTime(configuration.preferredTime as (typeof membershipPreferredTimes)[number]);
        setPreferences(configuration.foodPreferences);
        const savedMode = configuration.purchaseMode ?? "membership_only";
        setPurchaseMode(savedMode);
        setSelectedProducts(savedMode === "membership_with_package"
          ? (configuration.selectedProducts ?? []).filter((product) => {
            const category = catalogueCategories.find(item => item.name === product.category);
            return category?.products.some(item => item.name === product.name) ?? false;
          })
          : []);
        setOpenCategories(savedMode === "membership_with_package"
          ? [...foodCategories, ...drinkCategories].map((category) => category.name)
          : []);
      });
    } catch {
      try { window.sessionStorage.removeItem(membershipConfigurationStorageKey); } catch { /* Storage may be disabled. */ }
    }
  }, [plan.slug, plan.durationMonths, today]);

  const configuration: MembershipConfiguration = {
    planSlug: plan.slug,
    selectedServiceMonths,
    purchaseMode,
    foodPreferences: preferences,
    deliveryArea: area,
    preferredDay: day,
    preferredTime: time,
    standardMealSlots: standardMealSlots.filter(slot => selectedServiceMonths.includes(slot.serviceMonth)),
    selectedProducts,
  };
  const quote = calculateMembershipQuote(configuration, plan);
  const blocked = currentBlockStatus !== null;

  function choosePurchaseMode(mode: MembershipPurchaseMode) {
    setPurchaseMode(mode);
    if (mode === "membership_only") {
      setSelectedProducts([]);
      setOpenCategories([]);
      return;
    }
    setOpenCategories([...foodCategories, ...drinkCategories].map((category) => category.name));
  }

  function togglePreference(preference: string) {
    setPreferences((current) => current.includes(preference) ? current.filter((item) => item !== preference) : [...current, preference]);
  }

  function toggleCategory(categoryName: string) {
    setOpenCategories((current) => current.includes(categoryName) ? current.filter((item) => item !== categoryName) : [...current, categoryName]);
  }

  function toggleProduct(category: CatalogueCategory, product: CatalogueProduct) {
    setSelectedProducts((current) => {
      const key = productKey(category.name, product.name);
      return current.some((item) => productKey(item.category, item.name) === key)
        ? current.filter((item) => productKey(item.category, item.name) !== key)
        : [...current, { category: category.name, name: product.name, quantity: 1 }];
    });
  }

  function removeProduct(selected: SelectedProduct) {
    setSelectedProducts((current) => current.filter((item) => productKey(item.category, item.name) !== productKey(selected.category, selected.name)));
  }

  function changeProductQuantity(selected: SelectedProduct, quantity: number) {
    if (quantity < 1) return removeProduct(selected);
    if (quantity > 100) return;
    setSelectedProducts((current) => current.map((item) => productKey(item.category, item.name) === productKey(selected.category, selected.name) ? { ...item, quantity } : item));
  }

  async function continueToApplication() {
    if (blocked || saving) return;
    const monthError = validateServiceMonths(selectedServiceMonths, plan.durationMonths, new Date());
    if (monthError) { toast.error(monthError); return; }
    const slotError = validateStandardMealSlots(standardMealSlots.filter(slot => selectedServiceMonths.includes(slot.serviceMonth)), selectedServiceMonths, new Date());
    if (slotError) { toast.error(slotError); return; }
    setSaving(true);
    const configuration: MembershipConfiguration = {
      planSlug: plan.slug,
      selectedServiceMonths,
      purchaseMode,
      foodPreferences: preferences,
      deliveryArea: area,
      preferredDay: day,
      preferredTime: time,
      standardMealSlots: standardMealSlots.filter(slot => selectedServiceMonths.includes(slot.serviceMonth)),
      selectedProducts,
    };
    // The server cookie preserves the cart even when browser storage is unavailable.
    try { window.sessionStorage.setItem(membershipConfigurationStorageKey, JSON.stringify(configuration)); } catch { /* Storage may be disabled. */ }
    let response: Response;
    try {
      response = await fetch("/api/membership/checkout-selection", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planSlug: plan.slug, configuration }),
      });
    } catch {
      setSaving(false);
      toast.error("Unable to save your membership selection. Please try again.");
      return;
    }
    if (!response.ok) {
      const payload = await response.json().catch(() => ({}));
      setSaving(false);
      if (payload.code === "PLAN_ALREADY_REQUESTED") setCurrentBlockStatus(payload.planStatus ?? "in_progress");
      toast.error(payload.error ?? "Unable to save your membership selection.");
      return;
    }
    const payload = await response.json().catch(() => ({}));
    if (payload.next !== membershipApplicationPath && payload.next !== membershipSignInPath) {
      setSaving(false);
      toast.error("Unable to continue. Please reload the page and try again.");
      return;
    }
    window.location.assign(payload.next);
  }

  function renderCategory(category: CatalogueCategory) {
    const isOpen = openCategories.includes(category.name);
    const selectedCount = selectedProducts.filter((item) => item.category === category.name).length;
    return <div key={category.name} className="overflow-hidden rounded-sm border border-border/60 bg-card/20">
      <button type="button" onClick={() => toggleCategory(category.name)} aria-expanded={isOpen} className="flex w-full items-center justify-between gap-5 px-5 py-4 text-left transition-colors hover:bg-card/50 sm:px-6">
        <span><span className="block font-display text-xl font-light italic">{category.name}</span><span className="mt-1 block text-xs text-muted-foreground">{category.products.length} products · from ฿{category.indicativeFrom.toLocaleString("en-US")}</span></span>
        <span className="flex shrink-0 items-center gap-3 text-xs text-gold"><span>{selectedCount ? `${selectedCount} selected` : "Browse"}</span><span className="text-lg">{isOpen ? "−" : "+"}</span></span>
      </button>
      {isOpen && <div className="border-t border-border/50 p-3 sm:p-4"><div className="grid gap-2">{category.products.map((product) => { const selected = selectedProducts.some((item) => productKey(item.category, item.name) === productKey(category.name, product.name)); return <label key={product.name} className={`flex cursor-pointer items-start gap-3 rounded-sm border px-3 py-3 text-sm transition-colors ${selected ? "border-gold/70 bg-gold/10" : "border-border/40 hover:border-gold/40"}`}><input type="checkbox" checked={selected} onChange={() => toggleProduct(category, product)} className="mt-1 size-4 shrink-0 accent-[var(--gold)]" /><span className="min-w-0 flex-1"><span className="block text-foreground/90">{product.name}</span><span className="mt-1 block text-xs text-muted-foreground">Quantity per selected service month; delivery arranged separately</span></span><span className="shrink-0 text-right text-gold">฿{product.price.toLocaleString("en-US")}</span></label>; })}</div></div>}
    </div>;
  }

  return <div className="pb-28">
    <header className="mx-auto max-w-7xl px-5 pb-16 pt-36 sm:px-8 sm:pt-52"><p className="text-eyebrow text-gold">Membership {plan.durationMonths} {plan.durationMonths === 1 ? "Month" : "Months"}</p><div className="mt-6 flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between"><div><h1 className="font-display text-h1 font-light">{plan.name}</h1><p className="lead mt-6 max-w-xl">{plan.description}</p></div><div className="shrink-0 lg:text-right"><p className="text-4xl text-gold">฿{plan.price.toLocaleString("en-US")} one time</p><p className="mt-2 text-sm text-muted-foreground">Membership Duration: {plan.durationMonths} {plan.durationMonths === 1 ? "Month" : "Months"}</p></div></div></header>
    <div className="mx-auto max-w-7xl px-5 sm:px-8"><MembershipEligibilityNotice /></div>
    <main className="mx-auto grid max-w-7xl gap-8 px-5 sm:px-8 lg:grid-cols-[minmax(0,1fr)_22rem] lg:gap-10">
      <div className="min-w-0 space-y-14 sm:space-y-16">
        <section><p className="text-eyebrow text-gold">Your membership</p><div className="mt-6 grid gap-4 sm:grid-cols-2">{[["Membership fee", `฿${plan.price.toLocaleString("en-US")}`], ["Service months", `Choose exactly ${plan.durationMonths} eligible months`]].map(([label, value]) => <div key={label} className="border-t border-border/60 pt-4"><p className="text-xs text-muted-foreground">{label}</p><p className="mt-2 text-lg text-foreground/90">{value}</p></div>)}</div></section>
        <ServiceMonthPicker count={plan.durationMonths} year={year} selected={selectedServiceMonths} onYear={value => { setYear(value); setServiceMonths([]); setStandardMealSlots([]); }} onChange={months => { setServiceMonths(months); setStandardMealSlots(slots => slots.filter(slot => months.includes(slot.serviceMonth))); }} today={today} />
        <StandardMealSchedule months={selectedServiceMonths} slots={standardMealSlots} allowance={plan.includedBenefit.menuValue} today={today} onChange={setStandardMealSlots} />
        <section className="border-l-2 border-gold pl-5"><h2 className="text-eyebrow leading-relaxed text-gold">Included member benefit</h2><p className="mt-4">{plan.includedBenefit.name} · Up to ฿{plan.includedBenefit.menuValue.toLocaleString("en-US")} per selected service month</p><p className="mt-3 text-sm text-muted-foreground">One complimentary meal per selected month is already included in your membership fee. It is separate from prepaid packages and extra orders.</p><p className="mt-3 text-xs text-muted-foreground">{complimentaryBenefitConditions}</p></section>
        <section><p className="text-eyebrow text-gold">Purchase option</p><fieldset className="mt-5 grid gap-3 sm:grid-cols-2"><legend className="sr-only">Choose a membership purchase mode</legend><label className={`flex cursor-pointer gap-3 rounded-sm border p-4 ${purchaseMode === "membership_only" ? "border-gold bg-gold/5" : "border-border/60"}`}><input type="radio" name="purchaseMode" value="membership_only" checked={purchaseMode === "membership_only"} onChange={() => choosePurchaseMode("membership_only")} className="mt-1 size-4 accent-[var(--gold)]" /><span><span className="block text-sm">Membership only</span><span className="mt-1 block text-xs leading-relaxed text-muted-foreground">Membership fee includes your monthly member benefit. Other orders are paid separately.</span></span></label><label className={`flex cursor-pointer gap-3 rounded-sm border p-4 ${purchaseMode === "membership_with_package" ? "border-gold bg-gold/5" : "border-border/60"}`}><input type="radio" name="purchaseMode" value="membership_with_package" checked={purchaseMode === "membership_with_package"} onChange={() => choosePurchaseMode("membership_with_package")} className="mt-1 size-4 accent-[var(--gold)]" /><span><span className="block text-sm">Membership + prepaid package</span><span className="mt-1 block text-xs leading-relaxed text-muted-foreground">Prepay monthly product quantities for your selected membership duration.</span></span></label></fieldset></section>
        {purchaseMode === "membership_with_package" && <section><p className="text-eyebrow text-gold">Build your package</p><p className="mt-4 max-w-2xl text-sm text-muted-foreground">Choose any eligible food and beverage items for your prepaid package.</p><div className="mt-8 space-y-3">{foodCategories.map(renderCategory)}{drinkCategories.map(renderCategory)}</div></section>}
        <section><p className="text-eyebrow text-gold">Delivery details</p><div className="mt-6 grid gap-4 sm:grid-cols-3">{[["Delivery area", area, setArea, membershipDeliveryAreas], ["Preferred day", day, setDay, membershipPreferredDays], ["Preferred time", time, setTime, membershipPreferredTimes]].map(([label, value, setter, options]) => <label key={label as string} className="text-sm"><span className="mb-2 block text-xs text-muted-foreground">{label as string}</span><select value={value as string} onChange={(event) => (setter as (nextValue: string) => void)(event.target.value)} className="h-11 w-full rounded-sm border border-input bg-background px-3">{(options as readonly string[]).map((option) => <option key={option}>{option}</option>)}</select></label>)}</div></section>
        <section><p className="text-eyebrow text-gold">Food preferences</p><p className="mt-4 text-sm text-muted-foreground">Preferences help us plan your menu alongside the products you select.</p><div className="mt-6 grid gap-3 sm:grid-cols-2">{preferenceOptions.map((preference) => <label key={preference} className="flex items-center gap-3 rounded-sm border border-border/60 px-4 py-3 text-sm"><input type="checkbox" checked={preferences.includes(preference)} onChange={() => togglePreference(preference)} className="size-4 accent-[var(--gold)]" />{preference}</label>)}</div></section>

      </div>
      <MembershipSelectionCart
        plan={plan}
        selectedServiceMonths={selectedServiceMonths}
        quote={quote}
        purchaseMode={purchaseMode}
        area={area}
        day={day}
        time={time}
        blockedStatus={currentBlockStatus}
        saving={saving}
        onContinue={continueToApplication}
        onRemove={(category, name) => removeProduct({ category, name, quantity: 1 })}
        onQuantityChange={(category, name, quantity) => changeProductQuantity({ category, name, quantity }, quantity)}
      />
    </main>
  </div>;
}
