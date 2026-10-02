import "server-only";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { emailOutbox, membershipRequests, type MembershipRequest } from "@/lib/db/schema";
import type { ApplicationSnapshot } from "@/lib/membership-application-types";
export async function sendApplicationNotifications(row: MembershipRequest) {
  if (!db || row.notificationSentAt || row.applicationState !== "pending_review") return;
  const snapshot = row.applicationSnapshot as ApplicationSnapshot;
  const values = {
    REQUEST_NUMBER: row.requestNumber, CUSTOMER_NAME: snapshot.customer.fullName,
    CUSTOMER_EMAIL: snapshot.customer.email, CUSTOMER_PHONE: snapshot.customer.phone || "Not supplied",
    PLAN_NAME: row.planName, SERVICE_MONTHS: snapshot.purchase.selectedServiceMonths?.join(", ") || "See saved application",
    PURCHASE_MODE: snapshot.purchase.purchaseMode === "membership_only" ? "Membership only" : "Membership + prepaid package",
    TOTAL_AMOUNT: `THB ${row.estimatedTotal.toLocaleString("en-US")}`,
  };
  // Same keys as the transactional trigger: submission retries recover without duplicate mail.
  await db.transaction(async tx => {
    await tx.insert(emailOutbox).values([
      { eventKey: `membership:${row.id}:staff`, template: "sanbay-membership-review", recipient: "__staff__", variables: values },
      { eventKey: `membership:${row.id}:received`, template: "sanbay-membership-received", recipient: snapshot.customer.email, variables: values },
    ]).onConflictDoNothing();
    await tx.update(membershipRequests).set({ notificationSentAt: new Date() }).where(eq(membershipRequests.id, row.id));
  });
}
