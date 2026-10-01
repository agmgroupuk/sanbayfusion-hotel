import "server-only";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { membershipRequests, type MembershipRequest } from "@/lib/db/schema";
import { resend, FROM_EMAIL, STAFF_EMAIL } from "./client";
import type { ApplicationSnapshot } from "@/lib/membership-application-types";
export async function sendApplicationNotifications(row: MembershipRequest) {
  if (!resend || !db || row.notificationSentAt || row.applicationState !== "pending_review") return;
  const snapshot = row.applicationSnapshot as ApplicationSnapshot;
  const text = `Application: ${row.requestNumber}\nCustomer: ${snapshot.customer.fullName}\nEmail: ${snapshot.customer.email}\nPhone: ${snapshot.customer.phone}\nPlan: ${row.planName}\nSelected service months: ${snapshot.purchase.selectedServiceMonths?.join(", ")}\nPurchase type: ${snapshot.purchase.purchaseMode === "membership_only" ? "Membership only" : "Membership + prepaid package"}\nApplication total: THB ${row.estimatedTotal.toLocaleString("en-US")}\nStatus: PENDING REVIEW\nMembership amount has not been charged. Membership is not active.\n`;
  // Stable provider idempotency keys prevent duplicate messages on HTTP/webhook retries.
  if (STAFF_EMAIL) {
    const result = await resend.emails.send({ from: FROM_EMAIL, to: STAFF_EMAIL, subject: `Membership review: ${row.requestNumber}`, text: `${text}\nReview in Sanbay Fusion admin before collecting Stripe draft invoice ${row.stripeInvoiceId}.` }, { idempotencyKey: `membership-admin-${row.id}` });
    if (result.error) throw new Error("Team notification delivery failed; retry submission safely.");
  }
  const result = await resend.emails.send({ from: FROM_EMAIL, to: snapshot.customer.email, subject: `Membership request received: ${row.requestNumber}`, text: `${text}\nOur team will review your information and may contact you before approval. Track your application in your Sanbay Fusion Dashboard.` }, { idempotencyKey: `membership-customer-${row.id}` });
  if (result.error) throw new Error("Confirmation delivery failed; retry submission safely.");
  await db.update(membershipRequests).set({ notificationSentAt: new Date() }).where(eq(membershipRequests.id, row.id));
}
