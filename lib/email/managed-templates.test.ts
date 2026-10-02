import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderManagedEmail } from "./managed-templates";

const transport = vi.hoisted(() => ({ send: vi.fn() }));
vi.mock("./client", () => ({
  FROM_EMAIL: "Sanbay Fusion <account@sanbayfusion.com>", STAFF_EMAIL: "staff@example.invalid",
  ACCOUNT_FROM_EMAIL: "Sanbay Fusion <account@sanbayfusion.com>",
  RESERVATION_FROM_EMAIL: "Sanbay Fusion <reservation@sanbayfusion.com>",
  resend: { emails: { send: transport.send } },
}));
import { sendPasswordResetEmail } from "./account";
import { sendContactEmail } from "./contact";
import { sendReservationEmails } from "./reservation";

describe("transactional email safety and delivery results", () => {
  beforeEach(() => transport.send.mockReset().mockResolvedValue({ data: { id: "test-message" }, error: null }));

  it("escapes customer markup in HTML and preserves readable plain text", () => {
    const message = '<img src=x onerror="alert(1)"> & customer text';
    const mail = renderManagedEmail("sanbay-contact-staff", { CUSTOMER_NAME: "A & B", CUSTOMER_EMAIL: "test@example.invalid", CUSTOMER_PHONE: "Not supplied", MESSAGE: message });
    expect(mail.html).not.toContain(message);
    expect(mail.html).toContain("&lt;img");
    expect(mail.html).toContain("A &amp; B");
    expect(mail.text).toContain(message);
  });

  it("requires a security link and rejects script URLs or embedded credentials", () => {
    expect(() => renderManagedEmail("sanbay-password-reset", {})).toThrow("Missing email variable");
    expect(() => renderManagedEmail("sanbay-password-reset", { SECURE_URL: "javascript:alert(1)" })).toThrow("Invalid account email link");
    expect(() => renderManagedEmail("sanbay-password-reset", { SECURE_URL: "https://user:secret@sanbayfusion.com/reset-password" })).toThrow("Invalid account email link");
  });

  it("preserves reset tokens in plain text and escapes URL attributes in HTML", async () => {
    const url = "https://sanbayfusion.com/reset-password?token=sample&source=account";
    await sendPasswordResetEmail("test@example.invalid", url);
    const sent = transport.send.mock.calls[0][0];
    expect(sent.text).toContain(url);
    expect(sent.html).toContain("token=sample&amp;source=account");
    expect(sent.html).toContain("sanbayfusion-logo.png");
  });

  it("reports provider rejection instead of claiming password or enquiry email success", async () => {
    transport.send.mockResolvedValue({ data: null, error: { message: "Rejected" } });
    await expect(sendPasswordResetEmail("test@example.invalid", "https://sanbayfusion.com/reset-password?token=sample")).rejects.toThrow("delivery failed");
    await expect(sendContactEmail({ name: "Customer", email: "test@example.invalid", message: "Hello" })).rejects.toThrow("delivery failed");
  });

  it("acknowledges a meeting request without claiming a booking and reports staff delivery failure", async () => {
    transport.send.mockResolvedValueOnce({ data: { id: "guest-message" }, error: null }).mockResolvedValueOnce({ data: null, error: { message: "Rejected" } });
    await expect(sendReservationEmails({ name: "Customer", email: "test@example.invalid", phone: "123456789", partySize: 2, dateLong: "15 January 2027", timeSlot: "14:00" })).rejects.toThrow("staff notification delivery failed");
    expect(transport.send.mock.calls[0][0].subject).toContain("meeting request");
    expect(transport.send.mock.calls[0][0].text).toContain("not a confirmed booking");
    expect(transport.send.mock.calls[1][0].text).toContain("14:00 (Bangkok)");
  });
});
