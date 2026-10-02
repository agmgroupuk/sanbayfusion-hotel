import postgres from "postgres";
import { emailSender } from "../lib/email/senders.js";

if (!process.env.DATABASE_URL) throw new Error("Database unavailable");
const database = postgres(process.env.DATABASE_URL, { prepare: false, max: 1 });
try {
  const senders = Object.fromEntries((["account", "support", "reservation"] as const).map(purpose => [purpose, emailSender(purpose)]));
  for (const [purpose, sender] of Object.entries(senders)) if (sender !== `Sanbay Fusion <${purpose}@sanbayfusion.com>`) throw new Error("Sender configuration mismatch");
  if (!process.env.RESEND_API_KEY || process.env.EMAIL_WORKER_ENABLED !== "true") throw new Error("Production email configuration missing");
  const triggers = await database`SELECT tgname FROM pg_trigger WHERE tgname LIKE 'sbf_email_%' AND NOT tgisinternal`;
  if (triggers.length !== 8) throw new Error("Transactional event triggers are missing");
  if (process.env.RUN_RESEND_SMOKE === "true") {
    // User-authorized test mailbox only. Creates no account, membership, order or payment.
    await database`INSERT INTO email_outbox (event_key,template,recipient,variables)
      VALUES ('deployment-smoke:20261002:v1','sanbay-account-notice','info@sanbayfusion.com',
        '{"UPDATE_MESSAGE":"TEST EMAIL: The production Sanbay Fusion transactional queue is working. This test did not change an account, membership, order or payment."}')
      ON CONFLICT (event_key) DO NOTHING`;
  }
  const queue = await database`SELECT status,count(*)::int AS count FROM email_outbox GROUP BY status`;
  const smoke = await database`SELECT id,status,provider_id,attempts FROM email_outbox WHERE event_key='deployment-smoke:20261002:v1'`;
  console.log(JSON.stringify({ senders, workerEnabled: true, triggerCount: triggers.length, queue, smoke }));
} finally { await database.end({ timeout: 5 }); }
