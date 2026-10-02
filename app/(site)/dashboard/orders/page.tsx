import Link from "next/link";
import { redirect } from "next/navigation";
import { desc, eq, inArray } from "drizzle-orm";
import { getCurrentAccount } from "@/lib/auth";
import { db } from "@/lib/db";
import { customerOrders, customerOrderItems } from "@/lib/db/schema";
import type { AdditionalOrderSnapshot } from "@/lib/additional-order";

export default async function OrdersPage() {
  const account = await getCurrentAccount();
  if (!account) redirect("/signin?next=/dashboard/orders");
  if (!db) return <p>Order history is temporarily unavailable.</p>;
  const orders = await db.select().from(customerOrders).where(eq(customerOrders.accountId,account.id)).orderBy(desc(customerOrders.createdAt)).limit(100);
  const items = orders.length ? await db.select().from(customerOrderItems).where(inArray(customerOrderItems.orderId,orders.map(order=>order.id))) : [];
  return <section className="space-y-6"><h2 className="font-display text-3xl">Your orders & deliveries</h2><Link href="/dashboard/order" className="text-gold underline">Place your order</Link>{!orders.length && <p>No orders yet.</p>}{orders.map(order=>{
    const delivery = order.deliveryDetails as Partial<AdditionalOrderSnapshot>;
    const review = order.paymentStatus === "paid" && order.status === "pending_payment";
    return <article key={order.id} className="space-y-3 rounded border border-border p-5"><h3>{order.orderNumber}</h3><p className="text-sm">{delivery.kind === "additional_order" ? "Additional order" : "Member meal order"} · {review ? "Payment received — awaiting delivery eligibility review" : `${order.status.replaceAll("_"," ")} · Payment ${order.paymentStatus}`}</p>{items.filter(item=>item.orderId===order.id).map(item=><p className="text-sm" key={item.id}>{item.productName} · {item.quantity} × ฿{item.unitPrice.toLocaleString("en-US")} = ฿{item.lineTotal.toLocaleString("en-US")}</p>)}<p className="text-gold">Total ฿{order.total.toLocaleString("en-US")}</p>{delivery.deliveryDate && <p>Delivery: {delivery.deliveryDate} · {delivery.deliveryTime} (Thailand)</p>}{delivery.address && <p className="text-sm">{[delivery.address.name,delivery.address.line1,delivery.address.district,delivery.address.province,delivery.address.postalCode].filter(Boolean).join(", ")}</p>}{order.paymentStatus!=="paid" && order.status==="pending_payment" && <Link className="text-gold underline" href={`/dashboard/checkout?order=${order.id}`}>Resume checkout</Link>}</article>;
  })}</section>;
}
