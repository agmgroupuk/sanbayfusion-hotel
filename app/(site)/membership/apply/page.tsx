import type { Metadata } from "next";
import { PageHeader } from "@/components/site/page-header";
import { ApplicationForm } from "@/components/membership/application-form";

export const metadata: Metadata = {
  title: "Complete Your Membership Request",
  description: "Submit your Sanbay Fusion annual membership request for team review.",
  alternates: { canonical: "/membership/apply" },
};

export default function MembershipApplyPage() {
  return (
    <div className="pb-28">
      <PageHeader eyebrow="Membership request" title="Complete Your Membership Request" lead="You're almost there. Please provide your contact and delivery details so our team can review your membership request." />
      <div className="mx-auto max-w-4xl px-5 sm:px-8"><ApplicationForm /></div>
    </div>
  );
}
