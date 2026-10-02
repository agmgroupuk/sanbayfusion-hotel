import { renderManagedEmail } from "./managed-templates";
import { emailSender, templatePurpose } from "./senders";
import { inlineEmailLogo } from "./logo";

export type QueueDatabase = { query<T>(text: string, parameters?: unknown[]): Promise<{ rows: T[] }> };
type QueueRow = { id: string; template: string; recipient: string; variables: Record<string, string>; reply_to: string | null; attempts: number };
export type OutgoingEmail = { from: string; to: string; subject: string; html: string; text: string; reply_to?: string; tags: { name: string; value: string }[]; attachments?: { filename: string; content: string; content_id: string; content_type: string }[] };
type Transport = (message: OutgoingEmail, idempotencyKey: string) => Promise<string>;

/** Claim with SKIP LOCKED for safe replica overlap. No transport exception or address enters logs. */
export async function dispatchOne(database: QueueDatabase, send: Transport) {
  // Resend retains idempotency keys for 24h. Stop ambiguous retries before that boundary.
  await database.query(`UPDATE email_outbox SET status = 'failed', last_error = 'retry_window_exhausted'
    WHERE status IN ('pending','sending') AND first_attempt_at < now() - interval '23 hours'`);
  await database.query(`UPDATE email_outbox SET status = 'pending', locked_at = NULL
    WHERE status = 'sending' AND locked_at < now() - interval '5 minutes'`);
  const { rows } = await database.query<QueueRow>(`WITH candidate AS (
    SELECT id FROM email_outbox WHERE status = 'pending' AND available_at <= now()
    ORDER BY created_at, id FOR UPDATE SKIP LOCKED LIMIT 1
  ) UPDATE email_outbox e SET status = 'sending', locked_at = now(), attempts = attempts + 1,
    first_attempt_at = coalesce(first_attempt_at, now()) FROM candidate WHERE e.id = candidate.id RETURNING e.*`);
  const row = rows[0];
  if (!row) return false;
  try {
    let message: OutgoingEmail;
    if (row.variables.__message) message = JSON.parse(row.variables.__message) as OutgoingEmail;
    else {
      const to = row.recipient === "__staff__" ? process.env.RESTAURANT_NOTIFY_EMAIL : row.recipient;
      if (!to) throw new Error("staff_mailbox_missing");
      message = { from: emailSender(templatePurpose(row.template)), to, ...renderManagedEmail(row.template, row.variables),
        ...(row.reply_to ? { reply_to: row.reply_to } : {}), tags: [{ name: "template", value: row.template }, { name: "outbox_id", value: row.id }] };
      const logo = inlineEmailLogo(message.html);
      message.html = logo.html;
      message.attachments = logo.attachments.map(({ contentId, contentType, ...attachment }) => ({ ...attachment, content_id: contentId, content_type: contentType }));
      // Freeze transport content before the first request: retries remain byte-for-byte identical across deploys.
      await database.query(`UPDATE email_outbox SET variables = variables || jsonb_build_object('__message', $2::text) WHERE id = $1`, [row.id, JSON.stringify(message)]);
    }
    const providerId = await send(message, `sbf-email-${row.id}`);
    await database.query(`UPDATE email_outbox SET status = 'sent', sent_at = now(), provider_id = $2, locked_at = NULL, last_error = NULL WHERE id = $1`, [row.id, providerId]);
  } catch {
    await database.query(`UPDATE email_outbox SET status = CASE WHEN attempts >= 10 THEN 'failed' ELSE 'pending' END,
      available_at = now() + least(3600, 30 * power(2, attempts)) * interval '1 second', locked_at = NULL, last_error = 'delivery_attempt_failed' WHERE id = $1`, [row.id]);
    console.error("[email] delivery attempt failed", { outboxId: row.id, template: row.template });
  }
  return true;
}
