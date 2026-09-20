"use server";

import { contactSchema } from "@/lib/validations/contact";
import { sendContactEmail } from "@/lib/email/contact";

export type ContactResult =
  | { ok: true; message: string; demo?: boolean }
  | { ok: false; error: string };

export async function sendContactMessageAction(
  raw: unknown,
): Promise<ContactResult> {
  const parsed = contactSchema.safeParse(raw);
  if (!parsed.success) {
    const first = parsed.error.issues[0]?.message ?? "Please check your details";
    return { ok: false, error: first };
  }
  const data = parsed.data;

  let sent = false;
  try {
    const result = await sendContactEmail({
      name: data.name,
      email: data.email,
      phone: data.phone || undefined,
      message: data.message,
    });
    sent = result.sent;
  } catch (err) {
    console.error("[contact] email failed", err);
    return {
      ok: false,
      error: "We couldn't send your message. Please try again or call us.",
    };
  }

  return {
    ok: true,
    // Nothing left our system when email isn't configured — be honest about it.
    demo: !sent,
    message: `Thank you, ${data.name}. Your message has reached us — we'll be in touch shortly.`,
  };
}
