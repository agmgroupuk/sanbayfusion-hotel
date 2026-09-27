import "server-only";

import { normalizeEmail } from "@/lib/auth";

const authorizedEmails = new Set(
  (process.env.MEMBERSHIP_ADMIN_EMAILS ?? "")
    .split(",")
    .map(normalizeEmail)
    .filter(Boolean),
);

export function isMembershipAdmin(email: string) {
  return authorizedEmails.has(normalizeEmail(email));
}
