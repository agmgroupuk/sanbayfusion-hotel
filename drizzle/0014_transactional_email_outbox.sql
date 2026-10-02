CREATE TABLE "email_outbox" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"event_key" text NOT NULL,
	"template" varchar(80) NOT NULL,
	"recipient" varchar(200) NOT NULL,
	"variables" jsonb NOT NULL,
	"reply_to" varchar(200),
	"status" varchar(20) DEFAULT 'pending' NOT NULL,
	"attempts" integer DEFAULT 0 NOT NULL,
	"available_at" timestamp with time zone DEFAULT now() NOT NULL,
	"first_attempt_at" timestamp with time zone,
	"locked_at" timestamp with time zone,
	"provider_id" varchar(80),
	"last_error" varchar(100),
	"created_at" timestamp with time zone DEFAULT clock_timestamp() NOT NULL,
	"sent_at" timestamp with time zone,
	CONSTRAINT "email_outbox_event_key_unique" UNIQUE("event_key")
);
--> statement-breakpoint
CREATE INDEX "email_outbox_due_idx" ON "email_outbox" USING btree ("status","available_at");
--> statement-breakpoint
-- Capture committed business events in the same transaction as the underlying change.
-- Only explicitly selected display fields enter the outbox: never passwords, tokens or cards.
CREATE FUNCTION sbf_email_enqueue(event_key text, template text, recipient text, variables jsonb) RETURNS void
LANGUAGE sql AS $$
  INSERT INTO email_outbox (event_key, template, recipient, variables)
  SELECT event_key, template, recipient, variables WHERE recipient IS NOT NULL AND recipient <> ''
  ON CONFLICT (event_key) DO NOTHING;
$$;
--> statement-breakpoint
CREATE FUNCTION sbf_email_capture() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE
  v jsonb := to_jsonb(NEW);
  prior jsonb := '{}'::jsonb;
  vars jsonb;
  recipient text;
  ref text;
  a record;
BEGIN
  IF TG_OP = 'UPDATE' THEN prior := to_jsonb(OLD); END IF;
  IF TG_TABLE_NAME = 'customer_accounts' THEN
    vars := jsonb_build_object('CUSTOMER_NAME', coalesce(nullif(NEW.full_name, ''), 'there'));
    IF TG_OP = 'INSERT' THEN
      PERFORM sbf_email_enqueue('welcome:' || NEW.id, 'sanbay-welcome', NEW.email, vars);
    ELSE
      IF NEW.password_hash IS DISTINCT FROM OLD.password_hash THEN
        PERFORM sbf_email_enqueue('password:' || gen_random_uuid(), 'sanbay-password-changed', NEW.email, '{}'::jsonb);
      END IF;
      IF NEW.email IS DISTINCT FROM OLD.email THEN
        ref := 'email-change:' || gen_random_uuid();
        PERFORM sbf_email_enqueue(ref || ':old', 'sanbay-email-changed', OLD.email, '{}'::jsonb);
        PERFORM sbf_email_enqueue(ref || ':new', 'sanbay-email-changed', NEW.email, '{}'::jsonb);
      END IF;
    END IF;
  ELSIF TG_TABLE_NAME = 'account_security' THEN
    SELECT email INTO recipient FROM customer_accounts WHERE id = NEW.account_id;
    IF v->>'enabled_at' IS DISTINCT FROM prior->>'enabled_at' THEN
      PERFORM sbf_email_enqueue('security:' || gen_random_uuid(), 'sanbay-security', recipient,
        jsonb_build_object('UPDATE_MESSAGE', CASE WHEN NEW.enabled_at IS NULL THEN 'Two-factor authentication was disabled.' ELSE 'Two-factor authentication was enabled.' END));
    ELSIF jsonb_array_length(coalesce(prior->'recovery_hashes', '[]'::jsonb)) > jsonb_array_length(NEW.recovery_hashes) AND NEW.enabled_at IS NOT NULL THEN
      PERFORM sbf_email_enqueue('recovery:' || gen_random_uuid(), 'sanbay-security', recipient, jsonb_build_object('UPDATE_MESSAGE', 'A recovery code was used to authenticate your account. Review your remaining recovery codes in Account Center.'));
    END IF;
  ELSIF TG_TABLE_NAME = 'account_audit_events' THEN
    IF NEW.event IN ('payment_method_verified', 'payment_method_removed', 'default_payment_method_changed', 'email_change_requested') THEN
      SELECT email INTO recipient FROM customer_accounts WHERE id = NEW.account_id;
      PERFORM sbf_email_enqueue('audit:' || NEW.id, 'sanbay-account-notice', recipient, jsonb_build_object('UPDATE_MESSAGE', initcap(replace(NEW.event, '_', ' ')) || '.'));
    END IF;
  ELSIF TG_TABLE_NAME = 'membership_requests' THEN
    SELECT email INTO recipient FROM customer_accounts WHERE id = NEW.customer_account_id;
    recipient := coalesce(recipient, NEW.email);
    vars := jsonb_build_object('CUSTOMER_NAME', NEW.full_name, 'CUSTOMER_EMAIL', recipient, 'CUSTOMER_PHONE', NEW.phone,
      'REQUEST_NUMBER', NEW.request_number, 'PLAN_NAME', NEW.plan_name,
      'SERVICE_MONTHS', coalesce((SELECT string_agg(value, ', ') FROM jsonb_array_elements_text(NEW.selected_service_months)), 'See your saved membership agreement'),
      'PURCHASE_MODE', CASE WHEN NEW.purchase_snapshot->>'purchaseMode' = 'membership_with_package' THEN 'Membership + prepaid package' ELSE 'Membership only' END,
      'TOTAL_AMOUNT', 'THB ' || to_char(NEW.estimated_total, 'FM999,999,990'),
      'EXPIRY_DATE', coalesce(NEW.membership_expiry_date::text, 'See your account'), 'MEMBER_ID', coalesce(NEW.member_id, 'See your account'));
    ref := 'membership:' || NEW.id;
    IF NEW.status = 'pending_review' AND v->>'status' IS DISTINCT FROM prior->>'status' THEN
      PERFORM sbf_email_enqueue(ref || ':received', 'sanbay-membership-received', recipient, vars);
      PERFORM sbf_email_enqueue(ref || ':staff', 'sanbay-membership-review', '__staff__', vars);
      PERFORM sbf_email_enqueue(ref || ':review', 'sanbay-membership-under-review', recipient, vars);
    END IF;
    IF NEW.approved_at IS NOT NULL AND prior->>'approved_at' IS NULL THEN
      PERFORM sbf_email_enqueue(ref || ':approved', 'sanbay-membership-approved', recipient, vars);
    END IF;
    IF NEW.status IN ('declined', 'rejected') AND v->>'status' IS DISTINCT FROM prior->>'status' THEN
      PERFORM sbf_email_enqueue(ref || ':declined', 'sanbay-membership-declined', recipient, vars);
    END IF;
    IF NEW.invoice_status = 'paid' AND prior->>'invoice_status' IS DISTINCT FROM 'paid' THEN
      PERFORM sbf_email_enqueue(ref || ':paid', 'sanbay-membership-paid', recipient, vars);
    END IF;
    IF NEW.status = 'active' AND v->>'status' IS DISTINCT FROM prior->>'status' THEN
      PERFORM sbf_email_enqueue(ref || ':active', 'sanbay-membership-active', recipient, vars);
    END IF;
    IF NEW.member_id IS NOT NULL AND prior->>'member_id' IS NULL THEN
      PERFORM sbf_email_enqueue(ref || ':id', 'sanbay-membership-id', recipient, vars);
    END IF;
    IF NEW.status = 'expired' AND v->>'status' IS DISTINCT FROM prior->>'status' THEN
      PERFORM sbf_email_enqueue(ref || ':expired', 'sanbay-membership-expired', recipient, vars);
    END IF;
    IF NEW.status IN ('approved_payment_failed', 'approved_payment_action_required', 'cancelled', 'cancellation_requested') AND v->>'status' IS DISTINCT FROM prior->>'status' THEN
      PERFORM sbf_email_enqueue(ref || ':notice:' || gen_random_uuid(), 'sanbay-account-notice', recipient,
        jsonb_build_object('UPDATE_MESSAGE', 'Membership ' || NEW.request_number || ': ' || replace(NEW.status::text, '_', ' ') || '. Open your membership page for details and next steps.'));
    END IF;
  ELSIF TG_TABLE_NAME = 'customer_orders' THEN
    SELECT email INTO recipient FROM customer_accounts WHERE id = NEW.account_id;
    vars := jsonb_build_object('ORDER_NUMBER', NEW.order_number, 'TOTAL_AMOUNT', 'THB ' || to_char(NEW.total, 'FM999,999,990'),
      'ORDER_STATUS', replace(NEW.status::text, '_', ' '), 'PAYMENT_STATUS', NEW.payment_status::text);
    IF NEW.status = 'confirmed' AND NEW.payment_status = 'paid' AND (prior->>'status' IS DISTINCT FROM 'confirmed' OR prior->>'payment_status' IS DISTINCT FROM 'paid') THEN
      PERFORM sbf_email_enqueue('order:' || NEW.id || ':confirmed', 'sanbay-order-confirmation', recipient, vars);
    ELSIF TG_OP = 'UPDATE' AND (v->>'status' IS DISTINCT FROM prior->>'status' OR v->>'payment_status' IS DISTINCT FROM prior->>'payment_status') THEN
      PERFORM sbf_email_enqueue('order:' || NEW.id || ':' || gen_random_uuid(), 'sanbay-order-update', recipient, vars);
    END IF;
  ELSIF TG_TABLE_NAME = 'membership_benefit_redemptions' THEN
    SELECT m.*, coalesce(c.email, m.email) AS recipient INTO a FROM membership_requests m LEFT JOIN customer_accounts c ON c.id = m.customer_account_id WHERE m.id = NEW.membership_request_id;
    vars := jsonb_build_object('REQUEST_NUMBER', a.request_number, 'MEAL_NAME', NEW.meal_name, 'DELIVERY_DATE', NEW.scheduled_date::text, 'DELIVERY_TIME', coalesce(NEW.scheduled_time, 'Contact our team'));
    IF NEW.scheduled_date IS NOT NULL AND NEW.status <> 'expired' AND (v->>'scheduled_date' IS DISTINCT FROM prior->>'scheduled_date' OR v->>'scheduled_time' IS DISTINCT FROM prior->>'scheduled_time') THEN
      PERFORM sbf_email_enqueue('meal:' || NEW.id || ':' || gen_random_uuid(), 'sanbay-meal-scheduled', a.recipient, vars);
    END IF;
    IF NEW.fulfilled_at IS NOT NULL AND prior->>'fulfilled_at' IS NULL THEN
      PERFORM sbf_email_enqueue('meal:' || NEW.id || ':fulfilled', 'sanbay-order-update', a.recipient,
        jsonb_build_object('ORDER_NUMBER', a.request_number || ' / ' || NEW.service_month, 'TOTAL_AMOUNT', 'See your saved order', 'ORDER_STATUS', 'Standard Meal fulfilled', 'PAYMENT_STATUS', 'See your saved order'));
    END IF;
  ELSIF TG_TABLE_NAME = 'membership_delivery_entitlements' THEN
    IF TG_OP = 'UPDATE' AND v->>'status' IS DISTINCT FROM prior->>'status' THEN
      SELECT m.*, coalesce(c.email, m.email) AS recipient INTO a FROM membership_requests m LEFT JOIN customer_accounts c ON c.id = m.customer_account_id WHERE m.id = NEW.membership_request_id;
      PERFORM sbf_email_enqueue('delivery:' || NEW.id || ':' || gen_random_uuid(), 'sanbay-order-update', a.recipient,
        jsonb_build_object('ORDER_NUMBER', a.request_number || ' / delivery ' || NEW.sequence, 'TOTAL_AMOUNT', 'Included in prepaid package', 'ORDER_STATUS', NEW.status::text, 'PAYMENT_STATUS', 'Prepaid membership package'));
    END IF;
  ELSIF TG_TABLE_NAME = 'reservations' AND TG_OP = 'INSERT' THEN
    vars := jsonb_build_object('CUSTOMER_NAME', NEW.name, 'CUSTOMER_EMAIL', NEW.email, 'CUSTOMER_PHONE', NEW.phone,
      'REQUEST_NUMBER', upper(left(NEW.id::text, 8)), 'MEETING_DATE', NEW.date::text, 'MEETING_TIME', NEW.time_slot || ' (Bangkok)', 'ATTENDEES', NEW.party_size::text,
      'NOTES', coalesce(nullif(NEW.special_requests, ''), 'Not supplied'));
    PERFORM sbf_email_enqueue('reservation:' || NEW.id || ':received', 'sanbay-meeting-received', NEW.email, vars);
    PERFORM sbf_email_enqueue('reservation:' || NEW.id || ':staff', 'sanbay-meeting-staff', '__staff__', vars);
  END IF;
  RETURN NEW;
END;
$$;
--> statement-breakpoint
CREATE TRIGGER sbf_email_account AFTER INSERT OR UPDATE ON customer_accounts FOR EACH ROW EXECUTE FUNCTION sbf_email_capture();
--> statement-breakpoint
CREATE TRIGGER sbf_email_security AFTER INSERT OR UPDATE ON account_security FOR EACH ROW EXECUTE FUNCTION sbf_email_capture();
--> statement-breakpoint
CREATE TRIGGER sbf_email_audit AFTER INSERT ON account_audit_events FOR EACH ROW EXECUTE FUNCTION sbf_email_capture();
--> statement-breakpoint
CREATE TRIGGER sbf_email_membership AFTER INSERT OR UPDATE ON membership_requests FOR EACH ROW EXECUTE FUNCTION sbf_email_capture();
--> statement-breakpoint
CREATE TRIGGER sbf_email_order AFTER INSERT OR UPDATE ON customer_orders FOR EACH ROW EXECUTE FUNCTION sbf_email_capture();
--> statement-breakpoint
CREATE TRIGGER sbf_email_meal AFTER INSERT OR UPDATE ON membership_benefit_redemptions FOR EACH ROW EXECUTE FUNCTION sbf_email_capture();
--> statement-breakpoint
CREATE TRIGGER sbf_email_delivery AFTER INSERT OR UPDATE ON membership_delivery_entitlements FOR EACH ROW EXECUTE FUNCTION sbf_email_capture();
--> statement-breakpoint
CREATE TRIGGER sbf_email_reservation AFTER INSERT ON reservations FOR EACH ROW EXECUTE FUNCTION sbf_email_capture();
