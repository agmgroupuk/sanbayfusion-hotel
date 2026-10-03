import { PGlite } from "@electric-sql/pglite";
import { readFileSync, readdirSync } from "node:fs";
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { dispatchOne, type OutgoingEmail } from "./worker";
import { reminderSql } from "./reminders";
import { managedEmailTemplates, managedTemplateContent, renderManagedEmail } from "./managed-templates";
import { templatePurpose } from "./senders";
import { site } from "@/lib/site";

let client: PGlite;
let accountId: string;
beforeAll(async () => {
  client = new PGlite();
  for (const file of readdirSync("drizzle").filter(file => file.endsWith(".sql")).sort()) await client.exec(readFileSync(`drizzle/${file}`, "utf8"));
}, 60000);
beforeEach(async () => {
  await client.exec("TRUNCATE email_outbox, customer_accounts CASCADE");
  const result = await client.query<{ id: string }>("INSERT INTO customer_accounts (email, full_name, password_hash) VALUES ('customer@example.invalid','Customer','PRIVATE_PASSWORD_HASH') RETURNING id");
  accountId = result.rows[0].id;
  await client.exec("TRUNCATE email_outbox");
});
afterAll(async () => { await client.close(); });
async function queue() { return (await client.query<{ template: string; recipient: string; variables: Record<string, string>; status: string }>("SELECT * FROM email_outbox ORDER BY created_at")).rows; }
async function membership(status = "application_draft", expiryDays = 30) {
  const result = await client.query<{ id: string }>(`INSERT INTO membership_requests
    (customer_account_id,request_number,plan_id,plan_name,plan_snapshot,annual_fee,estimated_total,validity_months,delivery_days,annual_delivery_days,full_name,phone,email,address,contact_preferences,configuration,status,membership_expiry_date)
    VALUES ($1, $2,'test','1-Month Membership','{}',6000,6000,1,0,0,'Customer','123','old@example.invalid','{}','{}','{}',$3,(now() AT TIME ZONE 'Asia/Bangkok')::date + $4::int) RETURNING id`, [accountId, `SBF-${crypto.randomUUID().slice(0, 20)}`, status, expiryDays]);
  return result.rows[0].id;
}

describe("transactional email events, delivery and scheduling", () => {
  it("rolls back notifications with the business transaction", async () => {
    await client.exec("BEGIN; INSERT INTO customer_accounts (email,password_hash) VALUES ('rollback@example.invalid','secret'); ROLLBACK;");
    expect(await queue()).toEqual([]);
  });
  it("keeps migration timestamps increasing so the production migrator cannot skip new tables", () => {
    const journal = JSON.parse(readFileSync("drizzle/meta/_journal.json", "utf8")) as { entries: { when: number }[] };
    for (let i = 1; i < journal.entries.length; i++) expect(journal.entries[i].when).toBeGreaterThan(journal.entries[i - 1].when);
  });
  it("notifies password changes and both email addresses without persisting security secrets", async () => {
    await client.query("UPDATE customer_accounts SET password_hash = 'NEW_PRIVATE_HASH', email = 'new@example.invalid' WHERE id = $1", [accountId]);
    const rows = await queue();
    expect(rows.map(row => row.template)).toEqual(["sanbay-password-changed", "sanbay-email-changed", "sanbay-email-changed"]);
    expect(rows.slice(1).map(row => row.recipient).sort()).toEqual(["customer@example.invalid", "new@example.invalid"]);
    expect(JSON.stringify(rows)).not.toContain("PRIVATE");
  });
  it("notifies 2FA enable, recovery use and disable exactly once per change", async () => {
    await client.query("INSERT INTO account_security(account_id,totp_secret,enabled_at,recovery_hashes) VALUES ($1,'PRIVATE_TOTP',now(),'[\"PRIVATE_RECOVERY\"]')", [accountId]);
    await client.query("UPDATE account_security SET recovery_hashes='[]' WHERE account_id=$1", [accountId]);
    await client.query("UPDATE account_security SET enabled_at=NULL WHERE account_id=$1", [accountId]);
    const rows = await queue();
    expect(rows).toHaveLength(3);
    expect(rows.every(row => row.template === "sanbay-security")).toBe(true);
    expect(JSON.stringify(rows)).not.toContain("PRIVATE");
  });
  it("captures membership lifecycle transitions without duplicating payment or activation retries", async () => {
    const id = await membership();
    expect(await queue()).toHaveLength(0);
    await client.query("UPDATE membership_requests SET status='pending_review' WHERE id=$1", [id]);
    await client.query("UPDATE membership_requests SET status='approved_payment_pending',approved_at=now() WHERE id=$1", [id]);
    await client.query("UPDATE membership_requests SET status='payment_received',invoice_status='paid' WHERE id=$1", [id]);
    await client.query("UPDATE membership_requests SET status='active',member_id='SBF-M-TEST' WHERE id=$1", [id]);
    await client.query("UPDATE membership_requests SET status='active',invoice_status='paid',member_id='SBF-M-TEST' WHERE id=$1", [id]);
    const rows = await queue();
    expect(rows.map(row => row.template)).toEqual(["sanbay-membership-received", "sanbay-membership-review", "sanbay-membership-under-review", "sanbay-membership-approved", "sanbay-membership-paid", "sanbay-membership-active", "sanbay-membership-id"]);
    expect(rows[0].recipient).toBe("customer@example.invalid");
    expect(rows[4].variables.TOTAL_AMOUNT).toBe("THB 6,000");
  });
  it("only confirms settled orders, then reports cancellation separately", async () => {
    const membershipId = await membership();
    const { rows: [order] } = await client.query<{ id: string }>("INSERT INTO customer_orders (order_number,account_id,membership_request_id,subtotal,total,delivery_details) VALUES ('TEST-O',$1,$2,100,100,'{}') RETURNING id", [accountId, membershipId]);
    expect(await queue()).toHaveLength(0);
    await client.query("UPDATE customer_orders SET status='confirmed',payment_status='paid' WHERE id=$1", [order.id]);
    await client.query("UPDATE customer_orders SET status='confirmed',payment_status='paid' WHERE id=$1", [order.id]);
    await client.query("UPDATE customer_orders SET status='cancelled' WHERE id=$1", [order.id]);
    expect((await queue()).map(row => row.template)).toEqual(["sanbay-order-confirmation", "sanbay-order-update"]);
  });
  it("persists reservation acknowledgements for customer and staff with the reservation", async () => {
    await client.exec("INSERT INTO reservations(name,email,phone,party_size,date,time_slot,special_requests) VALUES ('Guest','guest@example.invalid','123',12,'2027-01-15','19:30','Private event')");
    const rows = await queue();
    expect(rows.map(row => row.template)).toEqual(["sanbay-meeting-received", "sanbay-meeting-staff"]);
    expect(rows[0].variables.NOTES).toBe("Private event");
    expect(templatePurpose(rows[0].template)).toBe("reservation");
  });
  it("uses the saved final expiry, avoids gaps and old history, and deduplicates reminders", async () => {
    for (const days of [7, 30, 0, -30]) {
      const id = await membership("active", days);
      await client.query("UPDATE membership_requests SET invoice_status='paid' WHERE id=$1", [id]);
    }
    await client.exec("TRUNCATE email_outbox");
    await client.exec(reminderSql); await client.exec(reminderSql);
    expect((await queue()).map(row => row.template).sort()).toEqual(["sanbay-membership-expired", "sanbay-membership-expiry-reminder"]);
  });
  it("sends tomorrow's meal reminder and cancels it if the schedule changes", async () => {
    const id = await membership("active");
    await client.query("UPDATE membership_requests SET invoice_status='paid' WHERE id=$1", [id]);
    const { rows: [benefit] } = await client.query<{ id: string }>(`INSERT INTO membership_benefit_redemptions(membership_request_id,service_month,meal_name,menu_value,scheduled_date,scheduled_time,status)
      VALUES ($1,to_char((now() AT TIME ZONE 'Asia/Bangkok')::date + 1,'YYYY-MM'),'Standard Meal',2000,(now() AT TIME ZONE 'Asia/Bangkok')::date + 1,'24:00','scheduled') RETURNING id`, [id]);
    expect((await queue()).some(row => row.template === "sanbay-meal-scheduled")).toBe(true);
    await client.exec("TRUNCATE email_outbox");
    await client.exec(reminderSql); await client.exec(reminderSql);
    expect(await queue()).toHaveLength(1);
    await client.query("UPDATE membership_benefit_redemptions SET scheduled_time='19:30' WHERE id=$1", [benefit.id]);
    await client.exec(reminderSql);
    const reminders = (await queue()).filter(row => row.template === "sanbay-delivery-reminder");
    expect(reminders.map(row => row.status).sort()).toEqual(["cancelled", "pending"]);
  });
  it("claims a queued event once even with overlapping dispatchers", async () => {
    await client.query("UPDATE customer_accounts SET password_hash='changed' WHERE id=$1", [accountId]);
    const send = vi.fn(async () => "provider-id");
    await Promise.all([dispatchOne(client, send), dispatchOne(client, send)]);
    expect(send).toHaveBeenCalledTimes(1);
    expect(send.mock.calls[0]).toBeDefined();
    expect((await queue())[0].status).toBe("sent");
  });
  it("retries an ambiguous failure using identical content and key, then stops before provider deduplication expires", async () => {
    await client.query("UPDATE customer_accounts SET password_hash='changed' WHERE id=$1", [accountId]);
    const send = vi.fn<(message: OutgoingEmail, key: string) => Promise<string>>(async () => { throw new Error("private provider response"); });
    const error = vi.spyOn(console, "error").mockImplementation(() => {});
    try {
      await dispatchOne(client, send);
      await client.exec("UPDATE email_outbox SET available_at=now()");
      await dispatchOne(client, send);
      expect(send.mock.calls[0]).toEqual(send.mock.calls[1]);
      await client.exec("UPDATE email_outbox SET first_attempt_at=now()-interval '25 hours',available_at=now()");
      expect(await dispatchOne(client, send)).toBe(false);
      expect((await queue())[0].status).toBe("failed");
      expect(JSON.stringify(error.mock.calls)).not.toContain("private provider response");
    } finally { error.mockRestore(); }
  });
  it("renders every published template without unresolved variables or legacy branding", () => {
    expect(new Set(managedEmailTemplates.map(t => t.alias)).size).toBe(managedEmailTemplates.length);
    for (const template of managedEmailTemplates) {
      const values = Object.fromEntries(managedTemplateContent(template).variables.map(v => [v.key, v.key === "SECURE_URL" ? `${site.url}/signin` : "Preview & sample"]));
      const email = renderManagedEmail(template.alias, values);
      expect(email.html).not.toMatch(/\{\{\{|maula|mola[ .-]?ai|<script/i);
      expect(email.html).toContain("sanbayfusion-logo.png");
      expect(email.text).not.toContain("{{{");
    }
  });
});
