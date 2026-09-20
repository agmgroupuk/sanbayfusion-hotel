import { resend, FROM_EMAIL, STAFF_EMAIL } from "./client";
import {
  GuestConfirmationEmail,
  type ReservationEmailData,
} from "./templates/guest-confirmation";
import { StaffNotificationEmail } from "./templates/staff-notification";

/** Best-effort send of guest confirmation + staff notification. No-ops if Resend isn't configured. */
export async function sendReservationEmails(data: ReservationEmailData) {
  if (!resend) return { sent: false as const };

  await resend.emails.send({
    from: FROM_EMAIL,
    to: data.email,
    subject: `Your table at Sanbay Fusion — ${data.dateLong}`,
    react: GuestConfirmationEmail(data),
  });

  if (STAFF_EMAIL) {
    await resend.emails.send({
      from: FROM_EMAIL,
      to: STAFF_EMAIL,
      subject: `New booking · ${data.name} · ${data.dateLong} ${data.timeSlot}`,
      react: StaffNotificationEmail(data),
    });
  }

  return { sent: true as const };
}
