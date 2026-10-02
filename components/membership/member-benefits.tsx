"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { serviceMonthLabel, bangkokDate } from "@/lib/membership-service-months";
import { standardMealDateBounds, standardMealTimes, standardMealTimeLabel, standardMealStatus } from "@/lib/standard-meal";

type Redemption = { serviceMonth: string; status: string; scheduledDate: string | null; scheduledTime: string | null; menuValue: number; orderId: string | null };
export function MemberBenefits({ membershipId, months, active, redemptions, today }: { membershipId: string; months: string[]; active: boolean; redemptions: Redemption[]; today: string }) {
  const router = useRouter();
  const [dates, setDates] = useState<Record<string, string>>({});
  const [times, setTimes] = useState<Record<string, string>>({});
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const now = new Date(today);
  async function schedule(serviceMonth: string, scheduledDate: string, scheduledTime: string) {
    setBusy(true); setMessage("");
    try {
      const response = await fetch("/api/membership/benefits", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ membershipId, serviceMonth, scheduledDate, scheduledTime }) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error);
      setMessage("Delivery preference saved. The team will confirm availability. Your meal allowance remains unused until you place its order.");
      router.refresh();
    } catch (error) { setMessage(error instanceof Error ? error.message : "Unable to schedule your meal."); }
    finally { setBusy(false); }
  }
  return <section className="space-y-4"><h3 className="text-eyebrow leading-relaxed text-gold">Service months & included Standard Meals</h3><p className="text-sm text-muted-foreground">Schedule now or later with at least three days of advance notice. Place one eligible food order during each selected month; only the excess above its allowance is payable. Additional orders are paid separately. Unused value does not roll over or convert to cash.</p>
    <ul className="grid gap-3 sm:grid-cols-2">{months.map(month => {
      const row = redemptions.find(item => item.serviceMonth === month);
      const status = row ? standardMealStatus(row, now) : month < bangkokDate(now).slice(0, 7) ? "EXPIRED" : "AWAITING ACTIVATION";
      const bounds = standardMealDateBounds(month, now);
      const canSchedule = active && row && ["AVAILABLE", "SCHEDULED"].includes(status) && !row.orderId && bounds.min <= bounds.max;
      const date = dates[month] ?? row?.scheduledDate ?? "", time = times[month] ?? row?.scheduledTime ?? "";
      const canOrder = active && status === "SCHEDULED" && row?.scheduledTime && month === bangkokDate(now).slice(0, 7);
      return <li key={month} className="min-w-0 space-y-3 rounded-sm border border-border/60 p-4"><p className="flex flex-wrap justify-between gap-2 text-sm"><strong>{serviceMonthLabel(month)}</strong><span className="text-gold">{status}</span></p>
        {row && <p className="text-sm">Standard Meal allowance: up to ฿{row.menuValue.toLocaleString("en-US")}</p>}
        <p className="text-xs text-muted-foreground">{row?.scheduledDate ? `${row.scheduledDate}${row.scheduledTime ? ` · ${standardMealTimeLabel(row.scheduledTime)}` : " · Choose delivery time"}` : "NOT SCHEDULED YET"}</p>
        {canSchedule && <div className="space-y-3"><label className="block text-sm">Delivery date<input type="date" min={bounds.min} max={bounds.max} value={date} onChange={event => setDates({ ...dates, [month]: event.target.value })} className="mt-2 block w-full min-w-0 rounded-sm border border-input bg-background p-2" /></label><label className="block text-sm">Delivery time<select value={time} onChange={event => setTimes({ ...times, [month]: event.target.value })} className="mt-2 block w-full rounded-sm border border-input bg-background p-2"><option value="">Select time</option>{standardMealTimes.map(value => <option key={value} value={value}>{standardMealTimeLabel(value)}</option>)}</select></label><button type="button" disabled={busy || !date || !time} onClick={() => schedule(month, date, time)} className="w-full rounded-full bg-gold px-4 py-3 text-sm text-gold-foreground disabled:opacity-40">Save meal schedule</button></div>}
        {canOrder && <Link href={`/dashboard/order?standardMeal=${month}&membership=${membershipId}`} className="block text-sm text-gold underline">Choose your Standard Meal</Link>}
        {status === "RESERVED" && row?.orderId && <Link href={`/dashboard/checkout?order=${row.orderId}`} className="block text-sm text-gold underline">Resume saved meal order</Link>}
        {status === "REDEEMED" && <p className="text-xs text-muted-foreground">Included meal used. Additional orders are paid separately.</p>}
      </li>;
    })}</ul>{message && <p role="status" className="border border-gold/40 p-4 text-sm">{message}</p>}
  </section>;
}
