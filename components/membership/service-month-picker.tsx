"use client";

import { calendarMonths, isEligibleServiceMonth, serviceMonthLabel, serviceYears } from "@/lib/membership-service-months";

export function ServiceMonthPicker({ count, year, selected, onYear, onChange, today }: { count: number; year: number; selected: string[]; onYear: (year: number) => void; onChange: (months: string[]) => void; today: string }) {
  const now = new Date(today);
  return <section className="rounded-sm border border-gold/50 bg-gold/5 p-5 sm:p-7" aria-labelledby="service-month-title">
    <h2 id="service-month-title" className="text-eyebrow leading-relaxed text-gold">Select your membership months</h2>
    <div className="mt-5 flex flex-wrap items-center justify-between gap-4"><p className="font-display text-2xl">Select {count} {count === 1 ? "month" : "months"}</p><label className="text-sm">Service year <select aria-label="Service year" value={year} onChange={event => onYear(Number(event.target.value))} className="ml-3 rounded-sm border border-input bg-background px-3 py-2">{serviceYears(now).map(value => <option key={value} value={value}>{value}</option>)}</select></label></div>
    <p className="mt-4 text-sm text-muted-foreground">Choose any {count} eligible {count === 1 ? "month" : "months"} in {year}. Months do not have to be consecutive. Allow at least three days for advance scheduling; months with no eligible dates left are unavailable.</p>
    <div className="mt-6 grid grid-cols-3 gap-3 sm:grid-cols-4">{calendarMonths(year).map(month => {
      const chosen = selected.includes(month);
      const eligible = isEligibleServiceMonth(month, now);
      return <button key={month} type="button" aria-label={serviceMonthLabel(month)} aria-pressed={chosen} disabled={!chosen && (!eligible || selected.length >= count)} onClick={() => onChange(chosen ? selected.filter(value => value !== month) : [...selected, month].sort())} className={`rounded-sm border px-2 py-3 text-center transition-colors disabled:cursor-not-allowed disabled:opacity-35 ${chosen ? "border-gold bg-gold text-gold-foreground" : "border-border bg-background hover:border-gold"}`}><span className="block text-sm uppercase">{serviceMonthLabel(month, true).split(" ")[0]}</span><span className="mt-1 block text-xs">{year}{!eligible && " · Unavailable"}</span></button>;
    })}</div>
    <div aria-live="polite" className="mt-6"><p className="text-eyebrow leading-relaxed text-gold">{selected.length} of {count} months selected</p><p className="mt-3 text-sm">Selected membership months: {selected.length ? selected.map(month => serviceMonthLabel(month)).join(" · ") : "None selected"}</p></div>
    <p className="mt-4 text-xs text-muted-foreground">Review your months before submitting. They become fixed on final submission, and benefits apply only in those months. Changing the year clears your selection.</p>
  </section>;
}
