import { activeMembershipForAccount } from "@/lib/membership-access";
import { hasActiveMembership } from "@/lib/membership-term";
import { createAdditionalOrder } from "@/lib/additional-order";
import { AccountError } from "@/lib/account/types";
import { NextResponse } from "next/server";
import { getCurrentAccount } from "@/lib/auth";
import { db } from "@/lib/db";
import { stripe } from "@/lib/stripe";
import { createStandardMealOrder } from "@/lib/standard-meal-order";
import { ApplicationError } from "@/lib/membership-errors";
import { hasValidRequestOrigin, originRejection } from "@/lib/request-origin";


export async function POST(request: Request) {
  const account = await getCurrentAccount();
  if (!account) return NextResponse.json({ error: "Please sign in to order." }, { status: 401 });
  if (!hasValidRequestOrigin(request)) return NextResponse.json(originRejection, { status: 403 });
  if (!db || !stripe) return NextResponse.json({ error: "Payment services are not configured." }, { status: 503 });
  const body = await request.json().catch(() => null) as { cart?: unknown; notes?: string; standardMeal?: unknown; expectedTotal?: number } | null;
  if (body?.standardMeal) {
    try { return NextResponse.json(await createStandardMealOrder(account, body.standardMeal, body.cart, typeof body.notes === "string" ? body.notes : undefined, body.expectedTotal)); }
    catch (error) { return NextResponse.json({ error: error instanceof ApplicationError ? error.message : "Unable to prepare your meal order. Your saved order can be retried." }, { status: error instanceof ApplicationError ? error.status : 500 }); }
  }
  const membership = await activeMembershipForAccount(account);
  if (!membership || !hasActiveMembership(membership)) return NextResponse.json({ error: "An active membership is required to place an order." }, { status: 403 });
  try { return NextResponse.json(await createAdditionalOrder(account, membership.id, body)); }
  catch (error) { return NextResponse.json({ error: error instanceof ApplicationError || error instanceof AccountError ? error.message : "Unable to prepare your order. Retry this checkout attempt." }, { status: error instanceof ApplicationError || error instanceof AccountError ? error.status : 500 }); }
}
