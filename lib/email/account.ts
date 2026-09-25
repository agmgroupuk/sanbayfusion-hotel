import { resend, FROM_EMAIL } from "./client";

export async function sendPasswordResetEmail(email: string, resetUrl: string) {
  if (!resend) return { sent: false as const };
  await resend.emails.send({
    from: FROM_EMAIL,
    to: email,
    subject: "Reset your Sanbay Fusion password",
    text: `Use this link to reset your Sanbay Fusion password. It expires in one hour and can only be used once: ${resetUrl}`,
  });
  return { sent: true as const };
}