CREATE TABLE "account_addresses" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"account_id" uuid NOT NULL,
	"kind" varchar(12) NOT NULL,
	"details" jsonb NOT NULL,
	"is_default" boolean DEFAULT false NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "account_audit_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"account_id" uuid NOT NULL,
	"event" varchar(80) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "account_email_changes" (
	"account_id" uuid PRIMARY KEY NOT NULL,
	"new_email" varchar(200) NOT NULL,
	"token_hash" varchar(64) NOT NULL,
	"expires_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "account_rate_limits" (
	"key" varchar(128) PRIMARY KEY NOT NULL,
	"attempts" integer NOT NULL,
	"expires_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "account_security" (
	"account_id" uuid PRIMARY KEY NOT NULL,
	"totp_secret" text,
	"enabled_at" timestamp with time zone,
	"pending_secret" text,
	"pending_expires_at" timestamp with time zone,
	"last_counter" integer DEFAULT -1 NOT NULL,
	"recovery_hashes" jsonb DEFAULT '[]'::jsonb NOT NULL
);
--> statement-breakpoint
ALTER TABLE "customer_accounts" ADD COLUMN "display_name" varchar(80);--> statement-breakpoint
ALTER TABLE "account_addresses" ADD CONSTRAINT "account_addresses_account_id_customer_accounts_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."customer_accounts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "account_audit_events" ADD CONSTRAINT "account_audit_events_account_id_customer_accounts_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."customer_accounts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "account_email_changes" ADD CONSTRAINT "account_email_changes_account_id_customer_accounts_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."customer_accounts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "account_security" ADD CONSTRAINT "account_security_account_id_customer_accounts_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."customer_accounts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "account_addresses_owner_idx" ON "account_addresses" USING btree ("account_id");--> statement-breakpoint
CREATE UNIQUE INDEX "account_addresses_default_idx" ON "account_addresses" USING btree ("account_id","kind") WHERE "account_addresses"."is_default" = true;--> statement-breakpoint
CREATE INDEX "account_audit_owner_idx" ON "account_audit_events" USING btree ("account_id");