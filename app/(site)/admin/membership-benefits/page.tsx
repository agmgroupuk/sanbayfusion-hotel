import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { getCurrentAccount } from "@/lib/auth";
import { isMembershipAdmin } from "@/lib/membership-admin";
import { pendingMemberBenefits, fulfillMemberBenefit } from "@/lib/membership-benefits";
import { ApplicationError } from "@/lib/membership-errors";
import { AdminApprovalForm } from "@/components/membership/admin-approval-form";

export const dynamic = "force-dynamic";
export default async function MembershipBenefitsPage() {
  const account = await getCurrentAccount();
  if (!account) redirect("/signin?next=%2Fadmin%2Fmembership-benefits");
  if (!isMembershipAdmin(account.email)) redirect("/dashboard");
  const pending = await pendingMemberBenefits(account);
  return <div className="mx-auto max-w-5xl space-y-6 px-5 py-32"><h1 className="font-display text-4xl">Complimentary meal requests</h1><p className="text-sm text-muted-foreground">Coordinate the eligible included menu and service date with the member. Mark fulfilled only after service. These benefits are included in membership fees and never create an extra charge.</p>{!pending.length && <p>No complimentary meals awaiting fulfillment.</p>}{pending.map(({ redemption, name, reference }) => {
    async function fulfill() {
      "use server";
      const current = await getCurrentAccount();
      if (!current) return "Administrator access required.";
      try { await fulfillMemberBenefit(current, redemption.id); revalidatePath("/admin/membership-benefits"); revalidatePath("/dashboard/membership"); return "Benefit marked fulfilled. No charge was made."; }
      catch (error) { return error instanceof ApplicationError ? error.message : "Unable to fulfill this benefit."; }
    }
    return <article key={redemption.id} className="space-y-4 border border-gold/40 p-6"><h2 className="text-2xl">{name} · {reference}</h2><p>{redemption.mealName} · Menu value up to ฿{redemption.menuValue.toLocaleString("en-US")}</p><p className="text-sm">Service month: {redemption.serviceMonth} · Requested date: {redemption.scheduledDate}</p><AdminApprovalForm approve={fulfill} legacy approveLabel="Mark benefit fulfilled" /></article>;
  })}</div>;
}
