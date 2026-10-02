import { resend, RESERVATION_FROM_EMAIL, STAFF_EMAIL } from "./client";
import type { ReservationEmailData } from "./templates/guest-confirmation";
import { renderManagedEmail } from "./managed-templates";

/** Best-effort send of guest confirmation + staff notification. No-ops if Resend isn't configured. */
export async function sendReservationEmails(data: ReservationEmailData) {
  if (!resend) return { sent: false as const };

  const values = {
    CUSTOMER_NAME: data.name, CUSTOMER_EMAIL: data.email, CUSTOMER_PHONE: data.phone || "Not supplied",
    REQUEST_NUMBER: data.reference || "See your meeting request", MEETING_DATE: data.dateLong,
    MEETING_TIME: `${data.timeSlot} (Bangkok)`, ATTENDEES: String(data.partySize),
    NOTES: [data.meetingPurpose, data.specialRequests].filter(Boolean).join("\n") || "Not supplied",
  };
  const guestResult = await resend.emails.send({
    from: RESERVATION_FROM_EMAIL,
    to: data.email,
    ...renderManagedEmail("sanbay-meeting-received", values),
  });
  if (guestResult.error) throw new Error("Meeting acknowledgement delivery failed");

  if (STAFF_EMAIL) {
    const staffResult = await resend.emails.send({
      from: RESERVATION_FROM_EMAIL,
      to: STAFF_EMAIL,
      ...renderManagedEmail("sanbay-meeting-staff", values),
    });
    if (staffResult.error) throw new Error("Meeting staff notification delivery failed");
  }

  return { sent: true as const };
}
