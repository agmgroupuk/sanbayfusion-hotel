import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { PageHeader } from "@/components/site/page-header";
import { MembershipCheckoutForm } from "@/components/membership/membership-checkout-form";
import { getCurrentAccount } from "@/lib/auth";
import { membershipPlans } from "@/lib/membership-plans";
import { readMembershipCheckoutSelection } from "@/lib/membership-checkout";

export const metadata: Metadata = {
  title: "Membership Checkout",
  description: "Complete your Sanbay Fusion membership payment securely.",
  robots: { index: false, follow: false },
};

export default async function MembershipCheckoutPage() {
  const account = await getCurrentAccount();
  if (!account) redirect(`/signin?next=${encodeURIComponent("/membership/checkout")}`);

  const selection = await readMembershipCheckoutSelection();
  if (!selection) redirect("/plans");

  const plan = membershipPlans.find((item) => item.slug === selection.planSlug);
  if (!plan) redirect("/plans");

  return (
    <>
      <PageHeader
        eyebrow="Membership checkout"
        title="Complete your membership"
        lead="Choose your plan, confirm your configuration, and complete the secure Sanbay Fusion membership payment."
      />
      <MembershipCheckoutForm
        plan={plan}
        account={{ fullName: account.fullName, email: account.email, phone: account.phone }}
        configuration={selection.configuration ?? {}}
      />
    </>
  );
}
