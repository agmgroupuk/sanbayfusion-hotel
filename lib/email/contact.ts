import { resend, FROM_EMAIL, STAFF_EMAIL } from "./client";
import {
  ContactMessageEmail,
  type ContactEmailData,
} from "./templates/contact-message";

/**
 * Best-effort delivery of a contact enquiry to staff. No-ops when Resend isn't
 * configured; returns whether the message was actually sent.
 */
export async function sendContactEmail(data: ContactEmailData) {
  if (!resend || !STAFF_EMAIL) return { sent: false as const };

  await resend.emails.send({
    from: FROM_EMAIL,
    to: STAFF_EMAIL,
    replyTo: data.email,
    subject: `New enquiry · ${data.name}`,
    react: ContactMessageEmail(data),
  });

  return { sent: true as const };
}
