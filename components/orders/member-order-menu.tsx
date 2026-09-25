"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { catalogueCategories, type CatalogueCategory } from "@/lib/catalogue";

type CartItem = { key: string; category: string; name: string; price: number; quantity: number };

const money = (value: number) => `฿${value.toLocaleString("en-US")}`;

export function MemberOrderMenu() {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [notes, setNotes] = useState("");
  const [openCategory, setOpenCategory] = useState(catalogueCategories[0]?.name ?? "");
  const subtotal = useMemo(() => cart.reduce((total, item) => total + item.price * item.quantity, 0), [cart]);
  const itemCount = cart.reduce((total, item) => total + item.quantity, 0);

  function add(category: CatalogueCategory, name: string, price: number) {
    const key = `${category.name}:${name}`;
    setCart((current) => {
      const existing = current.find((item) => item.key === key);
      if (existing) return current.map((item) => item.key === key ? { ...item, quantity: item.quantity + 1 } : item);
      return [...current, { key, category: category.name, name, price, quantity: 1 }];
    });
  }

  function adjust(key: string, change: number) {
    setCart((current) => current.flatMap((item) => item.key !== key ? [item] : item.quantity + change > 0 ? [{ ...item, quantity: item.quantity + change }] : []));
  }

  return <div className="mx-auto max-w-7xl px-5 pb-28 pt-28 sm:px-8 sm:pt-36"><div className="flex flex-wrap items-end justify-between gap-6 border-b border-border/60 pb-10"><div><p className="text-eyebrow text-gold">Member ordering</p><h1 className="mt-4 font-display text-5xl font-light italic sm:text-7xl">Build your order</h1><p className="mt-4 max-w-2xl text-base text-muted-foreground">Choose from the current Sanbay Fusion food and beverage catalogue. Your membership fee is not included in this order.</p></div><Link href="/dashboard" className="rounded-full border border-foreground/30 px-5 py-3 text-eyebrow hover:border-gold hover:text-gold">BACK TO DASHBOARD</Link></div><div className="mt-10 grid gap-10 lg:grid-cols-[minmax(0,1fr)_22rem]"><div className="space-y-3">{catalogueCategories.map((category) => <section key={category.name} className="overflow-hidden rounded-sm border border-border/60 bg-card/30"><button type="button" onClick={() => setOpenCategory(openCategory === category.name ? "" : category.name)} className="flex w-full items-center justify-between gap-4 px-5 py-5 text-left hover:text-gold"><span><span className="text-eyebrow text-gold">{category.group}</span><span className="mt-2 block font-display text-2xl font-light italic">{category.name}</span></span><span aria-hidden="true" className="text-gold">{openCategory === category.name ? "−" : "+"}</span></button>{openCategory === category.name && <div className="border-t border-border/50"><p className="px-5 py-4 text-sm text-muted-foreground">{category.description}</p><div className="divide-y divide-border/50">{category.products.map((product) => <div key={product.name} className="flex items-center justify-between gap-4 px-5 py-4 text-sm"><div className="min-w-0"><p className="truncate">{product.name}</p><p className="mt-1 text-gold">{money(product.price)}</p></div><button type="button" onClick={() => add(category, product.name, product.price)} className="shrink-0 rounded-full bg-gold px-4 py-2 text-eyebrow text-gold-foreground hover:bg-gold/85">ADD</button></div>)}</div></div>}</section>)}</div><aside className="h-fit rounded-sm border border-gold/50 bg-gold/5 p-6 lg:sticky lg:top-28"><p className="text-eyebrow text-gold">Cart</p><div className="mt-4 flex items-baseline justify-between gap-4"><h2 className="font-display text-3xl font-light italic">{itemCount} items</h2><p className="text-xl text-gold">{money(subtotal)}</p></div>{cart.length === 0 ? <p className="mt-6 text-sm text-muted-foreground">Your cart is empty.</p> : <div className="mt-6 space-y-4">{cart.map((item) => <div key={item.key} className="border-t border-gold/20 pt-4 text-sm"><div className="flex justify-between gap-3"><span>{item.name}</span><span>{money(item.price * item.quantity)}</span></div><div className="mt-3 flex items-center justify-between gap-3 text-xs text-muted-foreground"><div className="flex items-center gap-2"><button type="button" onClick={() => adjust(item.key, -1)} aria-label={`Decrease ${item.name}`} className="flex size-7 items-center justify-center rounded-full border border-gold/40 text-gold">−</button><span>{item.quantity}</span><button type="button" onClick={() => adjust(item.key, 1)} aria-label={`Increase ${item.name}`} className="flex size-7 items-center justify-center rounded-full border border-gold/40 text-gold">+</button></div><button type="button" onClick={() => setCart((current) => current.filter((entry) => entry.key !== item.key))} className="text-gold underline">REMOVE</button></div></div>)}</div>}<label className="mt-7 block text-sm"><span className="text-eyebrow text-gold">Order notes</span><textarea value={notes} onChange={(event) => setNotes(event.target.value)} maxLength={2000} rows={4} placeholder="Add any notes or special instructions..." className="mt-3 w-full rounded-sm border border-input bg-background px-3 py-3 text-sm outline-none focus-visible:border-ring" /></label>{cart.length > 0 && <Link href={{ pathname: "/dashboard/checkout", query: { cart: encodeURIComponent(JSON.stringify(cart.map(({ category, name, quantity }) => ({ category, name, quantity }))),), notes: encodeURIComponent(notes) } }} className="mt-7 inline-flex w-full items-center justify-center rounded-full bg-gold px-5 py-3 text-eyebrow text-gold-foreground hover:bg-gold/85">CONTINUE TO CHECKOUT</Link>}</aside></div></div>;
}