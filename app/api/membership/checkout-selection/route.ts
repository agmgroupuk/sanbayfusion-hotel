import { NextResponse } from "next/server";
import { saveMembershipCheckoutSelection } from "@/lib/membership-checkout";
import { validateMembershipConfiguration } from "@/lib/membership-request";
import { getCurrentAccount } from "@/lib/auth";
import { membershipPlanStatus } from "@/lib/membership-access";
import { membershipPlanBlockMessage } from "@/lib/membership-plan-state";
import { hasValidRequestOrigin, originRejection } from "@/lib/request-origin";
import { membershipApplicationPath, membershipSignInPath } from "@/lib/auth-redirect";

export async function POST(request: Request) {
  try {
    const account = await getCurrentAccount();
    if (!hasValidRequestOrigin(request)) return NextResponse.json(originRejection, { status: 403 });
    const body = await request.json();
    const planSlug = typeof body?.planSlug === "string" ? body.planSlug : "";
    if (!planSlug) return NextResponse.json({ error: "A membership plan is required." }, { status: 400 });
    const checked = validateMembershipConfiguration(body?.configuration);
    if (!checked.ok || checked.configuration.planSlug !== planSlug) {
      return NextResponse.json({ error: "Your membership selection is invalid. Please review your package." }, { status: 400 });
    }
    const planStatus = account ? await membershipPlanStatus(account, checked.plan.id) : null;
    if (planStatus) {
      return NextResponse.json({ code: "PLAN_ALREADY_REQUESTED", planStatus, error: membershipPlanBlockMessage(planStatus) }, { status: 409 });
    }
    await saveMembershipCheckoutSelection(planSlug, checked.configuration);
    // This endpoint saves only the cart. Application creation requires an authenticated session.
    return NextResponse.json({ ok: true, next: account ? membershipApplicationPath : membershipSignInPath }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return NextResponse.json({ error: "Unable to save your selected membership." }, { status: 400 });
  }
}
