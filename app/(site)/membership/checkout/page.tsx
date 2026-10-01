export const dynamic = "force-dynamic";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { PageHeader } from "@/components/site/page-header";
import { MembershipCheckoutForm } from "@/components/membership/membership-checkout-form";
import { getCurrentAccount } from "@/lib/auth";
import { membershipPlans } from "@/lib/membership-plans";
import { readMembershipCheckoutSelection } from "@/lib/membership-checkout";
import { stripePublishableKey } from "@/lib/stripe";
import { validateMembershipConfiguration } from "@/lib/membership-request";
import { getApplicationForAccount } from "@/lib/membership-application";
import type { ApplicationDetails } from "@/lib/membership-application-types";
import type { MembershipPurchaseSnapshot } from "@/lib/membership-request";

export const metadata: Metadata = {
  title: "Membership Application",
  description: "Apply for membership. Your authorized charge is processed only after approval.",
  robots: { index: false, follow: false },
};

export default async function MembershipCheckoutPage({ searchParams }: { searchParams: Promise<{ application?: string }> }) {
  const { application } = await searchParams;
  const account = await getCurrentAccount();
  if (!account) redirect(`/signin?next=${encodeURIComponent(`/membership/checkout${application ? `?application=${application}` : ""}`)}`);

  const draft = application && /^[0-9a-f-]{36}$/i.test(application) ? await getApplicationForAccount(application, account.id).catch(() => null) : null;
  if (draft && draft.status !== "application_draft") redirect(`/membership/request-received?id=${draft.id}`);
  const selection = await readMembershipCheckoutSelection();
  const configuration = draft?.configuration ?? selection?.configuration;
  if (!configuration) redirect("/plans");
  const checked = validateMembershipConfiguration(configuration);
  if (!checked.ok) redirect("/plans");
  const plan = membershipPlans.find(item => item.id === checked.plan.id)!;
  const address = draft?.address as { billing: ApplicationDetails["billingAddress"]; delivery: ApplicationDetails["deliveryAddress"] } | undefined;

  return (
    <>
      <PageHeader
        eyebrow="Membership application"
        title="Apply for your membership"
        lead="Save your payment method securely and submit for review. No membership charge is made until your application is approved."
      />
      <MembershipCheckoutForm
        plan={plan}
        account={{ fullName: account.fullName ?? "", email: account.email, phone: account.phone ?? "" }}
        purchaseSnapshot={checked.purchaseSnapshot}
        publishableKey={stripePublishableKey}
        resume={draft && address ? { applicationId: draft.id, details: { customer: { fullName: draft.fullName, phone: draft.phone }, billingAddress: address.billing, deliveryAddress: address.delivery }, purchaseSnapshot: draft.purchaseSnapshot as MembershipPurchaseSnapshot } : undefined}
      />
    </>
  );
}
