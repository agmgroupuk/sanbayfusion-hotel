import "server-only";

import { z } from "zod";
import { catalogueCategories } from "@/lib/catalogue";

export const cartItemSchema = z.object({
  category: z.string().min(1).max(120),
  name: z.string().min(1).max(200),
  quantity: z.number().int().min(1).max(50),
});

export const cartSchema = z.array(cartItemSchema).min(1).max(100);

export function priceCart(raw: unknown) {
  const parsed = cartSchema.safeParse(raw);
  if (!parsed.success) return { ok: false as const, error: "Your cart is invalid. Please rebuild it and try again." };
  const items = parsed.data.map((item) => {
    const category = catalogueCategories.find((entry) => entry.name === item.category);
    const product = category?.products.find((entry) => entry.name === item.name);
    if (!category || !product) return null;
    return { ...item, price: product.price, lineTotal: product.price * item.quantity };
  });
  if (items.some((item) => item === null)) return { ok: false as const, error: "One or more products are no longer available." };
  const safeItems = items as Array<{ category: string; name: string; quantity: number; price: number; lineTotal: number }>;
  return { ok: true as const, items: safeItems, subtotal: safeItems.reduce((total, item) => total + item.lineTotal, 0), total: safeItems.reduce((total, item) => total + item.lineTotal, 0) };
}