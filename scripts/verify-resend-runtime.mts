import { resend, ACCOUNT_FROM_EMAIL as FROM_EMAIL } from "../lib/email/client.js";
import { renderManagedEmail } from "../lib/email/managed-templates.js";

if (process.env.RUN_RESEND_SMOKE !== "true") throw new Error("Set RUN_RESEND_SMOKE=true to send the provider simulation.");
if (!resend) throw new Error("Resend runtime key is not configured");
if (!/\baccount@sanbayfusion\.com>?$/.test(FROM_EMAIL)) throw new Error("Unexpected runtime sender; inspect configuration before testing.");

// Fixed provider simulation address. No command-line recipient or customer data.
const result = await resend.emails.send({
  from: FROM_EMAIL, to: "delivered+sanbay-runtime@resend.dev",
  ...renderManagedEmail("sanbay-membership-received", {
    CUSTOMER_NAME: "Runtime Test", REQUEST_NUMBER: "SBF-SMOKE-ONLY", PLAN_NAME: "Template integration test",
    SERVICE_MONTHS: "No real service months booked", PURCHASE_MODE: "Test only", TOTAL_AMOUNT: "No charge - test only",
  }),
  subject: "[TEST] Sanbay Fusion application email integration",
  tags: [{ name: "purpose", value: "runtime_email_test" }],
}, { idempotencyKey: "sanbay-resend-runtime-20261002-v1" });
if (result.error || !result.data?.id) throw new Error(`Runtime email rejected: ${result.error?.message || "missing message identifier"}`);
console.log(JSON.stringify({ id: result.data.id, sender: FROM_EMAIL, recipient: "delivered+sanbay-runtime@resend.dev", accepted: true }));
