import { format } from "date-fns";

/** "2026-07-04" → "Saturday 4 July 2026" (local, no tz drift). */
export function formatDateLong(dateKey: string): string {
  const [y, m, d] = dateKey.split("-").map(Number);
  return format(new Date(y, m - 1, d), "EEEE d MMMM yyyy");
}
