ALTER TYPE "public"."membership_request_status" ADD VALUE IF NOT EXISTS 'verified';--> statement-breakpoint
ALTER TYPE "public"."membership_request_status" ADD VALUE IF NOT EXISTS 'payment_pending';--> statement-breakpoint
ALTER TYPE "public"."membership_request_status" ADD VALUE IF NOT EXISTS 'expired';--> statement-breakpoint
ALTER TYPE "public"."membership_request_status" ADD VALUE IF NOT EXISTS 'rejected';--> statement-breakpoint
ALTER TABLE "customer_accounts" ADD COLUMN IF NOT EXISTS "stripe_customer_id" varchar(120);--> statement-breakpoint
ALTER TABLE "membership_requests" ADD COLUMN IF NOT EXISTS "customer_account_id" uuid;--> statement-breakpoint
ALTER TABLE "membership_requests" ADD COLUMN IF NOT EXISTS "stripe_customer_id" varchar(120);--> statement-breakpoint
ALTER TABLE "membership_requests" ADD COLUMN IF NOT EXISTS "stripe_invoice_id" varchar(120);--> statement-breakpoint
ALTER TABLE "membership_requests" ADD COLUMN IF NOT EXISTS "stripe_payment_intent_id" varchar(120);--> statement-breakpoint
ALTER TABLE "membership_requests" ADD COLUMN IF NOT EXISTS "member_id" varchar(40);--> statement-breakpoint
ALTER TABLE "membership_requests" ADD COLUMN IF NOT EXISTS "verified_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "membership_requests" ADD COLUMN IF NOT EXISTS "activated_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "membership_requests" ADD COLUMN IF NOT EXISTS "activated_by" varchar(120);--> statement-breakpoint
ALTER TABLE "membership_requests" ADD COLUMN IF NOT EXISTS "activation_method" varchar(40);--> statement-breakpoint
ALTER TABLE "membership_requests" ADD COLUMN IF NOT EXISTS "cancelled_at" timestamp with time zone;--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE "membership_requests" ADD CONSTRAINT "membership_requests_customer_account_id_customer_accounts_id_fk" FOREIGN KEY ("customer_account_id") REFERENCES "public"."customer_accounts"("id") ON DELETE SET NULL ON UPDATE NO ACTION;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "stripe_membership_catalog" (
  "plan_id" varchar(40) PRIMARY KEY NOT NULL,
  "plan_slug" varchar(80) NOT NULL UNIQUE,
  "product_id" varchar(120) NOT NULL,
  "price_id" varchar(120) NOT NULL,
  "amount" integer NOT NULL,
  "currency" varchar(3) DEFAULT 'thb' NOT NULL,
  "mode" varchar(12) DEFAULT 'test' NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);--> statement-breakpoint