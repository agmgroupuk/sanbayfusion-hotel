ALTER TYPE "public"."membership_request_status" ADD VALUE 'application_draft' BEFORE 'pending_review';--> statement-breakpoint
ALTER TYPE "public"."membership_request_status" ADD VALUE 'approved_payment_pending' BEFORE 'contacting_customer';--> statement-breakpoint
ALTER TYPE "public"."membership_request_status" ADD VALUE 'approved_payment_action_required' BEFORE 'contacting_customer';--> statement-breakpoint
ALTER TYPE "public"."membership_request_status" ADD VALUE 'approved_payment_failed' BEFORE 'contacting_customer';--> statement-breakpoint
ALTER TYPE "public"."membership_request_status" ADD VALUE 'declined' BEFORE 'contacting_customer';--> statement-breakpoint
ALTER TABLE "membership_requests" ADD COLUMN "application_snapshot" jsonb;--> statement-breakpoint
ALTER TABLE "membership_requests" ADD COLUMN "stripe_setup_intent_id" varchar(120);--> statement-breakpoint
ALTER TABLE "membership_requests" ADD COLUMN "stripe_payment_method_id" varchar(120);--> statement-breakpoint
ALTER TABLE "membership_requests" ADD COLUMN "payment_method_summary" jsonb;--> statement-breakpoint
ALTER TABLE "membership_requests" ADD COLUMN "submitted_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "membership_requests" ADD COLUMN "approved_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "membership_requests" ADD COLUMN "reviewed_by" varchar(200);--> statement-breakpoint
ALTER TABLE "membership_requests" ADD COLUMN "payment_attempt" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "membership_requests" ADD COLUMN "payment_failure" text;