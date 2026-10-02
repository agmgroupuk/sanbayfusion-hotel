import { createHash } from "node:crypto";
import { db } from "@/lib/db";
import { emailOutbox } from "@/lib/db/schema";
import { renderManagedEmail } from "./managed-templates";

/** Persist both sides of an enquiry atomically; retries within five minutes are deduplicated. */
export async function queueContact(data: { name: string; email: string; phone?: string; message: string }) {
  if (!db || !process.env.RESEND_API_KEY) return { sent: false as const };
  const values = { CUSTOMER_NAME: data.name, CUSTOMER_EMAIL: data.email, CUSTOMER_PHONE: data.phone || "Not supplied", MESSAGE: data.message };
  renderManagedEmail("sanbay-contact-staff", values);
  const key = createHash("sha256").update(JSON.stringify(values)).update(String(Math.floor(Date.now() / 300_000))).digest("hex");
  await db.insert(emailOutbox).values([
    { eventKey: `contact:${key}:staff`, template: "sanbay-contact-staff", recipient: "__staff__", variables: values, replyTo: data.email },
    { eventKey: `contact:${key}:received`, template: "sanbay-contact-received", recipient: data.email, variables: { CUSTOMER_NAME: data.name } },
  ]).onConflictDoNothing();
  return { sent: true as const, queued: true as const };
}
