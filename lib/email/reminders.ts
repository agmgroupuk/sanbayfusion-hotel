/** Bangkok calendar dates; membershipExpiryDate is the exclusive end of the saved agreement. */
export const reminderSql = `
INSERT INTO email_outbox (event_key, template, recipient, variables)
SELECT 'membership:' || m.id || ':' || CASE WHEN m.membership_expiry_date <= (now() AT TIME ZONE 'Asia/Bangkok')::date THEN 'expired' ELSE 'reminder' END,
  CASE WHEN m.membership_expiry_date <= (now() AT TIME ZONE 'Asia/Bangkok')::date THEN 'sanbay-membership-expired' ELSE 'sanbay-membership-expiry-reminder' END,
  coalesce(c.email, m.email), jsonb_build_object('REQUEST_NUMBER', m.request_number, 'PLAN_NAME', m.plan_name, 'EXPIRY_DATE', m.membership_expiry_date::text)
FROM membership_requests m LEFT JOIN customer_accounts c ON c.id = m.customer_account_id
WHERE m.status IN ('active', 'cancellation_requested') AND m.invoice_status = 'paid'
  AND m.membership_expiry_date BETWEEN (now() AT TIME ZONE 'Asia/Bangkok')::date - 1 AND (now() AT TIME ZONE 'Asia/Bangkok')::date + 7
ON CONFLICT (event_key) DO NOTHING;

INSERT INTO email_outbox (event_key, template, recipient, variables)
SELECT 'reminder:meal:' || b.id || ':' || b.scheduled_date || ':' || coalesce(b.scheduled_time, ''), 'sanbay-delivery-reminder', coalesce(c.email, m.email),
  jsonb_build_object('REQUEST_NUMBER', m.request_number, 'MEAL_NAME', b.meal_name, 'DELIVERY_DATE', b.scheduled_date::text, 'DELIVERY_TIME', coalesce(b.scheduled_time, 'Contact our team'))
FROM membership_benefit_redemptions b JOIN membership_requests m ON m.id = b.membership_request_id LEFT JOIN customer_accounts c ON c.id = m.customer_account_id
WHERE m.status = 'active' AND m.invoice_status = 'paid' AND b.status IN ('scheduled', 'redeemed') AND b.fulfilled_at IS NULL
  AND b.scheduled_date = (now() AT TIME ZONE 'Asia/Bangkok')::date + 1
ON CONFLICT (event_key) DO NOTHING;

INSERT INTO email_outbox (event_key, template, recipient, variables)
SELECT 'reminder:delivery:' || d.id || ':' || d.scheduled_date, 'sanbay-delivery-reminder', coalesce(c.email, m.email),
  jsonb_build_object('REQUEST_NUMBER', m.request_number, 'MEAL_NAME', 'Prepaid package delivery', 'DELIVERY_DATE', d.scheduled_date::text, 'DELIVERY_TIME', 'Contact our team')
FROM membership_delivery_entitlements d JOIN membership_requests m ON m.id = d.membership_request_id LEFT JOIN customer_accounts c ON c.id = m.customer_account_id
WHERE m.status = 'active' AND m.invoice_status = 'paid' AND d.status = 'scheduled'
  AND d.scheduled_date = (now() AT TIME ZONE 'Asia/Bangkok')::date + 1
ON CONFLICT (event_key) DO NOTHING;

-- Do not deliver a reminder after cancellation, rescheduling, fulfillment or its relevant date.
UPDATE email_outbox e SET status = 'cancelled', last_error = 'schedule_no_longer_current'
WHERE e.status = 'pending' AND (
 (e.template = 'sanbay-delivery-reminder' AND NOT (
   EXISTS (SELECT 1 FROM membership_benefit_redemptions b JOIN membership_requests m ON m.id = b.membership_request_id
     WHERE e.event_key = 'reminder:meal:' || b.id || ':' || b.scheduled_date || ':' || coalesce(b.scheduled_time, '')
     AND b.status IN ('scheduled','redeemed') AND b.fulfilled_at IS NULL AND m.status = 'active' AND m.invoice_status = 'paid'
     AND b.scheduled_date = (now() AT TIME ZONE 'Asia/Bangkok')::date + 1)
   OR EXISTS (SELECT 1 FROM membership_delivery_entitlements d JOIN membership_requests m ON m.id = d.membership_request_id
     WHERE e.event_key = 'reminder:delivery:' || d.id || ':' || d.scheduled_date AND d.status = 'scheduled' AND m.status = 'active' AND m.invoice_status = 'paid'
     AND d.scheduled_date = (now() AT TIME ZONE 'Asia/Bangkok')::date + 1)))
 OR (e.template = 'sanbay-membership-expiry-reminder' AND NOT EXISTS (
   SELECT 1 FROM membership_requests m WHERE e.event_key = 'membership:' || m.id || ':reminder' AND m.status IN ('active','cancellation_requested')
   AND m.invoice_status = 'paid' AND m.membership_expiry_date > (now() AT TIME ZONE 'Asia/Bangkok')::date))
);
`;
