CREATE TABLE "card_verifications" (
  "id" uuid PRIMARY KEY,
  "account_id" uuid NOT NULL REFERENCES "customer_accounts"("id") ON DELETE RESTRICT,
  "stripe_customer_id" varchar(120) NOT NULL,
  "payment_intent_id" varchar(120) UNIQUE,
  "payment_method_id" varchar(120),
  "amount" integer NOT NULL DEFAULT 200,
  "currency" varchar(3) NOT NULL DEFAULT 'usd',
  "status" varchar(30) NOT NULL DEFAULT 'pending',
  "refund_id" varchar(120),
  "refund_status" varchar(30),
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT "card_verification_amount" CHECK (amount = 200 AND currency = 'usd')
);
--> statement-breakpoint
CREATE INDEX "card_verification_owner_idx" ON "card_verifications" ("account_id");
--> statement-breakpoint
ALTER TABLE "membership_requests" ADD COLUMN "stripe_invoice_status" varchar(30), ADD COLUMN "application_state" varchar(30), ADD COLUMN "hosted_invoice_url" text, ADD COLUMN "invoice_pdf" text, ADD COLUMN "notification_sent_at" timestamptz;
--> statement-breakpoint
CREATE UNIQUE INDEX "membership_invoice_unique_idx" ON "membership_requests" ("stripe_invoice_id") WHERE "application_state" IS NOT NULL;
--> statement-breakpoint
CREATE FUNCTION sbf_protect_invoice_application() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF OLD.application_snapshot->>'version' = '2' AND OLD.submitted_at IS NOT NULL AND (
    NEW.application_snapshot IS DISTINCT FROM OLD.application_snapshot OR
    NEW.stripe_customer_id IS DISTINCT FROM OLD.stripe_customer_id OR
    NEW.stripe_payment_method_id IS DISTINCT FROM OLD.stripe_payment_method_id OR
    NEW.estimated_total IS DISTINCT FROM OLD.estimated_total OR
    (OLD.stripe_invoice_id IS NOT NULL AND NEW.stripe_invoice_id IS DISTINCT FROM OLD.stripe_invoice_id)
  ) THEN RAISE EXCEPTION 'Submitted invoice application is immutable'; END IF;
  RETURN NEW;
END $$;
--> statement-breakpoint
CREATE TRIGGER membership_invoice_agreement BEFORE UPDATE ON "membership_requests" FOR EACH ROW EXECUTE FUNCTION sbf_protect_invoice_application();
