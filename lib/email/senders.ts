export type EmailPurpose = "account" | "support" | "reservation";
export function emailSender(purpose: EmailPurpose) {
  const variable = `${purpose.toUpperCase()}_FROM_EMAIL`;
  return process.env[variable] || `Sanbay Fusion <${purpose}@sanbayfusion.com>`;
}

export function templatePurpose(alias: string): EmailPurpose {
  if (alias.startsWith("sanbay-meeting-")) return "reservation";
  if (["sanbay-welcome", "sanbay-password-reset", "sanbay-password-changed", "sanbay-email-verification", "sanbay-email-changed", "sanbay-security", "sanbay-account-notice"].includes(alias)) return "account";
  return "support";
}
