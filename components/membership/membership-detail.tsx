"use client";

import { useEffect, useMemo, useState } from "react";
import { catalogueCategories, type CatalogueCategory, type CatalogueProduct } from "@/lib/catalogue";
import { alcoholSalesEnabled, type MembershipPlan } from "@/lib/membership-plans";
import type { MembershipConfiguration } from "@/lib/membership-request";

export const membershipConfigurationStorageKey = "sbf-membership-configuration";

const preferenceOptions = ["Thai Food", "Seafood", "Chicken", "Beef", "Pork", "Vegetarian", "Western Food", "Asian Food"];
const areas = ["Bangkok central", "Greater Bangkok", "Selected nearby districts"];
const days = ["Monday", "Wednesday", "Friday", "Saturday", "Sunday"];
const times = ["09:00–12:00", "12:00–15:00", "17:00–20:00"];

type SelectedProduct = { category: string; name: string; quantity: number };

function productKey(category: string, name: string) {
  return `${category}:${name}`;
}

export function MembershipDetail({ plan }: { plan: MembershipPlan }) {
  const [area, setArea] = useState(areas[0]);
  const [day, setDay] = useState(days[0]);
  const [time, setTime] = useState(times[0]);
  const [preferences, setPreferences] = useState<string[]>([]);
  const [alcoholOpen, setAlcoholOpen] = useState(false);
  const [openCategories, setOpenCategories] = useState<string[]>([]);
  const [selectedProducts, setSelectedProducts] = useState<SelectedProduct[]>([]);

  useEffect(() => {
    const stored = window.sessionStorage.getItem(membershipConfigurationStorageKey);
    if (!stored) return;
    try {
      const configuration = JSON.parse(stored) as MembershipConfiguration;
      if (configuration.planSlug !== plan.slug) return;
      setArea(configuration.deliveryArea);
      setDay(configuration.preferredDay);
      setTime(configuration.preferredTime);
      setPreferences(configuration.foodPreferences);
      setAlcoholOpen(configuration.alcoholEnabled);
      setSelectedProducts(configuration.selectedProducts ?? []);
    } catch {
      window.sessionStorage.removeItem(membershipConfigurationStorageKey);
    }
  }, [plan.slug]);

  const foodCategories = catalogueCategories.filter((category) => category.group === "food");
  const alcoholCategories = catalogueCategories.filter((category) => category.group === "alcohol");
  const selectedProductTotal = useMemo(() => selectedProducts.reduce((total, selected) => {
    const category = catalogueCategories.find((item) => item.name === selected.category);
    const product = category?.products.find((item) => item.name === selected.name);
    return total + (product?.price ?? 0) * selected.quantity;
  }, 0), [selectedProducts]);
  const total = plan.price + selectedProductTotal;

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

  async function continueToApplication() {
    const configuration: MembershipConfiguration = {
      planSlug: plan.slug,
      foodPreferences: preferences,
      deliveryArea: area,
      preferredDay: day,
      preferredTime: time,
      alcoholEnabled: alcoholOpen,
      selectedAddOns: [],
      selectedProducts,
    };
    window.sessionStorage.setItem(membershipConfigurationStorageKey, JSON.stringify(configuration));
    const response = await fetch("/api/membership/checkout-selection", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ planSlug: plan.slug, configuration }),
    });
    if (!response.ok) {
      window.location.href = "/signin?next=%2Fmembership%2Fcheckout";
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
      {isOpen && <div className="border-t border-border/50 p-3 sm:p-4"><div className="grid gap-2">{category.products.map((product) => { const selected = selectedProducts.some((item) => productKey(item.category, item.name) === productKey(category.name, product.name)); return <label key={product.name} className={`flex cursor-pointer items-start gap-3 rounded-sm border px-3 py-3 text-sm transition-colors ${selected ? "border-gold/70 bg-gold/10" : "border-border/40 hover:border-gold/40"}`}><input type="checkbox" checked={selected} onChange={() => toggleProduct(category, product)} className="mt-1 size-4 shrink-0 accent-[var(--gold)]" /><span className="min-w-0 flex-1"><span className="block text-foreground/90">{product.name}</span><span className="mt-1 block text-xs text-muted-foreground">Premium catalogue selection</span></span><span className="shrink-0 text-right text-gold">฿{product.price.toLocaleString("en-US")}</span></label>; })}</div></div>}
    </div>;
  }

  return <div className="pb-28">
    <header className="mx-auto max-w-7xl px-5 pb-16 pt-36 sm:px-8 sm:pt-52"><p className="text-eyebrow text-gold">Membership {plan.id} · {plan.foodLevel}</p><div className="mt-6 flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between"><div><h1 className="font-display text-h1 font-light">{plan.name}</h1><p className="lead mt-6 max-w-xl">A fixed annual package with a defined menu, delivery rhythm, and 12-month membership validity.</p></div><div className="shrink-0 lg:text-right"><p className="text-4xl text-gold">฿{plan.price.toLocaleString("en-US")} / year</p><p className="mt-2 text-sm text-muted-foreground">{plan.deliveryDays} delivery days/month · {plan.deliveryDaysPerYear} delivery days/year</p></div></div></header>
    <main className="mx-auto grid max-w-7xl gap-12 px-5 sm:px-8 lg:grid-cols-[minmax(0,1fr)_22rem]">
      <div className="space-y-20">
        <section><p className="text-eyebrow text-gold">Your membership</p><div className="mt-6 grid gap-4 sm:grid-cols-2">{[["Annual membership fee", `฿${plan.price.toLocaleString("en-US")}`], ["Validity", "12 months from activation"], ["Monthly delivery entitlement", `${plan.deliveryDays} days`], ["Annual delivery entitlement", `${plan.deliveryDaysPerYear} days`], ["Delivery rhythm", plan.rhythm], ["Food level", plan.foodLevel]].map(([label, value]) => <div key={label} className="border-t border-border/60 pt-4"><p className="text-xs text-muted-foreground">{label}</p><p className="mt-2 text-lg text-foreground/90">{value}</p></div>)}</div></section>
        <section><p className="text-eyebrow text-gold">Build your package</p><p className="mt-4 max-w-2xl text-sm text-muted-foreground">Open a food category to browse the shared catalogue. Select individual products and they will appear in your plan summary immediately.</p><div className="mt-8 space-y-3">{foodCategories.map(renderCategory)}</div></section>
        <section><p className="text-eyebrow text-gold">Delivery details</p><div className="mt-6 grid gap-4 sm:grid-cols-3">{[["Delivery area", area, setArea, areas], ["Preferred day", day, setDay, days], ["Preferred time", time, setTime, times]].map(([label, value, setter, options]) => <label key={label as string} className="text-sm"><span className="mb-2 block text-xs text-muted-foreground">{label as string}</span><select value={value as string} onChange={(event) => (setter as (nextValue: string) => void)(event.target.value)} className="h-11 w-full rounded-sm border border-input bg-background px-3">{(options as string[]).map((option) => <option key={option}>{option}</option>)}</select></label>)}</div></section>
        <section><p className="text-eyebrow text-gold">Food preferences</p><p className="mt-4 text-sm text-muted-foreground">Preferences help us plan your menu alongside the products you select.</p><div className="mt-6 grid gap-3 sm:grid-cols-2">{preferenceOptions.map((preference) => <label key={preference} className="flex items-center gap-3 rounded-sm border border-border/60 px-4 py-3 text-sm"><input type="checkbox" checked={preferences.includes(preference)} onChange={() => togglePreference(preference)} className="size-4 accent-[var(--gold)]" />{preference}</label>)}</div></section>
        <section><div className="flex flex-wrap items-center justify-between gap-4"><div><p className="text-eyebrow text-gold">Beverage options</p><p className="mt-3 text-sm text-muted-foreground">Open the full alcohol catalogue and select individual bottles.</p></div><button type="button" aria-pressed={alcoholOpen} onClick={() => setAlcoholOpen((value) => !value)} className={`rounded-full px-5 py-3 text-eyebrow ${alcoholOpen ? "bg-gold text-gold-foreground" : "border border-foreground/30"}`}>Add Alcohol · {alcoholOpen ? "On" : "Off"}</button></div>{alcoholOpen && <div className="mt-6 space-y-3"><div className="rounded-sm border border-gold/40 bg-gold/5 p-5 text-sm leading-relaxed text-foreground/75">Alcohol products are age-restricted and subject to Thai licensing, identity, permitted-hours, and delivery requirements. {alcoholSalesEnabled ? "Availability is enabled for configuration." : "The catalogue is available to browse, but alcohol sales are currently disabled."}</div>{alcoholCategories.map(renderCategory)}</div>}</section>
      </div>
      <aside className="h-fit lg:sticky lg:top-28"><div className="rounded-sm border border-gold/50 bg-card/50 p-6 sm:p-8"><p className="text-eyebrow text-gold">Plan details</p><h2 className="mt-4 font-display text-3xl font-light italic">{plan.name}</h2><p className="mt-5 text-2xl text-gold">฿{total.toLocaleString("en-US")} / year</p><div className="mt-6 space-y-3 border-y border-border/50 py-5 text-sm"><div className="flex justify-between gap-4"><span className="text-muted-foreground">Membership</span><span>฿{plan.price.toLocaleString("en-US")}</span></div>{selectedProducts.length === 0 && <p className="text-muted-foreground">No catalogue products selected yet.</p>}{selectedProducts.map((selected) => { const category = catalogueCategories.find((item) => item.name === selected.category); const product = category?.products.find((item) => item.name === selected.name); return <div key={productKey(selected.category, selected.name)} className="flex items-start justify-between gap-3"><span className="min-w-0"><span className="block text-foreground/85">{selected.name}</span><button type="button" onClick={() => removeProduct(selected)} className="mt-1 text-xs text-muted-foreground underline underline-offset-4 hover:text-gold">Remove</button></span><span className="shrink-0 text-right text-gold">฿{((product?.price ?? 0) * selected.quantity).toLocaleString("en-US")}</span></div>; })}</div><div className="flex justify-between gap-4 pt-5 text-lg"><span>Total</span><span className="text-gold">฿{total.toLocaleString("en-US")}</span></div><button type="button" onClick={continueToApplication} className="mt-7 inline-flex w-full items-center justify-center rounded-full bg-gold px-6 py-3 text-eyebrow text-gold-foreground">Continue to Secure Checkout</button><p className="mt-4 text-center text-xs leading-relaxed text-muted-foreground">No payment is captured until you complete the checkout flow. Your package configuration is preserved automatically.</p></div></aside>
    </main>
  </div>;
}