import { bangkokDate, serviceMonthBounds, validateServiceMonths } from "@/lib/membership-service-months";

/** Legacy agreements retain their original consecutive calendar term. */
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

type Term = { status: string; membershipExpiryDate: string | null; selectedServiceMonths?: string[] | null; purchaseSnapshot?: unknown; invoiceStatus?: string | null; durationMonths?: number };
export function hasSelectedMonthAgreement(term: Term) {
  return term.selectedServiceMonths != null || (term.purchaseSnapshot as { version?: number } | null)?.version === 4;
}
function validMonths(term: Term): term is Term & { selectedServiceMonths: string[] } {
  return Array.isArray(term.selectedServiceMonths) && !validateServiceMonths(term.selectedServiceMonths, term.durationMonths ?? term.selectedServiceMonths.length);
}
export function membershipHasExpired(term: Term, now = new Date()) {
  if (hasSelectedMonthAgreement(term)) return validMonths(term) && bangkokDate(now) >= serviceMonthBounds(term.selectedServiceMonths).expiryDate;
  return term.membershipExpiryDate !== null && membershipDate(now) >= term.membershipExpiryDate;
}
/** An ongoing paid agreement blocks repurchase even between service months. */
export function hasOngoingMembership(term: Term | null | undefined, now = new Date()) {
  return !!term && ["active", "cancellation_requested"].includes(term.status) && !membershipHasExpired(term, now);
}
export function hasActiveMembership(term: Term | null | undefined, now = new Date()) {
  if (term && hasSelectedMonthAgreement(term)) return term.status === "active" && term.invoiceStatus === "paid" && validMonths(term) && term.selectedServiceMonths.includes(bangkokDate(now).slice(0, 7));
  return !!term && term.status === "active" && !!term.membershipExpiryDate && !membershipHasExpired(term, now);
}
export function membershipDisplayStatus(term: Term, now = new Date()) {
  if (hasOngoingMembership(term, now)) return hasActiveMembership(term, now) ? "ACTIVE" : term.status === "cancellation_requested" ? "CANCELLATION REQUESTED" : "SCHEDULED";
  return (membershipHasExpired(term, now) ? "expired" : term.status).replaceAll("_", " ").toUpperCase();
}
export function membershipDaysRemaining(expiryDate: string | null, now = new Date()) {
  if (!expiryDate) return 0;
  return Math.max(0, Math.ceil((new Date(`${expiryDate}T00:00:00+07:00`).getTime() - now.getTime()) / 86400000));
}
