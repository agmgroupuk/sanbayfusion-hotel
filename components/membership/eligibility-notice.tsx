import Link from "next/link";
import { membershipEligibilityNotice } from "@/lib/membership-eligibility";

export function MembershipEligibilityNotice() {
  return <aside aria-label="Membership eligibility" className="mb-8 rounded-sm border border-gold/50 bg-gold/5 p-5 sm:p-7">
    <p className="text-eyebrow text-gold">Created for international visitors</p>
    <p className="mt-3 text-sm leading-7 text-foreground/85">{membershipEligibilityNotice}</p>
    <p className="mt-3 text-sm leading-7 text-muted-foreground">Plan before travelling or during your visit. Creating an account or submitting an application does not guarantee membership approval. <Link href="/faq#membership-eligibility" className="text-gold underline underline-offset-4">View eligibility details</Link>.</p>
  </aside>;
}
