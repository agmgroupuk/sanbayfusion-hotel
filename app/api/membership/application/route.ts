import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentAccount } from "@/lib/auth";
import { readMembershipCheckoutSelection } from "@/lib/membership-checkout";
import { ApplicationError, prepareApplication, submitApplication, checkApplicationSetup, changeApplicationPaymentMethod, getRecoveryPayment, chargeApprovedApplication, getApplicationForAccount } from "@/lib/membership-application";

export async function POST(request: Request) {
  const account = await getCurrentAccount();
  if (!account) return NextResponse.json({ error: "Please sign in to continue." }, { status: 401 });
  const origin = request.headers.get("origin");
  if (origin && origin !== new URL(request.url).origin) return NextResponse.json({ error: "Invalid origin." }, { status: 403 });
  try {
    const body = await request.json();
    if (body.action === "prepare") {
      const selection = await readMembershipCheckoutSelection();
      const draft = z.string().uuid().safeParse(body.applicationId).success ? await getApplicationForAccount(body.applicationId, account.id) : null;
      const configuration = selection?.configuration ?? draft?.configuration;
      if (!configuration) throw new ApplicationError("Choose your membership configuration again.");
      return NextResponse.json(await prepareApplication(account, configuration, body.details));
    }
    if (!z.string().uuid().safeParse(body.applicationId).success) throw new ApplicationError("Invalid application reference.");
    switch (body.action) {
      case "submit": return NextResponse.json(await submitApplication(account, body));
      case "setup-status": return NextResponse.json(await checkApplicationSetup(body.applicationId, account.id));
      case "change-method": return NextResponse.json(await changeApplicationPaymentMethod(body.applicationId, account.id));
      case "payment-status": return NextResponse.json(await getRecoveryPayment(body.applicationId, account.id));
      case "retry":
        await chargeApprovedApplication(body.applicationId, true, account.id);
        return NextResponse.json(await getRecoveryPayment(body.applicationId, account.id));
      default: throw new ApplicationError("Unknown application action.");
    }
  } catch (error) {
    return NextResponse.json({ error: error instanceof ApplicationError ? error.message : "Unable to complete this step. Please retry or contact the team." }, { status: error instanceof ApplicationError ? error.status : 500 });
  }
}
