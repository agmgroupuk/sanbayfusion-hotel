import { mkdir, writeFile } from "node:fs/promises";
import { managedEmailTemplates, managedTemplateContent, renderManagedEmail } from "../lib/email/managed-templates.js";
import { emailSender, templatePurpose } from "../lib/email/senders.js";
import { readFile } from "node:fs/promises";

const folder = process.env.EMAIL_PREVIEW_DIR || ".next/resend-setup";
// Pass a JSON array of aliases from a fresh MCP list-templates inspection before syncing.
const existing: string[] = process.env.RESEND_EXISTING_ALIASES ? JSON.parse(await readFile(process.env.RESEND_EXISTING_ALIASES, "utf8")) : [];
await mkdir(folder, { recursive: true });
const exampleValues: Record<string, string> = {
  CUSTOMER_NAME: "Sample Customer", CUSTOMER_EMAIL: "delivered@resend.dev", CUSTOMER_PHONE: "Not supplied in this test",
  REQUEST_NUMBER: "SBF-PREVIEW-ONLY", PLAN_NAME: "3-Month Membership", SERVICE_MONTHS: "January, April and July 2027",
  PURCHASE_MODE: "Membership only", TOTAL_AMOUNT: "THB 15,000", MEETING_DATE: "15 January 2027",
  MEETING_TIME: "14:00 (Bangkok)", ATTENDEES: "2", NOTES: "Template preview only. No meeting or membership was created.",
  MESSAGE: "This is a template preview, not a real customer enquiry.", SECURE_URL: "https://sanbayfusion.com/signin",
  UPDATE_MESSAGE: "Preview only: two-factor authentication enabled.", MEMBER_ID: "SBF-PREVIEW-ONLY",
  EXPIRY_DATE: "2027-08-01", MEAL_NAME: "Included Standard Meal", DELIVERY_DATE: "2027-01-15", DELIVERY_TIME: "19:30",
  ORDER_NUMBER: "SBF-PREVIEW-ONLY", ORDER_STATUS: "confirmed (preview only)", PAYMENT_STATUS: "paid (preview only)",
};
const calls = [];
for (const template of managedEmailTemplates) {
  const content = managedTemplateContent(template);
  calls.push({ tool: existing.includes(template.alias) ? "update-template" : "create-template", label: template.alias, arguments: {
    ...(existing.includes(template.alias) ? { id: template.alias } : {}),
    name: template.name, alias: template.alias, subject: template.subject, from: emailSender(templatePurpose(template.alias)), ...content,
    context: "The assistant is preparing a reusable transactional email draft with consistent branding and variables for an existing application workflow.",
    llm_model: "unknown",
  } });
  const rendered = renderManagedEmail(template.alias, exampleValues);
  const preview = rendered.html;
  await writeFile(`${folder}/${template.alias}.html`, preview);
  await writeFile(`${folder}/${template.alias}.json`, JSON.stringify({ ...template, ...content, previewHtml: preview, previewText: rendered.text }, null, 2));
}
await writeFile(`${folder}/sync-templates.json`, JSON.stringify(calls, null, 2));
await writeFile(`${folder}/publish-templates.json`, JSON.stringify(managedEmailTemplates.map(template => ({ tool: "publish-template", label: template.alias, arguments: { id: template.alias, context: "The assistant is publishing reviewed transactional templates so the application and email dashboard share consistent customer communication content.", llm_model: "unknown" } })), null, 2));
console.log(`Prepared ${calls.length} draft payloads and local previews. This command does not connect to Resend or send emails.`);
