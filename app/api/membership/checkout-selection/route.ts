import { NextResponse } from "next/server";
import { saveMembershipCheckoutSelection } from "@/lib/membership-checkout";
import { membershipConfigurationSchema, validateMembershipConfiguration } from "@/lib/membership-request";
import { getCurrentAccount } from "@/lib/auth";
import { accountHasOngoingMembership } from "@/lib/membership-access";

export async function POST(request: Request) {
  try {
    const origin = request.headers.get("origin");
    if (origin && origin !== new URL(request.url).origin) return NextResponse.json({ error: "Invalid origin." }, { status: 403 });
    if (await accountHasOngoingMembership(await getCurrentAccount())) return NextResponse.json({ code: "ACTIVE_MEMBERSHIP", error: "Your membership is already active or scheduled. View your Customer Dashboard." }, { status: 409 });
    const body = await request.json();
    const planSlug = typeof body?.planSlug === "string" ? body.planSlug : "";
    if (!planSlug) return NextResponse.json({ error: "A membership plan is required." }, { status: 400 });
    const parsed = membershipConfigurationSchema.safeParse(body?.configuration);
    if (!parsed.success || parsed.data.planSlug !== planSlug) {
      return NextResponse.json({ error: "Your membership selection is invalid. Please review your package." }, { status: 400 });
    }
    const checked = validateMembershipConfiguration(parsed.data);
    if (!checked.ok) return NextResponse.json({ error: checked.error }, { status: 400 });
    await saveMembershipCheckoutSelection(planSlug, checked.configuration);
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Unable to save your selected membership." }, { status: 400 });
  }
}
