import type { Metadata } from "next";
import Link from "next/link";
import { PageHeader } from "@/components/site/page-header";
import { Reveal } from "@/components/motion/reveal";
import { alcoholControls, catalogueCategories, menuRotation, servicePeriods } from "@/lib/catalogue";

export const metadata: Metadata = {
  title: "Food & Drink Catalogue",
  description: "Thailand-focused food, drinks, and regulated alcohol catalogue for Sanbay Fusion memberships.",
  alternates: { canonical: "/catalogue" },
};

const groupLabels = { food: "Food catalogue", drinks: "Drinks catalogue", alcohol: "Regulated alcohol catalogue" } as const;

export default function CataloguePage() {
  return (
    <div className="pb-28">
      <PageHeader eyebrow="The catalogue" title="Your food. Your drinks. Your membership." lead="A Thailand-focused catalogue across Thai, international, Western, Asian, vegetarian, seafood, meat, drinks, and legally permitted beverage categories. Memberships deliver predefined packages, not one-off shopping lists." />
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <Reveal variant="up" className="grid gap-5 border-y border-border/60 py-6 sm:grid-cols-2 lg:grid-cols-4"><div><p className="text-eyebrow text-gold">Service periods</p><p className="mt-3 text-sm text-foreground/75">{servicePeriods.join(" · ")}</p></div><div><p className="text-eyebrow text-gold">Indicative food prices</p><p className="mt-3 text-sm text-foreground/75">From ฿60 per item</p></div><div><p className="text-eyebrow text-gold">Package model</p><p className="mt-3 text-sm text-foreground/75">Predefined scheduled packages</p></div><div><p className="text-eyebrow text-gold">Currency</p><p className="mt-3 text-sm text-foreground/75">Thai Baht (THB)</p></div></Reveal>

        {(["food", "drinks", "alcohol"] as const).map((group) => {
          const categories = catalogueCategories.filter((category) => category.group === group);
          return <section key={group} className="mt-20"><Reveal variant="up"><p className="text-eyebrow text-gold">{groupLabels[group]}</p><h2 className="mt-5 font-display text-4xl font-light sm:text-5xl">{group === "food" ? "A generous menu to rotate" : group === "drinks" ? "Pour, steep, press, refresh" : "Separate, age-restricted, controlled"}</h2></Reveal><div className="mt-10 grid gap-6 md:grid-cols-2">{categories.map((category, index) => <Reveal key={category.name} variant="up" delay={(index % 2) * 0.05}><article className={`rounded-sm border p-7 sm:p-8 ${group === "alcohol" ? "border-gold/40 bg-gold/5" : "border-border/60 bg-card/30"}`}><div className="flex items-start justify-between gap-5"><h3 className="font-display text-2xl font-light italic">{category.name}</h3>{category.vegetarianFriendly && <span className="text-eyebrow text-gold">Vegetarian options</span>}</div><p className="mt-3 text-sm leading-relaxed text-foreground/70">{category.description}</p><p className="mt-4 text-sm text-gold">Indicative prices from ฿{category.indicativeFrom.toLocaleString("en-US")}</p><ul className="mt-6 grid gap-x-5 gap-y-2 border-t border-border/50 pt-5 text-sm text-foreground/80 sm:grid-cols-2">{category.products.map((product) => <li key={product} className="flex gap-2"><span className="text-gold">·</span>{product}</li>)}</ul></article></Reveal>)}</div></section>;
        })}

        <section className="mt-24"><Reveal variant="up"><p className="text-eyebrow text-gold">Menu rotation</p><h2 className="mt-5 font-display text-4xl font-light sm:text-5xl">A changing weekly rhythm</h2></Reveal><div className="mt-10 grid gap-6 md:grid-cols-2">{menuRotation.map((week) => <Reveal key={week.week} variant="up"><article className="rounded-sm border border-border/60 bg-card/30 p-7 sm:p-8"><h3 className="font-display text-3xl font-light italic">{week.week}</h3><ul className="mt-6 divide-y divide-border/50">{week.days.map(([day, product]) => <li key={day} className="flex justify-between gap-5 py-3 text-sm"><span className="text-muted-foreground">{day}</span><span className="text-right text-foreground/85">{product}</span></li>)}</ul></article></Reveal>)}</div></section>

        <section className="mt-24"><Reveal variant="up" className="rounded-sm border border-gold/40 bg-gold/5 p-8 sm:p-10"><p className="text-eyebrow text-gold">Alcohol controls</p><h2 className="mt-5 font-display text-3xl font-light italic">Separate by design</h2><p className="mt-4 max-w-2xl text-sm leading-relaxed text-foreground/75">Alcohol is never automatically added to a food-only package. Any future sale or delivery must be enabled only where permitted by applicable Thai rules, with product-level controls and responsible-sale notices.</p><ul className="mt-7 grid gap-3 text-sm text-foreground/80 sm:grid-cols-2">{alcoholControls.map((control) => <li key={control} className="flex gap-3"><span className="text-gold">+</span>{control}</li>)}</ul></Reveal></section>

        <Reveal variant="fade" className="mt-20 text-center"><p className="text-sm leading-relaxed text-muted-foreground">Catalogue prices and package contents remain configurable. The final membership offer will confirm ingredients, allergens, delivery dates, taxes, fees, and legal availability before payment.</p><Link href="/plans" className="mt-7 inline-flex rounded-full bg-gold px-7 py-3 text-eyebrow text-gold-foreground">Compare Memberships</Link></Reveal>
      </div>
    </div>
  );
}
