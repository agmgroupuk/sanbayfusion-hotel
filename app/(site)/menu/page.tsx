import { MembershipEligibilityNotice } from "@/components/membership/eligibility-notice";
import type { Metadata } from "next";
import Link from "next/link";
import { getMenu } from "@/lib/sanity/queries";
import { dietaryLabels } from "@/lib/content/types";
import { PageHeader } from "@/components/site/page-header";

export const metadata: Metadata = { title: "Menu", description: "Explore Sanbay Fusion food and non-alcoholic drinks for Standard Meals, prepaid packages and member orders.", alternates: { canonical: "/menu" } };
export const revalidate = 60;

export default async function MenuPage() {
  const menu = await getMenu();
  return <div className="pb-28"><PageHeader eyebrow="From the kitchen" title={menu.title} lead={menu.intro} /><div className="mx-auto max-w-5xl px-5 sm:px-8"><MembershipEligibilityNotice />
    {menu.priceNote && <p className="border-y border-border/60 py-5 text-sm leading-7 text-muted-foreground">{menu.priceNote}</p>}
    <div className="mt-12 grid gap-8 md:grid-cols-2">{menu.sections.map(section => <section key={section.name} className="border border-border/60 p-6 sm:p-8"><h2 className="font-display text-3xl">{section.name}</h2><ul className="mt-5 divide-y divide-border/50">{section.items.map(item => <li key={item.name} className="py-4"><h3 className="text-lg">{item.name}</h3>{item.description && <p className="mt-2 text-sm leading-7 text-foreground/75">{item.description}</p>}{item.dietary?.length ? <p className="mt-2 text-xs text-gold">{item.dietary.map(tag => dietaryLabels[tag]).join(" · ")}</p> : null}</li>)}</ul></section>)}</div>
    {menu.winePairing && <section className="mt-10 border border-border/60 p-7"><h2 className="font-display text-3xl">{menu.winePairing.title}</h2><p className="mt-4 text-sm leading-7">{menu.winePairing.description}</p></section>}
    <section className="mt-12 border border-gold/40 bg-gold/5 p-7"><h2 className="font-display text-3xl">Choose through your membership</h2><p className="mt-4 text-sm leading-7 text-foreground/75">The included Standard Meal allowance applies to eligible food in one order per selected service month. Any excess is paid separately; drinks and other products are separate orders. Share allergies with the team and obtain confirmation before ordering. A menu listing does not guarantee availability.</p><div className="mt-6 flex flex-wrap gap-6"><Link href="/catalogue" className="text-gold underline">View catalogue and prices</Link><Link href="/dashboard" className="text-gold underline">Member ordering</Link><Link href="/events" className="text-gold underline">Private-event enquiries</Link></div></section>
  </div></div>;
}
