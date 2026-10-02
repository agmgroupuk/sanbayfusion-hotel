import { MembershipEligibilityNotice } from "@/components/membership/eligibility-notice";
import { pageMetadata } from "@/lib/seo";
import Link from "next/link";
import { PageHeader } from "@/components/site/page-header";
import { PlanCard } from "@/components/membership/plan-card";
import { membershipPlans } from "@/lib/membership-plans";
import { getCurrentAccount } from "@/lib/auth";
import { accountHasOngoingMembership } from "@/lib/membership-access";
export const dynamic = "force-dynamic";
import { Reveal } from "@/components/motion/reveal";

// This alternate plan chooser consolidates its search signals into /plans.
export const metadata = pageMetadata("/plans");

export default async function JoinPage() { const activeMembership = await accountHasOngoingMembership(await getCurrentAccount()); return <div className="pb-28"><PageHeader eyebrow="Become a member" title="Your next delivery starts here" lead="For eligible foreign visitors normally living outside Thailand: choose your travel months and plan your food requirements. Applications require review and approval before membership payment is collected." /><div className="mx-auto max-w-7xl px-5 sm:px-8"><MembershipEligibilityNotice /><div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">{membershipPlans.map((plan) => <Reveal key={plan.slug} variant="up"><PlanCard plan={plan} activeMembership={activeMembership} /></Reveal>)}</div><Reveal variant="up" className="mx-auto mt-20 max-w-2xl border border-gold/40 bg-gold/5 p-8 text-center sm:p-12"><p className="text-eyebrow text-gold">Apply for membership</p><h2 className="mt-5 font-display text-3xl font-light italic">Apply first. Pay after approval.</h2><p className="mt-4 text-base leading-relaxed text-foreground/75">Choose a plan, save your payment method securely, and authorize the exact displayed amount. Submit without a membership charge. Approval makes the agreed invoice ready for staff collection; verified successful payment activates service in your selected calendar months.</p><div className="mt-8 flex flex-wrap justify-center gap-4"><Link href="/contact" className="inline-flex rounded-full bg-gold px-7 py-3 text-eyebrow text-gold-foreground">Request Membership</Link><Link href="/faq" className="inline-flex rounded-full border border-foreground/30 px-7 py-3 text-eyebrow">Read FAQ</Link></div></Reveal></div></div>; }
