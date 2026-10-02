import postgres from "postgres";
import { dispatchOne, type QueueDatabase, type OutgoingEmail } from "../lib/email/worker.js";
import { reminderSql } from "../lib/email/reminders.js";

if (!process.env.DATABASE_URL || !process.env.RESEND_API_KEY) throw new Error("Email worker requires Railway DATABASE_URL and RESEND_API_KEY");
const database = postgres(process.env.DATABASE_URL, { prepare: false, max: 2, connect_timeout: 15 });
const adapter: QueueDatabase = { async query<T>(text: string, parameters: unknown[] = []) {
  return { rows: await database.unsafe(text, parameters as never[]) as unknown as T[] };
} };
const send = async (message: OutgoingEmail, key: string) => {
  const response = await fetch("https://api.resend.com/emails", { method: "POST", headers: {
    Authorization: `Bearer ${process.env.RESEND_API_KEY}`, "Content-Type": "application/json", "Idempotency-Key": key,
  }, body: JSON.stringify(message), signal: AbortSignal.timeout(20_000) });
  if (!response.ok) throw new Error("Provider rejected notification");
  const data = await response.json() as { id?: string };
  if (!data.id) throw new Error("Provider did not acknowledge notification");
  return data.id;
};
let stopping = false;
process.on("SIGTERM", () => { stopping = true; });
process.on("SIGINT", () => { stopping = true; });
console.log("[email] transactional worker started");
let heartbeat = 0;
try {
  while (!stopping) {
    try {
      await database.unsafe(reminderSql).simple();
      for (let i = 0; i < 20 && !stopping; i++) {
        if (!await dispatchOne(adapter, send)) break;
        await new Promise(resolve => setTimeout(resolve, 750));
      }
      if (Date.now() - heartbeat > 3_600_000) {
        const counts = await database`SELECT status, count(*)::int AS count FROM email_outbox GROUP BY status`;
        console.log("[email] queue health", JSON.stringify(counts));
        heartbeat = Date.now();
      }
    } catch { console.error("[email] worker cycle failed; retrying in 15 seconds"); }
    for (let i = 0; i < 15 && !stopping; i++) await new Promise(resolve => setTimeout(resolve, 1000));
  }
} finally { await database.end({ timeout: 5 }); }
