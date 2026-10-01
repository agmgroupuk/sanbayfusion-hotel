/** Membership dates are Bangkok calendar dates; expiry is exclusive at midnight. */
export function membershipDate(now = new Date()) {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Bangkok", year: "numeric", month: "2-digit", day: "2-digit" }).format(now);
}

export function membershipTerm(activatedAt: Date, durationMonths: number) {
  if (!Number.isInteger(durationMonths) || durationMonths < 1 || durationMonths > 12) throw new Error("Invalid membership duration");
  const startDate = membershipDate(activatedAt);
  const [year, month, day] = startDate.split("-").map(Number);
  const lastDay = new Date(Date.UTC(year, month - 1 + durationMonths + 1, 0)).getUTCDate();
  const expiryDate = new Date(Date.UTC(year, month - 1 + durationMonths, Math.min(day, lastDay))).toISOString().slice(0, 10);
  return { startDate, expiryDate };
}

type Term = { status: string; membershipExpiryDate: string | null };
export function membershipHasExpired(term: Term, now = new Date()) {
  return term.membershipExpiryDate !== null && membershipDate(now) >= term.membershipExpiryDate;
}
export function hasActiveMembership(term: Term | null | undefined, now = new Date()) {
  return !!term && term.status === "active" && !!term.membershipExpiryDate && !membershipHasExpired(term, now);
}
export function membershipDaysRemaining(expiryDate: string | null, now = new Date()) {
  if (!expiryDate) return 0;
  return Math.max(0, Math.ceil((new Date(`${expiryDate}T00:00:00+07:00`).getTime() - now.getTime()) / 86400000));
}
