import { NextResponse } from "next/server";
import { saveMembershipCheckoutSelection } from "@/lib/membership-checkout";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const planSlug = typeof body?.planSlug === "string" ? body.planSlug : "";
    if (!planSlug) return NextResponse.json({ error: "A membership plan is required." }, { status: 400 });
    await saveMembershipCheckoutSelection(planSlug, body?.configuration ?? {});
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Unable to save your selected membership." }, { status: 400 });
  }
}
