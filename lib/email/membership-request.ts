import { resend, FROM_EMAIL, STAFF_EMAIL } from "./client";
import { MembershipRequestEmail, type MembershipRequestEmailData } from "./templates/membership-request";
import { MembershipPaymentReviewEmail, type MembershipPaymentReviewEmailData } from "./templates/membership-payment-review";

export async function sendMembershipRequestEmails(data: MembershipRequestEmailData) {
  if (!resend) return { sent: false as const };
  await resend.emails.send({ from: FROM_EMAIL, to: data.email, subject: "We Received Your Sanbay Fusion Membership Request", react: MembershipRequestEmail(data) });
  if (STAFF_EMAIL) await resend.emails.send({ from: FROM_EMAIL, to: STAFF_EMAIL, subject: `NEW MEMBERSHIP REQUEST · ${data.requestNumber}`, react: MembershipRequestEmail(data) });
  return { sent: true as const };
}

export async function sendMembershipPaymentReviewEmail(data: MembershipPaymentReviewEmailData) {
  if (!resend || !STAFF_EMAIL) return { sent: false as const };
  await resend.emails.send({ from: FROM_EMAIL, to: STAFF_EMAIL, subject: `PAID MEMBERSHIP AWAITING REVIEW · ${data.requestNumber}`, react: MembershipPaymentReviewEmail(data) });
  return { sent: true as const };
}
