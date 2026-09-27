import { NextResponse } from "next/server";
import { saveMembershipCheckoutSelection } from "@/lib/membership-checkout";
import { membershipConfigurationSchema, validateMembershipConfiguration } from "@/lib/membership-request";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const planSlug = typeof body?.planSlug === "string" ? body.planSlug : "";
    if (!planSlug) return NextResponse.json({ error: "A membership plan is required." }, { status: 400 });
    const parsed = membershipConfigurationSchema.safeParse(body?.configuration);
    if (!parsed.success || parsed.data.planSlug !== planSlug) {
      return NextResponse.json({ error: "Your membership selection is invalid. Please review your package." }, { status: 400 });
    }
    const checked = validateMembershipConfiguration(parsed.data);
    if (!checked.ok) return NextResponse.json({ error: checked.error }, { status: 400 });
    await saveMembershipCheckoutSelection(planSlug, parsed.data);
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Unable to save your selected membership." }, { status: 400 });
  }
}
