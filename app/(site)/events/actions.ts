"use server";

import { eventBriefSchema, formatEventBrief } from "@/lib/events";
import { queueContact } from "@/lib/email/outbox";
export async function requestEventProposal(raw: unknown): Promise<{ ok: true } | { ok: false; error: string }> {
  const parsed = eventBriefSchema.safeParse(raw);
  if (!parsed.success) return { ok: false, error: "Please check your event date, guest count, location and contact details, then try again." };
  try {
    const brief = parsed.data;
    const result = await queueContact({ name: brief.name, email: brief.email, phone: brief.phone, message: formatEventBrief(brief) });
    if (!result.sent) return { ok: false, error: "Online enquiries are temporarily unavailable. Your brief is still here; please contact our events team directly." };
    return { ok: true };
  } catch {
    return { ok: false, error: "We couldn't send your event brief. Your details are still here. Please try again or contact the events team." };
  }
}
