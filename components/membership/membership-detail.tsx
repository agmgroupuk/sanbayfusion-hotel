"use client";

import { startTransition, useEffect, useState } from "react";
import { ActiveMembershipNotice } from "./active-membership-notice";
import { ServiceMonthPicker } from "./service-month-picker";
import { calendarMonths, complimentaryBenefitConditions, isEligibleServiceMonth, serviceMonthLabel, serviceYears, validateServiceMonths } from "@/lib/membership-service-months";
import { toast } from "sonner";
import { catalogueCategories, type CatalogueCategory, type CatalogueProduct } from "@/lib/catalogue";
import { alcoholSalesEnabled, beverageAddOns, membershipDeliveryAreas, membershipPreferredDays, membershipPreferredTimes, type MembershipPlan } from "@/lib/membership-plans";
import { calculateMembershipQuote, type MembershipConfiguration, type MembershipPurchaseMode } from "@/lib/membership-request";

export const membershipConfigurationStorageKey = "sbf-membership-configuration";

const preferenceOptions = ["Thai Food", "Seafood", "Chicken", "Beef", "Pork", "Vegetarian", "Western Food", "Asian Food"];
const foodCategories = catalogueCategories.filter((category) => category.group === "food");
const drinkCategories = catalogueCategories.filter((category) => category.group === "drinks");
const alcoholCategories = catalogueCategories.filter((category) => category.group === "alcohol");
type SelectedProduct = { category: string; name: string; quantity: number };

function productKey(category: string, name: string) {
  return `${category}:${name}`;
}

export function MembershipDetail({ plan, activeMembership = false, today }: { plan: MembershipPlan; activeMembership?: boolean; today: string }) {
  const [selectedServiceMonths, setServiceMonths] = useState<string[]>([]);
  const [year, setYear] = useState(() => serviceYears(new Date(today)).find(value => calendarMonths(value).filter(month => isEligibleServiceMonth(month, new Date(today))).length >= plan.durationMonths)!);
  const [saving, setSaving] = useState(false);
  const [blocked, setBlocked] = useState(activeMembership);
  const [area, setArea] = useState<(typeof membershipDeliveryAreas)[number]>(membershipDeliveryAreas[0]);
  const [day, setDay] = useState<(typeof membershipPreferredDays)[number]>(membershipPreferredDays[0]);
  const [time, setTime] = useState<(typeof membershipPreferredTimes)[number]>(membershipPreferredTimes[0]);
  const [preferences, setPreferences] = useState<string[]>([]);
  const [purchaseMode, setPurchaseMode] = useState<MembershipPurchaseMode>("membership_only");
  const [alcoholOpen, setAlcoholOpen] = useState(false);
  const [openCategories, setOpenCategories] = useState<string[]>([]);
  const [selectedProducts, setSelectedProducts] = useState<SelectedProduct[]>([]);
  const [selectedAddOns, setSelectedAddOns] = useState<SelectedProduct[]>([]);

  useEffect(() => {
    const stored = window.sessionStorage.getItem(membershipConfigurationStorageKey);
    if (!stored) return;
    try {
      const configuration = JSON.parse(stored) as MembershipConfiguration;
      if (configuration.planSlug !== plan.slug) return;
      startTransition(() => {
        const alcoholAvailable = alcoholSalesEnabled && configuration.alcoholEnabled;
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
        setSelectedAddOns(savedMode === "membership_with_package" && alcoholAvailable ? configuration.selectedAddOns ?? [] : []);
        setAlcoholOpen(alcoholAvailable);
        setSelectedProducts(savedMode === "membership_with_package"
          ? (configuration.selectedProducts ?? []).filter((product) => alcoholAvailable || !alcoholCategories.some((category) => category.name === product.category))
          : []);
        setOpenCategories(savedMode === "membership_with_package"
          ? [...foodCategories, ...drinkCategories, ...(alcoholAvailable ? alcoholCategories : [])].map((category) => category.name)
          : []);
      });
    } catch {
      window.sessionStorage.removeItem(membershipConfigurationStorageKey);
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
    alcoholEnabled: alcoholOpen,
    selectedAddOns,
    selectedProducts,
  };
  const quote = calculateMembershipQuote(configuration, plan);

  function choosePurchaseMode(mode: MembershipPurchaseMode) {
    setPurchaseMode(mode);
    if (mode === "membership_only") {
      setSelectedProducts([]);
      setSelectedAddOns([]);
      setAlcoholOpen(false);
      setOpenCategories([]);
      return;
    }
    const alcoholAvailable = alcoholSalesEnabled;
    setAlcoholOpen(alcoholAvailable);
    setOpenCategories([...foodCategories, ...drinkCategories, ...(alcoholAvailable ? alcoholCategories : [])].map((category) => category.name));
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
    setSaving(true);
    const configuration: MembershipConfiguration = {
      planSlug: plan.slug,
    selectedServiceMonths,
      purchaseMode,
      foodPreferences: preferences,
      deliveryArea: area,
      preferredDay: day,
      preferredTime: time,
      alcoholEnabled: alcoholOpen,
      selectedAddOns,
      selectedProducts,
    };
    window.sessionStorage.setItem(membershipConfigurationStorageKey, JSON.stringify(configuration));
    let response: Response;
    try {
      response = await fetch("/api/membership/checkout-selection", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planSlug: plan.slug,
    selectedServiceMonths, configuration }),
      });
    } catch {
      setSaving(false);
      toast.error("Unable to save your membership selection. Please try again.");
      return;
    }
    if (!response.ok) {
      const payload = await response.json().catch(() => ({}));
      setSaving(false);
      if (payload.code === "ACTIVE_MEMBERSHIP") setBlocked(true);
      toast.error(payload.error ?? "Unable to save your membership selection.");
      return;
    }
    window.location.href = "/membership/checkout";
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
    <main className="mx-auto grid max-w-7xl gap-12 px-5 sm:px-8 lg:grid-cols-[minmax(0,1fr)_22rem]">
      <div className="space-y-20">
        <section><p className="text-eyebrow text-gold">Your membership</p><div className="mt-6 grid gap-4 sm:grid-cols-2">{[["Membership fee", `฿${plan.price.toLocaleString("en-US")}`], ["Service months", `Choose exactly ${plan.durationMonths} eligible months`]].map(([label, value]) => <div key={label} className="border-t border-border/60 pt-4"><p className="text-xs text-muted-foreground">{label}</p><p className="mt-2 text-lg text-foreground/90">{value}</p></div>)}</div></section>
        <ServiceMonthPicker count={plan.durationMonths} year={year} selected={selectedServiceMonths} onYear={value => { setYear(value); setServiceMonths([]); }} onChange={setServiceMonths} today={today} />
        <section className="border-l-2 border-gold pl-5"><h2 className="text-eyebrow leading-relaxed text-gold">Included member benefit</h2><p className="mt-4">{plan.includedBenefit.name} · Up to ฿{plan.includedBenefit.menuValue.toLocaleString("en-US")} per selected service month</p><p className="mt-3 text-sm text-muted-foreground">One complimentary meal per selected month is already included in your membership fee. It is separate from prepaid packages and extra orders.</p><p className="mt-3 text-xs text-muted-foreground">{complimentaryBenefitConditions}</p></section>
        <section><p className="text-eyebrow text-gold">Purchase option</p><fieldset className="mt-5 grid gap-3 sm:grid-cols-2"><legend className="sr-only">Choose a membership purchase mode</legend><label className={`flex cursor-pointer gap-3 rounded-sm border p-4 ${purchaseMode === "membership_only" ? "border-gold bg-gold/5" : "border-border/60"}`}><input type="radio" name="purchaseMode" value="membership_only" checked={purchaseMode === "membership_only"} onChange={() => choosePurchaseMode("membership_only")} className="mt-1 size-4 accent-[var(--gold)]" /><span><span className="block text-sm">Membership only</span><span className="mt-1 block text-xs leading-relaxed text-muted-foreground">Membership fee includes your monthly member benefit. Other orders are paid separately.</span></span></label><label className={`flex cursor-pointer gap-3 rounded-sm border p-4 ${purchaseMode === "membership_with_package" ? "border-gold bg-gold/5" : "border-border/60"}`}><input type="radio" name="purchaseMode" value="membership_with_package" checked={purchaseMode === "membership_with_package"} onChange={() => choosePurchaseMode("membership_with_package")} className="mt-1 size-4 accent-[var(--gold)]" /><span><span className="block text-sm">Membership + prepaid package</span><span className="mt-1 block text-xs leading-relaxed text-muted-foreground">Prepay monthly product quantities for your selected membership duration.</span></span></label></fieldset></section>
        {purchaseMode === "membership_with_package" && <section><p className="text-eyebrow text-gold">Build your package</p><p className="mt-4 max-w-2xl text-sm text-muted-foreground">Choose any eligible food and beverage items for your prepaid package.</p><div className="mt-8 space-y-3">{foodCategories.map(renderCategory)}{drinkCategories.map(renderCategory)}</div></section>}
        <section><p className="text-eyebrow text-gold">Delivery details</p><div className="mt-6 grid gap-4 sm:grid-cols-3">{[["Delivery area", area, setArea, membershipDeliveryAreas], ["Preferred day", day, setDay, membershipPreferredDays], ["Preferred time", time, setTime, membershipPreferredTimes]].map(([label, value, setter, options]) => <label key={label as string} className="text-sm"><span className="mb-2 block text-xs text-muted-foreground">{label as string}</span><select value={value as string} onChange={(event) => (setter as (nextValue: string) => void)(event.target.value)} className="h-11 w-full rounded-sm border border-input bg-background px-3">{(options as readonly string[]).map((option) => <option key={option}>{option}</option>)}</select></label>)}</div></section>
        <section><p className="text-eyebrow text-gold">Food preferences</p><p className="mt-4 text-sm text-muted-foreground">Preferences help us plan your menu alongside the products you select.</p><div className="mt-6 grid gap-3 sm:grid-cols-2">{preferenceOptions.map((preference) => <label key={preference} className="flex items-center gap-3 rounded-sm border border-border/60 px-4 py-3 text-sm"><input type="checkbox" checked={preferences.includes(preference)} onChange={() => togglePreference(preference)} className="size-4 accent-[var(--gold)]" />{preference}</label>)}</div></section>
        {purchaseMode === "membership_with_package" && <section><div className="flex flex-wrap items-center justify-between gap-4"><div><p className="text-eyebrow text-gold">Beverage options</p><p className="mt-3 text-sm text-muted-foreground">Open the full alcohol catalogue and select individual bottles.</p></div><button type="button" disabled={!alcoholSalesEnabled} aria-pressed={alcoholOpen} onClick={() => {
          const enabled = !alcoholOpen;
          setAlcoholOpen(enabled);
          if (!enabled) {
            setSelectedAddOns([]);
            setSelectedProducts((current) => current.filter((product) => !alcoholCategories.some((category) => category.name === product.category)));
          }
          setOpenCategories((current) => enabled
            ? [...new Set([...current, ...alcoholCategories.map((category) => category.name)])]
            : current.filter((category) => !alcoholCategories.some((item) => item.name === category)));
        }} className={`rounded-full px-5 py-3 text-eyebrow disabled:cursor-not-allowed disabled:opacity-50 ${alcoholOpen ? "bg-gold text-gold-foreground" : "border border-foreground/30"}`}>{alcoholSalesEnabled ? `Add Alcohol · ${alcoholOpen ? "On" : "Off"}` : "Alcohol · unavailable"}</button></div>{alcoholOpen && <div className="mt-6 space-y-3"><div className="rounded-sm border border-gold/40 bg-gold/5 p-5 text-sm leading-relaxed text-foreground/75">Alcohol products are age-restricted and subject to Thai licensing, identity, permitted-hours, and delivery requirements. Availability is enabled for configuration.</div>{alcoholCategories.map(renderCategory)}</div>}</section>}
        {purchaseMode === "membership_with_package" && alcoholOpen && <section><p className="text-eyebrow text-gold">Eligible add-ons</p><div className="mt-5 space-y-4">{beverageAddOns.filter(addon => plan.allowedBeverageCategories.includes(addon.category)).map(addon => {
          const selected = selectedAddOns.find(item => item.category === addon.category);
          return <div key={addon.category} className="grid gap-3 rounded-sm border border-border/60 p-4 sm:grid-cols-2"><label className="text-sm">{addon.label} · {addon.pricingType === "MONTHLY" ? "Monthly" : "One time"} · ฿{addon.price.toLocaleString("en-US")}<select className="mt-2 w-full rounded-sm border border-input bg-background p-2" value={selected?.name ?? ""} onChange={event => { const name = event.target.value; setSelectedAddOns(current => [...current.filter(item => item.category !== addon.category), ...(name ? [{ category: addon.category, name, quantity: selected?.quantity ?? 1 }] : [])]); }}><option value="">Not selected</option>{addon.options.map(name => <option key={name}>{name}</option>)}</select></label>{selected && <label className="text-sm">{addon.pricingType === "MONTHLY" ? "Monthly Quantity" : "One-time Quantity"}<input type="number" min={1} max={100} value={selected.quantity} onChange={event => { const quantity = Number(event.target.value); if (Number.isInteger(quantity) && quantity >= 1 && quantity <= 100) setSelectedAddOns(current => current.map(item => item.category === addon.category ? { ...item, quantity } : item)); }} className="mt-2 w-full rounded-sm border border-input bg-background p-2" /></label>}</div>;
        })}</div></section>}
      </div>
      <aside className="h-fit lg:sticky lg:top-28"><div className="rounded-sm border border-gold/50 bg-card/50 p-6 sm:p-8"><p className="text-eyebrow text-gold">Membership summary</p><h2 className="mt-4 font-display text-3xl font-light italic">{plan.name}</h2><p className="mt-4 text-sm text-gold">Selected service months</p><p className="mt-2 text-sm">{selectedServiceMonths.length ? selectedServiceMonths.map(month => serviceMonthLabel(month)).join(" · ") : "Choose your months to continue."}</p><p className="mt-3 text-xs text-muted-foreground">Included: {plan.includedBenefit.name} per selected month. No additional benefit charge.</p><p className="mt-5 text-sm text-muted-foreground">{purchaseMode === "membership_with_package" ? `Membership Duration: ${plan.durationMonths} Months` : "Membership only · future orders paid separately"}</p><div className="mt-6 space-y-3 border-y border-border/50 py-5 text-sm"><div className="flex justify-between gap-4"><span className="text-muted-foreground">Membership fee</span><span>฿{quote.membershipFee.toLocaleString("en-US")}</span></div>{selectedProducts.length === 0 ? <p className="text-muted-foreground">{purchaseMode === "membership_only" ? "No product preferences selected." : "Select at least one product for the prepaid package."}</p> : <><p className="pt-2 text-xs text-eyebrow text-gold">{purchaseMode === "membership_with_package" ? "Prepaid package" : "Selected preferences · not prepaid"}</p>{quote.selectedProducts.map((item) => <div key={`${item.category}:${item.name}`} className="flex items-start justify-between gap-3"><span className="min-w-0"><span className="block text-foreground/85">{item.name}</span><span className="mt-1 block text-xs text-muted-foreground">{item.category} · Monthly Quantity: {item.monthlyQuantity}{purchaseMode === "membership_with_package" ? ` · Total Included Quantity: ${item.totalTermQuantity}` : ""}</span><span className="mt-2 flex items-center gap-2"><button type="button" aria-label={`Decrease ${item.name} quantity`} onClick={() => changeProductQuantity({ category: item.category, name: item.name, quantity: item.monthlyQuantity }, item.monthlyQuantity - 1)} className="size-7 rounded-sm border border-border/60">−</button><span className="min-w-5 text-center">{item.monthlyQuantity}</span><button type="button" aria-label={`Increase ${item.name} quantity`} onClick={() => changeProductQuantity({ category: item.category, name: item.name, quantity: item.monthlyQuantity }, item.monthlyQuantity + 1)} className="size-7 rounded-sm border border-border/60">+</button><button type="button" onClick={() => removeProduct({ category: item.category, name: item.name, quantity: item.monthlyQuantity })} className="ml-1 text-xs text-muted-foreground underline">Remove</button></span></span><span className="shrink-0 text-right text-gold"><span className="block text-xs text-muted-foreground">Unit ฿{item.unitPrice.toLocaleString("en-US")}</span>{purchaseMode === "membership_with_package" ? `฿${item.lineTotal.toLocaleString("en-US")}` : "Not prepaid"}</span></div>)}</>}{purchaseMode === "membership_with_package" && quote.selectedAddOns.map(item => <div key={`${item.category}:${item.name}`} className="border-t border-border/50 pt-3"><p className="flex justify-between gap-3"><span>{item.name}</span><span>฿{item.lineTotal.toLocaleString("en-US")}</span></p><p className="mt-1 text-xs text-muted-foreground">Unit Price: ฿{item.unitPrice.toLocaleString("en-US")} · {item.pricingType === "MONTHLY" ? "Monthly Quantity" : "One-time Quantity"}: {item.quantity} · Total Included Quantity: {item.totalTermQuantity}</p></div>)}{purchaseMode === "membership_with_package" && <div className="flex justify-between gap-4 border-t border-border/50 pt-3"><span className="text-muted-foreground">Package subtotal</span><span>฿{quote.packageSubtotal.toLocaleString("en-US")}</span></div>}<div className="flex justify-between gap-4"><span className="text-muted-foreground">Delivery area</span><span>{area}</span></div><div className="flex justify-between gap-4"><span className="text-muted-foreground">Preferred day</span><span>{day}</span></div><div className="flex justify-between gap-4"><span className="text-muted-foreground">Preferred time</span><span>{time}</span></div>{alcoholOpen && <p className="text-gold">Alcohol selection enabled</p>}</div><div className="flex justify-between gap-4 pt-5 text-lg"><span>Expected charge upon approval</span><span className="text-gold">฿{quote.total.toLocaleString("en-US")}</span></div>{purchaseMode === "membership_with_package" && <p className="mt-4 text-xs leading-relaxed text-muted-foreground">Product total = unit price × monthly quantity × selected service months. Delivery scheduling is arranged separately. Included items are not charged again.</p>}<div className="mt-7">{blocked ? <ActiveMembershipNotice /> : <button type="button" disabled={saving || !!validateServiceMonths(selectedServiceMonths, plan.durationMonths, new Date(today)) || (purchaseMode === "membership_with_package" && !selectedProducts.length && !selectedAddOns.length)} onClick={continueToApplication} className="mt-7 inline-flex w-full items-center justify-center rounded-full bg-gold px-6 py-3 text-eyebrow text-gold-foreground disabled:opacity-50">{saving ? "Saving…" : "Continue to Application"}</button>}</div></div></aside>
    </main>
  </div>;
}
