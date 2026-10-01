import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { getCurrentAccount } from "@/lib/auth";
import { signOut } from "@/app/auth/actions";
import { MembershipReturn } from "@/components/account/membership-return";
import { AccountNavigation } from "@/components/account/account-navigation";
export const dynamic = "force-dynamic";
export const metadata = { title: "Your Account", robots: { index: false, follow: false }, referrer: "no-referrer" as const };
export default async function AccountLayout({ children }: { children: React.ReactNode }) {
 const account = await getCurrentAccount();
 if (!account) {
   const requested = (await headers()).get("x-account-destination") ?? "/dashboard";
   const destination = requested.startsWith("/dashboard") && !requested.includes("\\") ? requested : "/dashboard";
   redirect(`/signin?next=${encodeURIComponent(destination)}`);
 }
 return <div className="mx-auto max-w-7xl px-5 pb-24 pt-28 sm:px-8 sm:pt-36"><header className="flex flex-wrap items-end justify-between gap-5 border-b border-border/60 pb-8"><div><p className="text-eyebrow text-gold">Sanbay Fusion · Customer account</p><h1 className="mt-3 font-display text-4xl sm:text-5xl">Welcome, {account.displayName || account.fullName?.split(" ")[0] || "there"}</h1><p className="mt-3 break-all text-sm text-muted-foreground">{account.email}</p></div><form action={signOut}><button className="rounded-full border border-border px-5 py-3 text-eyebrow">Sign out</button></form></header><div className="mt-8 grid min-w-0 gap-8 lg:grid-cols-[220px_minmax(0,1fr)]"><aside className="min-w-0"><AccountNavigation /></aside><div className="min-w-0"><MembershipReturn />{children}</div></div></div>;
}
