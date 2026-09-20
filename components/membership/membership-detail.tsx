"use client";

import { useEffect, useMemo, useState } from "react";
import { alcoholSalesEnabled, beverageAddOns, type MembershipPlan } from "@/lib/membership-plans";
import type { MembershipConfiguration } from "@/lib/membership-request";

export const membershipConfigurationStorageKey = "sbf-membership-configuration";

const preferenceOptions = ["Thai Food", "Seafood", "Chicken", "Beef", "Pork", "Vegetarian", "Western Food", "Asian Food"];
const areas = ["Bangkok central", "Greater Bangkok", "Selected nearby districts"];
const days = ["Monday", "Wednesday", "Friday", "Saturday", "Sunday"];
const times = ["09:00–12:00", "12:00–15:00", "17:00–20:00"];

export function MembershipDetail({ plan }: { plan: MembershipPlan }) {
  const [area, setArea] = useState(areas[0]);
  const [day, setDay] = useState(days[0]);
  const [time, setTime] = useState(times[0]);
  const [preferences, setPreferences] = useState<string[]>([]);
  const [alcoholOpen, setAlcoholOpen] = useState(false);
  const [selected, setSelected] = useState<Record<string, { name: string; quantity: number }>>({});

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
      setSelected(Object.fromEntries(configuration.selectedAddOns.map((item) => [item.category, { name: item.name, quantity: item.quantity }])));
    } catch {
      window.sessionStorage.removeItem(membershipConfigurationStorageKey);
    }
  }, [plan.slug]);

  const allowedAddOns = beverageAddOns.filter((addOn) => plan.allowedBeverageCategories.includes(addOn.category));
  const addOnTotal = useMemo(() => allowedAddOns.reduce((total, addOn) => total + (selected[addOn.category]?.quantity ?? 0) * addOn.price, 0), [allowedAddOns, selected]);
  const total = plan.price + addOnTotal;

  function togglePreference(preference: string) {
    setPreferences((current) => current.includes(preference) ? current.filter((item) => item !== preference) : [...current, preference]);
  }

  function chooseAddOn(category: string, name: string) {
    setSelected((current) => ({ ...current, [category]: { name, quantity: name === "None" ? 0 : current[category]?.quantity || 1 } }));
  }

  function adjustQuantity(category: string, delta: number) {
    setSelected((current) => {
      const item = current[category];
      if (!item) return current;
      return { ...current, [category]: { ...item, quantity: Math.max(0, Math.min(5, item.quantity + delta)) } };
    });
  }

  function continueToApplication() {
    const configuration: MembershipConfiguration = {
      planSlug: plan.slug,
      foodPreferences: preferences,
      deliveryArea: area,
      preferredDay: day,
      preferredTime: time,
      alcoholEnabled: alcoholOpen,
      selectedAddOns: Object.entries(selected).filter(([, item]) => item.quantity > 0 && item.name !== "None").map(([category, item]) => ({ category, name: item.name, quantity: item.quantity })),
    };
    window.sessionStorage.setItem(membershipConfigurationStorageKey, JSON.stringify(configuration));
    window.location.href = "/membership/apply";
  }

  return (
    <div className="pb-28">
      <header className="mx-auto max-w-7xl px-5 pb-16 pt-36 sm:px-8 sm:pt-52">
        <p className="text-eyebrow text-gold">Membership {plan.id} · {plan.foodLevel}</p>
        <div className="mt-6 flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
          <div><h1 className="font-display text-h1 font-light">{plan.name}</h1><p className="lead mt-6 max-w-xl">A fixed annual package with a defined menu, delivery rhythm, and 12-month membership validity.</p></div>
          <div className="shrink-0 lg:text-right"><p className="text-4xl text-gold">฿{plan.price.toLocaleString("en-US")} / year</p><p className="mt-2 text-sm text-muted-foreground">{plan.deliveryDays} delivery days/month · {plan.deliveryDaysPerYear} delivery days/year</p></div>
        </div>
      </header>

      <main className="mx-auto grid max-w-7xl gap-12 px-5 sm:px-8 lg:grid-cols-[minmax(0,1fr)_22rem]">
        <div className="space-y-20">
          <section><p className="text-eyebrow text-gold">Your membership</p><div className="mt-6 grid gap-4 sm:grid-cols-2">{[["Annual membership fee", `฿${plan.price.toLocaleString("en-US")}`], ["Validity", "12 months from activation"], ["Monthly delivery entitlement", `${plan.deliveryDays} days`], ["Annual delivery entitlement", `${plan.deliveryDaysPerYear} days`], ["Delivery rhythm", plan.rhythm], ["Food level", plan.foodLevel]].map(([label, value]) => <div key={label} className="border-t border-border/60 pt-4"><p className="text-xs text-muted-foreground">{label}</p><p className="mt-2 text-lg text-foreground/90">{value}</p></div>)}</div></section>

          <section><p className="text-eyebrow text-gold">Your food menu</p><p className="mt-4 text-sm text-muted-foreground">Food menu values are reference values inside the membership, not separate purchases.</p><div className="mt-8 grid gap-4 sm:grid-cols-2">{plan.exampleMenu.map((item, index) => <article key={item} className="rounded-sm border border-border/60 bg-card/30 p-5"><p className="text-xs text-gold">{["Thai", "Seafood", "Main", "Side"][index % 4]}</p><h2 className="mt-3 font-display text-2xl font-light italic">{item}</h2><p className="mt-3 text-sm text-foreground/70">Seasonal example included in the {plan.foodLevel} menu rotation.</p><p className="mt-4 text-sm text-muted-foreground">Reference value ฿{Math.round(plan.foodValueRange[0] + ((plan.foodValueRange[1] - plan.foodValueRange[0]) * (index % 3)) / 2).toLocaleString("en-US")}</p></article>)}</div><p className="mt-5 text-sm text-muted-foreground">Estimated food value per delivery: ฿{plan.foodValueRange[0].toLocaleString("en-US")}–฿{plan.foodValueRange[1].toLocaleString("en-US")}.</p></section>

          <section><p className="text-eyebrow text-gold">Your delivery benefits</p><div className="mt-6 grid gap-4 sm:grid-cols-3">{[["Delivery area", area, setArea, areas], ["Preferred day", day, setDay, days], ["Preferred time", time, setTime, times]].map(([label, value, setter, options]) => <label key={label as string} className="text-sm"><span className="mb-2 block text-xs text-muted-foreground">{label as string}</span><select value={value as string} onChange={(event) => (setter as (value: string) => void)(event.target.value)} className="h-11 w-full rounded-sm border border-input bg-background px-3">{(options as string[]).map((option) => <option key={option}>{option}</option>)}</select></label>)}</div></section>

          <section><p className="text-eyebrow text-gold">Food preferences</p><p className="mt-4 text-sm text-muted-foreground">Preferences help us plan your menu. They do not change the membership price.</p><div className="mt-6 grid gap-3 sm:grid-cols-2">{preferenceOptions.map((preference) => <label key={preference} className="flex items-center gap-3 rounded-sm border border-border/60 px-4 py-3 text-sm"><input type="checkbox" checked={preferences.includes(preference)} onChange={() => togglePreference(preference)} className="size-4 accent-[var(--gold)]" />{preference}</label>)}</div></section>

          <section><div className="flex flex-wrap items-center justify-between gap-4"><div><p className="text-eyebrow text-gold">Beverage options</p><p className="mt-3 text-sm text-muted-foreground">Alcohol is optional and adds to the annual membership fee.</p></div><button type="button" aria-pressed={alcoholOpen} onClick={() => setAlcoholOpen((value) => !value)} className={`rounded-full px-5 py-3 text-eyebrow ${alcoholOpen ? "bg-gold text-gold-foreground" : "border border-foreground/30"}`}>Include Alcohol Options · {alcoholOpen ? "On" : "Off"}</button></div>{alcoholOpen && <div className="mt-6 rounded-sm border border-gold/40 bg-gold/5 p-5 text-sm leading-relaxed text-foreground/75">Alcohol options are age-restricted and can only be offered after Thai licensing, identity, permitted-hours, advertising, import, premises, and delivery requirements are verified. {alcoholSalesEnabled ? "Availability is enabled for configuration." : "Alcohol sales are currently disabled."}</div>}{alcoholOpen && alcoholSalesEnabled && <div className="mt-6 grid gap-5 sm:grid-cols-2">{allowedAddOns.map((addOn) => <label key={addOn.category} className="rounded-sm border border-border/60 p-5 text-sm"><span className="text-eyebrow text-gold">{addOn.label}</span><select className="mt-4 h-11 w-full rounded-sm border border-input bg-background px-3" value={selected[addOn.category]?.name || "None"} onChange={(event) => chooseAddOn(addOn.category, event.target.value)}><option>None</option>{addOn.options.map((option) => <option key={option}>{option}</option>)}</select>{selected[addOn.category]?.name && <div className="mt-4 flex items-center justify-between text-xs"><span>฿{addOn.price.toLocaleString("en-US")} each</span><span className="flex items-center gap-2"><button type="button" onClick={() => adjustQuantity(addOn.category, -1)} className="size-7 rounded-full border">−</button>{selected[addOn.category].quantity}<button type="button" onClick={() => adjustQuantity(addOn.category, 1)} className="size-7 rounded-full border">+</button></span></div>}</label>)}</div>}</section>
        </div>

        <aside className="h-fit lg:sticky lg:top-28"><div className="rounded-sm border border-gold/50 bg-card/50 p-6 sm:p-8"><p className="text-eyebrow text-gold">Your membership</p><h2 className="mt-4 font-display text-3xl font-light italic">{plan.name}</h2><p className="mt-5 text-2xl text-gold">฿{plan.price.toLocaleString("en-US")} / year</p><div className="mt-6 space-y-3 border-y border-border/50 py-5 text-sm"><div className="flex justify-between gap-4"><span className="text-muted-foreground">Deliveries</span><span>{plan.deliveryDays}/month · {plan.deliveryDaysPerYear}/year</span></div><div className="flex justify-between gap-4"><span className="text-muted-foreground">Area</span><span>{area}</span></div><div className="flex justify-between gap-4"><span className="text-muted-foreground">Schedule</span><span>{day} · {time}</span></div>{Object.entries(selected).filter(([, item]) => item.quantity > 0).map(([category, item]) => <div key={category} className="flex justify-between gap-4"><span className="text-muted-foreground">{item.name} × {item.quantity}</span><span>฿{((beverageAddOns.find((addOn) => addOn.category === category)?.price || 0) * item.quantity).toLocaleString("en-US")}</span></div>)}</div><div className="flex justify-between gap-4 pt-5 text-lg"><span>Total</span><span className="text-gold">฿{total.toLocaleString("en-US")}</span></div><button type="button" onClick={continueToApplication} className="mt-7 inline-flex w-full items-center justify-center rounded-full bg-gold px-6 py-3 text-eyebrow text-gold-foreground">Submit Membership Request</button><p className="mt-4 text-center text-xs leading-relaxed text-muted-foreground">No payment is taken on this page. Your selections will carry into the membership request form.</p></div></aside>
      </main>
    </div>
  );
}
