"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { earliestServiceDate, serviceMonthLabel, serviceMonthState } from "@/lib/membership-service-months";

type Redemption = { serviceMonth: string; status: string; scheduledDate: string };
export function MemberBenefits({ membershipId, months, active, redemptions, today }: { membershipId: string; months: string[]; active: boolean; redemptions: Redemption[]; today: string }) {
  const router = useRouter();
  const [dates, setDates] = useState<Record<string, string>>({});
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const now = new Date(today);
  async function redeem(serviceMonth: string) {
    setBusy(true); setMessage("");
    try {
      const response = await fetch("/api/membership/benefits", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ membershipId, serviceMonth, scheduledDate: dates[serviceMonth] }) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error);
      setMessage("Your complimentary meal request is recorded at no additional charge. The team will confirm the eligible menu and service arrangements.");
      router.refresh();
    } catch (error) { setMessage(error instanceof Error ? error.message : "Unable to request your meal."); }
    finally { setBusy(false); }
  }
  return <section className="space-y-4"><h3 className="text-eyebrow leading-relaxed text-gold">Service months & included benefits</h3><p className="text-sm text-muted-foreground">One complimentary meal per selected month. Request it during that month with at least three days of advance notice. A request reserves that month&apos;s benefit; the team confirms menu and availability.</p>
    <ul className="grid gap-3 sm:grid-cols-2">{months.map(month => {
      const state = serviceMonthState(month, now);
      const redeemed = redemptions.find(row => row.serviceMonth === month);
      const minimum = earliestServiceDate(now);
      const canRedeem = active && state === "CURRENT" && !redeemed && minimum.slice(0, 7) === month;
      const [year, number] = month.split("-").map(Number);
      const last = new Date(Date.UTC(year, number, 0)).toISOString().slice(0, 10);
      return <li key={month} className="space-y-3 rounded-sm border border-border/60 p-4"><p className="flex flex-wrap justify-between gap-2 text-sm"><strong>{serviceMonthLabel(month)}</strong><span className="text-gold">{state}</span></p><p className="text-xs text-muted-foreground">{redeemed ? `${redeemed.status === "fulfilled" ? "Redeemed" : "Requested · awaiting confirmation"} · ${redeemed.scheduledDate} · Included, no charge` : state === "COMPLETED" ? "Unused benefit expired · no rollover" : state === "UPCOMING" ? "Benefit available during this month after activation" : canRedeem ? "One complimentary benefit available" : "Benefit unavailable: approval, payment or scheduling eligibility required"}</p>{canRedeem && <div className="space-y-3"><label className="block text-sm">Preferred service date<input type="date" min={minimum} max={last} value={dates[month] ?? ""} onChange={event => setDates({ ...dates, [month]: event.target.value })} className="mt-2 block w-full min-w-0 rounded-sm border border-input bg-background p-2" /></label><button type="button" disabled={busy || !dates[month]} onClick={() => redeem(month)} className="w-full rounded-full bg-gold px-4 py-3 text-sm text-gold-foreground disabled:opacity-40">Request complimentary meal</button></div>}</li>;
    })}</ul>{message && <p role="status" className="border border-gold/40 p-4 text-sm">{message}</p>}
  </section>;
}
