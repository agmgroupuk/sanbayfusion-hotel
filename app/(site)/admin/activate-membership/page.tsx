import { redirect } from "next/navigation";
import { eq, or } from "drizzle-orm";
import { getCurrentAccount } from "@/lib/auth";
import { db } from "@/lib/db";
import { membershipRequests } from "@/lib/db/schema";
import { activateMembershipRequest } from "@/lib/membership-activation";

export default async function ActivateMembershipPage() {
  const account = await getCurrentAccount();
  if (!account) redirect("/signin");
  const eligible = account.email === "admin@sanbayfusion.com";
  if (!eligible) redirect("/dashboard");
  const pending = db ? await db.select().from(membershipRequests).where(or(eq(membershipRequests.status, "verified"), eq(membershipRequests.status, "payment_pending"))).limit(20) : [];
  return <div className="mx-auto max-w-5xl px-5 py-28"><h1 className="font-display text-5xl italic">Membership verification</h1><div className="mt-8 space-y-5">{pending.map((item) => <form key={item.id} action={async () => { "use server"; await activateMembershipRequest({ id: item.id, method: "MANUAL_ADMIN", actor: account.email }); }} className="rounded-sm border border-border/60 bg-card/30 p-6"><p className="text-eyebrow text-gold">{item.fullName}</p><div className="mt-4 grid gap-3 md:grid-cols-3 text-sm"><div><p className="text-muted-foreground">Plan</p><p>{item.planName}</p></div><div><p className="text-muted-foreground">Verification</p><p>{item.status}</p></div><div><p className="text-muted-foreground">Stripe Customer</p><p>{item.stripeCustomerId ?? "Not linked"}</p></div><div><p className="text-muted-foreground">Invoice</p><p>{item.invoiceNumber ?? "Not issued"}</p></div><div><p className="text-muted-foreground">Payment status</p><p>{item.invoiceStatus ?? "Not set"}</p></div><div><p className="text-muted-foreground">Membership fee</p><p>฿{(item.estimatedTotal ?? 0).toLocaleString("en-US")}</p></div></div><button className="mt-6 rounded-full bg-gold px-6 py-3 text-eyebrow text-gold-foreground">ACTIVATE MEMBERSHIP</button></form>)}</div></div>;
}
