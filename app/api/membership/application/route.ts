import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentAccount } from "@/lib/auth";
import { readMembershipCheckoutSelection } from "@/lib/membership-checkout";
import { ApplicationError, getRecoveryPayment, chargeApprovedApplication, getApplicationForAccount } from "@/lib/membership-application";
import { prepareInvoiceApplication, submitInvoiceApplication, invoiceRecovery } from "@/lib/membership-invoice";
import { hasValidRequestOrigin, originRejection } from "@/lib/request-origin";

export async function POST(request: Request) {
  const account = await getCurrentAccount();
  if (!account) return NextResponse.json({ error: "Please sign in to continue." }, { status: 401 });
  if (!hasValidRequestOrigin(request)) return NextResponse.json(originRejection, { status: 403 });
  try {
    const body = await request.json();
    if (body.action === "prepare") {
      const selection = await readMembershipCheckoutSelection();
      const draft = z.string().uuid().safeParse(body.applicationId).success ? await getApplicationForAccount(body.applicationId, account.id) : null;
      const configuration = selection?.configuration ?? draft?.configuration;
      if (!configuration) throw new ApplicationError("Choose your membership configuration again.");
      return NextResponse.json(await prepareInvoiceApplication(account, configuration));
    }
    if (!z.string().uuid().safeParse(body.applicationId).success) throw new ApplicationError("Invalid application reference.");
    switch (body.action) {
      case "submit": return NextResponse.json(await submitInvoiceApplication(account, body));
      case "setup-status":
      case "change-method": throw new ApplicationError("Manage and verify payment methods from Dashboard → Payment Methods.", 410);
      case "payment-status": {
        const row = await getApplicationForAccount(body.applicationId, account.id);
        if (row.applicationState && row.stripeInvoiceId) return NextResponse.json(await invoiceRecovery(row.id, account.id));
        return NextResponse.json(await getRecoveryPayment(body.applicationId, account.id));
      }
      case "retry":
        if ((await getApplicationForAccount(body.applicationId, account.id)).applicationState) throw new ApplicationError("Contact the team to retry your existing approved invoice. No new membership payment will be created.", 409);
        await chargeApprovedApplication(body.applicationId, true, account.id);
        return NextResponse.json(await getRecoveryPayment(body.applicationId, account.id));
      default: throw new ApplicationError("Unknown application action.");
    }
  } catch (error) {
    return NextResponse.json({ error: error instanceof ApplicationError ? error.message : "Unable to complete this step. Please retry or contact the team." }, { status: error instanceof ApplicationError ? error.status : 500 });
  }
}
