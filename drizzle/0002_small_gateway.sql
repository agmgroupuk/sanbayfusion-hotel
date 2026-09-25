CREATE TYPE "public"."membership_invoice_status" AS ENUM('awaiting_payment', 'paid', 'payment_expired', 'cancelled_by_admin');--> statement-breakpoint
CREATE TYPE "public"."membership_request_status" AS ENUM('pending_review', 'contacting_customer', 'approved', 'changes_requested', 'invoice_issued', 'awaiting_payment', 'payment_received', 'membership_setup', 'active', 'cancellation_requested', 'rejected', 'cancelled');--> statement-breakpoint
CREATE TABLE "customer_accounts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"full_name" varchar(120) NOT NULL,
	"email" varchar(200) NOT NULL,
	"phone" varchar(40) NOT NULL,
	"password_hash" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "customer_sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"account_id" uuid NOT NULL,
	"token_hash" varchar(128) NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
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
	"invoice_status" "membership_invoice_status",
	"membership_number" varchar(40),
	"membership_start_date" date,
	"membership_expiry_date" date,
	"final_membership_snapshot" jsonb,
	"cancellation_requested_at" timestamp with time zone,
	"notes" text,
	"allergies" text,
	"status" "membership_request_status" DEFAULT 'pending_review' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "membership_requests_request_number_unique" UNIQUE("request_number")
);
--> statement-breakpoint
CREATE TABLE "password_reset_tokens" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"account_id" uuid NOT NULL,
	"token_hash" varchar(128) NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"used_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "customer_sessions" ADD CONSTRAINT "customer_sessions_account_id_customer_accounts_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."customer_accounts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "password_reset_tokens" ADD CONSTRAINT "password_reset_tokens_account_id_customer_accounts_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."customer_accounts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "customer_accounts_email_idx" ON "customer_accounts" USING btree ("email");--> statement-breakpoint
CREATE UNIQUE INDEX "customer_sessions_token_hash_idx" ON "customer_sessions" USING btree ("token_hash");--> statement-breakpoint
CREATE INDEX "customer_sessions_account_idx" ON "customer_sessions" USING btree ("account_id");--> statement-breakpoint
CREATE INDEX "membership_requests_status_idx" ON "membership_requests" USING btree ("status");--> statement-breakpoint
CREATE INDEX "membership_requests_email_idx" ON "membership_requests" USING btree ("email");--> statement-breakpoint
CREATE UNIQUE INDEX "password_reset_tokens_hash_idx" ON "password_reset_tokens" USING btree ("token_hash");--> statement-breakpoint
CREATE INDEX "password_reset_tokens_account_idx" ON "password_reset_tokens" USING btree ("account_id");