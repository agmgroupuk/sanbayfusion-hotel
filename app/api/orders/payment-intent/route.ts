import { NextResponse } from "next/server";
import { desc, eq } from "drizzle-orm";
import { getCurrentAccount } from "@/lib/auth";
import { db } from "@/lib/db";
import { customerOrderItems, customerOrders, membershipRequests } from "@/lib/db/schema";
import { priceCart } from "@/lib/order";
import { stripe } from "@/lib/stripe";

function orderNumber() { return `SBF-O-${Date.now().toString().slice(-8)}`; }

export async function POST(request: Request) {
  const account = await getCurrentAccount();
  if (!account) return NextResponse.json({ error: "Please sign in to order." }, { status: 401 });
  if (!db || !stripe) return NextResponse.json({ error: "Payment services are not configured." }, { status: 503 });
  const body = await request.json().catch(() => null) as { cart?: unknown; notes?: string } | null;
  const priced = priceCart(body?.cart);
  if (!priced.ok) return NextResponse.json({ error: priced.error }, { status: 400 });
  const membership = (await db.select().from(membershipRequests).where(eq(membershipRequests.email, account.email)).orderBy(desc(membershipRequests.createdAt)).limit(1))[0];
  if (!membership || membership.status !== "active") return NextResponse.json({ error: "An active membership is required to place an order." }, { status: 403 });
  const number = orderNumber();
  const [order] = await db.insert(customerOrders).values({ orderNumber: number, accountId: account.id, membershipRequestId: membership.id, subtotal: priced.subtotal, total: priced.total, notes: typeof body?.notes === "string" ? body.notes.slice(0, 2000) : null, deliveryDetails: membership.address, }).returning();
  await db.insert(customerOrderItems).values(priced.items.map((item) => ({ orderId: order.id, productName: item.name, categoryName: item.category, unitPrice: item.price, quantity: item.quantity, lineTotal: item.lineTotal })));
  const intent = await stripe.paymentIntents.create({ amount: priced.total * 100, currency: "thb", automatic_payment_methods: { enabled: true }, metadata: { orderId: order.id, orderNumber: order.orderNumber, accountId: account.id } });
  await db.update(customerOrders).set({ stripePaymentIntentId: intent.id }).where(eq(customerOrders.id, order.id));
  return NextResponse.json({ clientSecret: intent.client_secret, orderNumber: order.orderNumber, total: priced.total });
}