CREATE TYPE "public"."membership_request_status" AS ENUM('pending_review', 'contacting_customer', 'approved', 'changes_requested', 'invoice_issued', 'awaiting_payment', 'payment_received', 'membership_setup', 'active', 'cancellation_requested', 'rejected', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."membership_invoice_status" AS ENUM('awaiting_payment', 'paid', 'payment_expired', 'cancelled_by_admin');--> statement-breakpoint
CREATE TABLE "membership_requests" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "request_number" varchar(32) NOT NULL,
  "plan_id" varchar(40) NOT NULL,
  "plan_name" varchar(120) NOT NULL,
  "plan_snapshot" jsonb NOT NULL,
  "annual_fee" integer NOT NULL,
  "add_on_total" integer DEFAULT 0 NOT NULL,
  "estimated_total" integer NOT NULL,
  "validity_months" integer NOT NULL,
  "delivery_days" integer NOT NULL,
  "annual_delivery_days" integer NOT NULL,
  "full_name" varchar(120) NOT NULL,
  "phone" varchar(40) NOT NULL,
  "email" varchar(200) NOT NULL,
  "line_id" varchar(80),
  "address" jsonb NOT NULL,
  "contact_preferences" jsonb NOT NULL,
  "configuration" jsonb NOT NULL,
  "invoice_number" varchar(40),
  "invoice_issued_at" timestamp with time zone,
  "payment_due_at" timestamp with time zone,
  "invoice_status" "public"."membership_invoice_status",
  "membership_number" varchar(40),
  "membership_start_date" date,
  "membership_expiry_date" date,
  "final_membership_snapshot" jsonb,
  "cancellation_requested_at" timestamp with time zone,
  "notes" text,
  "allergies" text,
  "status" "public"."membership_request_status" DEFAULT 'pending_review' NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT "membership_requests_request_number_unique" UNIQUE("request_number")
);--> statement-breakpoint
CREATE INDEX "membership_requests_status_idx" ON "membership_requests" USING btree ("status");--> statement-breakpoint
CREATE INDEX "membership_requests_email_idx" ON "membership_requests" USING btree ("email");
