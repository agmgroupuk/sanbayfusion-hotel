import { resend, FROM_EMAIL, STAFF_EMAIL } from "./client";
import type { ContactEmailData } from "./templates/contact-message";
import { renderManagedEmail } from "./managed-templates";

/**
 * Best-effort delivery of a contact enquiry to staff. No-ops when Resend isn't
 * configured; returns whether the message was actually sent.
 */
export async function sendContactEmail(data: ContactEmailData) {
  if (!resend || !STAFF_EMAIL) return { sent: false as const };

  const result = await resend.emails.send({
    from: FROM_EMAIL,
    to: STAFF_EMAIL,
    replyTo: data.email,
    ...renderManagedEmail("sanbay-contact-staff", { CUSTOMER_NAME: data.name, CUSTOMER_EMAIL: data.email, CUSTOMER_PHONE: data.phone || "Not supplied", MESSAGE: data.message }),
    subject: `New enquiry · ${data.name}`,
  });
  if (result.error) throw new Error("Enquiry notification delivery failed");

  return { sent: true as const };
}
