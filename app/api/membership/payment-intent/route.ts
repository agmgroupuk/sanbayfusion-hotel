import { NextResponse } from "next/server";
// Immediate membership charges are retired. Historical payment webhooks remain supported.
export async function POST() {
  return NextResponse.json({ error: "Membership applications now save a payment method and charge only after admin approval. Continue at /membership/checkout." }, { status: 410 });
}
