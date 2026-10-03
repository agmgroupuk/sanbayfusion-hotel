export const dynamic = "force-dynamic";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { PageHeader } from "@/components/site/page-header";
import { MembershipCheckoutForm } from "@/components/membership/membership-checkout-form";
import { getCurrentAccount } from "@/lib/auth";
import { membershipPlans } from "@/lib/membership-plans";
import { readMembershipCheckoutSelection } from "@/lib/membership-checkout";
import { validateMembershipConfiguration } from "@/lib/membership-request";
import { getApplicationForAccount } from "@/lib/membership-application";
import { membershipPlanStatus } from "@/lib/membership-access";

export const metadata: Metadata = {
  title: "Membership Application",
  description: "Membership application for eligible foreign visitors to Thailand. Eligibility confirmation and review are required before approved payment.",
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
  if (await membershipPlanStatus(account, checked.plan.id)) redirect(`/plans/${checked.plan.slug}`);
  const plan = membershipPlans.find(item => item.id === checked.plan.id)!;

  return (
    <>
      <PageHeader
        eyebrow="Membership application"
        title="Apply for your membership"
        lead="Confirm that you meet international-visitor eligibility and review your Account Center details and selections. Submission does not guarantee approval or collect the membership fee."
      />
      <MembershipCheckoutForm
        plan={plan}
        purchaseSnapshot={checked.purchaseSnapshot}
        applicationId={draft?.id}
      />
    </>
  );
}
