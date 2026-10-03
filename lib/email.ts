import nodemailer from "nodemailer";

export function isEmailConfigured(): boolean {
  return Boolean(
    process.env.SMTP_HOST &&
      process.env.SMTP_USER &&
      process.env.SMTP_PASSWORD &&
      process.env.SMTP_FROM &&
      process.env.APP_BASE_URL,
  );
}

export async function sendPasswordResetEmail(
  recipient: string,
  resetUrl: string,
): Promise<void> {
  const host = process.env.SMTP_HOST;
  const user = process.env.SMTP_USER;
  const password = process.env.SMTP_PASSWORD;
  const from = process.env.SMTP_FROM;
  const port = Number(process.env.SMTP_PORT || 587);

  if (
    !host ||
    !user ||
    !password ||
    !from ||
    !Number.isInteger(port) ||
    port < 1 ||
    port > 65535
  ) {
    throw new Error("SMTP is not configured");
  }

  const transporter = nodemailer.createTransport({
    host,
    port,
    secure: process.env.SMTP_SECURE === "true",
    auth: { user, pass: password },
  });

  await transporter.sendMail({
    from,
    to: recipient,
    subject: "Reset your Sanbay Fusion password",
    text: `Use this link to reset your password. It expires in 30 minutes:\n\n${resetUrl}`,
  });
}
