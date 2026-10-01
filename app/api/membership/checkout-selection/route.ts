import { NextResponse } from "next/server";
import { saveMembershipCheckoutSelection } from "@/lib/membership-checkout";
import { membershipConfigurationSchema, validateMembershipConfiguration } from "@/lib/membership-request";
import { getCurrentAccount } from "@/lib/auth";
import { accountHasOngoingMembership } from "@/lib/membership-access";
import { hasValidRequestOrigin, originRejection } from "@/lib/request-origin";
import { membershipApplicationPath, membershipSignInPath } from "@/lib/auth-redirect";

export async function POST(request: Request) {
  try {
    const account = await getCurrentAccount();
    if (!hasValidRequestOrigin(request)) return NextResponse.json(originRejection, { status: 403 });
    if (account && await accountHasOngoingMembership(account)) return NextResponse.json({ code: "ACTIVE_MEMBERSHIP", error: "Your membership is already active or scheduled. View your Customer Dashboard." }, { status: 409 });
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
    // This endpoint saves only the cart. Application creation requires an authenticated session.
    return NextResponse.json({ ok: true, next: account ? membershipApplicationPath : membershipSignInPath }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return NextResponse.json({ error: "Unable to save your selected membership." }, { status: 400 });
  }
}
