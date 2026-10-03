"use client";
import { useEffect, useSyncExternalStore } from "react";
import { usePathname } from "next/navigation";
import { paymentUrl } from "@/lib/platform-hosts";
export function MembershipReturn() {
  const pathname = usePathname();
  const returning = useSyncExternalStore(subscribe, () => sessionStorage.getItem("sbf-account-return") === "membership", () => false);
  useEffect(() => {
    if (new URLSearchParams(window.location.search).get("returnTo") === "membership") sessionStorage.setItem("sbf-account-return", "membership");
    window.dispatchEvent(new Event("sbf-account-return"));
  }, [pathname]);
  if (!returning) return null;
  return <div className="mb-7 flex flex-wrap items-center justify-between gap-4 rounded-sm border border-gold/40 bg-gold/5 p-5"><div><p className="text-sm text-gold">Your membership selection is saved</p><p className="mt-2 text-sm text-muted-foreground">Complete your account, then return to review your months and cart.</p></div><a href={paymentUrl("/membership/checkout")} className="rounded-full bg-gold px-5 py-3 text-sm text-gold-foreground">Return to membership review</a></div>;
}
function subscribe(listener: () => void) { window.addEventListener("sbf-account-return", listener); return () => window.removeEventListener("sbf-account-return", listener); }
