import { NextResponse } from "next/server";
import { getCurrentAccount } from "@/lib/auth";
import { redeemMemberBenefit } from "@/lib/membership-benefits";
import { ApplicationError } from "@/lib/membership-errors";
import { hasValidRequestOrigin, originRejection } from "@/lib/request-origin";

export async function POST(request: Request) {
  const account = await getCurrentAccount();
  if (!account) return NextResponse.json({ error: "Please sign in to view your benefits." }, { status: 401 });
  if (!hasValidRequestOrigin(request)) return NextResponse.json(originRejection, { status: 403 });
  try { return NextResponse.json(await redeemMemberBenefit(account, await request.json())); }
  catch (error) { return NextResponse.json({ error: error instanceof ApplicationError ? error.message : "Unable to request this benefit. Please try again." }, { status: error instanceof ApplicationError ? error.status : 500 }); }
}
