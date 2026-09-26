ALTER TABLE "membership_requests" ALTER COLUMN "status" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "membership_requests" ALTER COLUMN "status" SET DEFAULT 'pending_review'::text;--> statement-breakpoint
DROP TYPE "public"."membership_request_status";--> statement-breakpoint
CREATE TYPE "public"."membership_request_status" AS ENUM('pending_review', 'contacting_customer', 'verified', 'approved', 'changes_requested', 'invoice_issued', 'awaiting_payment', 'payment_pending', 'payment_received', 'membership_setup', 'active', 'expired', 'cancellation_requested', 'cancelled', 'rejected');--> statement-breakpoint
ALTER TABLE "membership_requests" ALTER COLUMN "status" SET DEFAULT 'pending_review'::"public"."membership_request_status";--> statement-breakpoint
ALTER TABLE "membership_requests" ALTER COLUMN "status" SET DATA TYPE "public"."membership_request_status" USING "status"::"public"."membership_request_status";--> statement-breakpoint
ALTER TABLE "customer_accounts" ADD COLUMN "stripe_customer_id" varchar(120);--> statement-breakpoint
ALTER TABLE "membership_requests" ADD COLUMN "customer_account_id" uuid;--> statement-breakpoint
ALTER TABLE "membership_requests" ADD COLUMN "stripe_customer_id" varchar(120);--> statement-breakpoint
ALTER TABLE "membership_requests" ADD COLUMN "stripe_invoice_id" varchar(120);--> statement-breakpoint
ALTER TABLE "membership_requests" ADD COLUMN "stripe_payment_intent_id" varchar(120);--> statement-breakpoint
ALTER TABLE "membership_requests" ADD COLUMN "member_id" varchar(40);--> statement-breakpoint
ALTER TABLE "membership_requests" ADD COLUMN "verified_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "membership_requests" ADD COLUMN "activated_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "membership_requests" ADD COLUMN "activated_by" varchar(120);--> statement-breakpoint
ALTER TABLE "membership_requests" ADD COLUMN "activation_method" varchar(40);--> statement-breakpoint
ALTER TABLE "membership_requests" ADD COLUMN "cancelled_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "membership_requests" ADD CONSTRAINT "membership_requests_customer_account_id_customer_accounts_id_fk" FOREIGN KEY ("customer_account_id") REFERENCES "public"."customer_accounts"("id") ON DELETE set null ON UPDATE no action;