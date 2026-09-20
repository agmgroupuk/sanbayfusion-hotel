import { resend, FROM_EMAIL, STAFF_EMAIL } from "./client";
import { MembershipRequestEmail, type MembershipRequestEmailData } from "./templates/membership-request";

export async function sendMembershipRequestEmails(data: MembershipRequestEmailData) {
  if (!resend) return { sent: false as const };
  await resend.emails.send({ from: FROM_EMAIL, to: data.email, subject: "We Received Your Sanbay Fusion Membership Request", react: MembershipRequestEmail(data) });
  if (STAFF_EMAIL) await resend.emails.send({ from: FROM_EMAIL, to: STAFF_EMAIL, subject: `NEW MEMBERSHIP REQUEST · ${data.requestNumber}`, react: MembershipRequestEmail(data) });
  return { sent: true as const };
}
