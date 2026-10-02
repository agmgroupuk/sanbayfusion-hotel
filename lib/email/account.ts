import { resend, ACCOUNT_FROM_EMAIL } from "./client";
import { renderManagedEmail } from "./managed-templates";
import { inlineEmailLogo } from "./logo";

export async function sendPasswordResetEmail(email: string, resetUrl: string) {
  if (!resend) return { sent: false as const };
  const message = renderManagedEmail("sanbay-password-reset", { SECURE_URL: resetUrl });
  const result = await resend.emails.send({
    from: ACCOUNT_FROM_EMAIL,
    to: email,
    ...message, ...inlineEmailLogo(message.html),
  });
  if (result.error) throw new Error("Password reset email delivery failed");
  return { sent: true as const };
}
