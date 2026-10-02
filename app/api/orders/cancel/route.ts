import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { getCurrentAccount } from "@/lib/auth";
import { db } from "@/lib/db";
import { customerOrders } from "@/lib/db/schema";
import { stripe } from "@/lib/stripe";
import { hasValidRequestOrigin, originRejection } from "@/lib/request-origin";

export async function POST(request: Request) {
  const account = await getCurrentAccount();
  if (!account) return NextResponse.json({error:"Please sign in."},{status:401});
  if (!hasValidRequestOrigin(request)) return NextResponse.json(originRejection,{status:403});
  if (!db || !stripe) return NextResponse.json({error:"Ordering is unavailable."},{status:503});
  const body = await request.json().catch(()=>null);
  if (typeof body?.orderNumber !== "string") return NextResponse.json({error:"An order reference is required."},{status:400});
  const [order] = await db.select().from(customerOrders).where(and(eq(customerOrders.accountId,account.id),eq(customerOrders.orderNumber,body.orderNumber))).limit(1);
  if (!order || (order.deliveryDetails as {kind?:string}).kind !== "additional_order") return NextResponse.json({error:"Order not found."},{status:404});
  if (order.paymentStatus === "paid" || !order.stripePaymentIntentId) return NextResponse.json({error:"This order cannot be cancelled here. Check order history or contact support."},{status:409});
  try {
    const intent = await stripe.paymentIntents.retrieve(order.stripePaymentIntentId);
    if (intent.livemode || intent.status === "succeeded" || intent.status === "processing") return NextResponse.json({error:"Payment is complete or processing. Check order history."},{status:409});
    if (intent.status !== "canceled") await stripe.paymentIntents.cancel(intent.id,{}, {idempotencyKey:`cancel-additional-${order.id}`});
    await db.update(customerOrders).set({status:"cancelled",paymentStatus:"failed"}).where(and(eq(customerOrders.id,order.id),eq(customerOrders.status,"pending_payment")));
    return NextResponse.json({ok:true});
  } catch { return NextResponse.json({error:"Unable to cancel this payment. Check order history before retrying."},{status:409}); }
}
