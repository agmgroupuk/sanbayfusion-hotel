"use client";
import { serviceMonthLabel } from "@/lib/membership-service-months";
import { standardMealDateBounds, standardMealTimes, standardMealTimeLabel, type StandardMealSlot } from "@/lib/standard-meal";

export function StandardMealSchedule({ months, slots, allowance, today, onChange }: { months: string[]; slots: StandardMealSlot[]; allowance: number; today: string; onChange: (slots: StandardMealSlot[]) => void }) {
  function change(month: string, patch: Partial<StandardMealSlot>) {
    const updated = { serviceMonth: month, deliveryDate: null, deliveryTime: null, ...slots.find(slot => slot.serviceMonth === month), ...patch };
    onChange([...slots.filter(slot => slot.serviceMonth !== month), updated]);
  }
  return <section aria-labelledby="standard-meal-schedule-title" className="space-y-5">
    <h2 id="standard-meal-schedule-title" className="text-eyebrow leading-relaxed text-gold">Schedule your included Standard Meals</h2>
    <p className="text-sm leading-7 text-muted-foreground">Scheduling now is optional. Choose any, all or none of your dates. You can schedule available meals later in your membership dashboard. Allow at least three days; the team confirms availability.</p>
    {!months.length && <p className="text-sm text-muted-foreground">Select your service months to see their optional delivery slots.</p>}
    <div className="grid gap-4 sm:grid-cols-2">{[...months].sort().map(month => {
      const slot = slots.find(item => item.serviceMonth === month);
      const bounds = standardMealDateBounds(month, new Date(today));
      return <fieldset key={month} className="min-w-0 space-y-4 rounded-sm border border-border/60 p-4">
        <legend className="px-1 text-sm font-medium">{serviceMonthLabel(month)}</legend>
        <p className="text-sm">Standard Meal allowance: up to ฿{allowance.toLocaleString("en-US")}</p>
        <label className="block text-sm">Delivery date<input aria-label={`${serviceMonthLabel(month)} delivery date`} type="date" min={bounds.min} max={bounds.max} value={slot?.deliveryDate ?? ""} onChange={e => change(month, { deliveryDate: e.target.value || null })} className="mt-2 block w-full min-w-0 rounded-sm border border-input bg-background p-3" /></label>
        <label className="block text-sm">Delivery time<select aria-label={`${serviceMonthLabel(month)} delivery time`} value={slot?.deliveryTime ?? ""} onChange={e => change(month, { deliveryTime: e.target.value || null })} className="mt-2 block w-full rounded-sm border border-input bg-background p-3"><option value="">Select time</option>{standardMealTimes.map(time => <option key={time} value={time}>{standardMealTimeLabel(time)}</option>)}</select></label>
        {!slot?.deliveryDate && !slot?.deliveryTime && <p className="text-xs text-muted-foreground">NOT SCHEDULED YET</p>}
        <button type="button" onClick={() => change(month, { deliveryDate: null, deliveryTime: null })} className="text-sm text-gold underline">Schedule later</button>
      </fieldset>;
    })}</div>
  </section>;
}

export function StandardMealScheduleSummary({ slots }: { slots: StandardMealSlot[] }) {
  return <ul className="space-y-2 text-xs text-muted-foreground">{slots.map(slot => <li key={slot.serviceMonth}>{serviceMonthLabel(slot.serviceMonth)} — {slot.deliveryDate && slot.deliveryTime ? `${slot.deliveryDate} · ${standardMealTimeLabel(slot.deliveryTime)}` : "NOT SCHEDULED YET · Schedule later"}</li>)}</ul>;
}
