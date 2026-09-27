CREATE TYPE "public"."membership_delivery_status" AS ENUM('available', 'scheduled', 'fulfilled', 'cancelled');--> statement-breakpoint
CREATE TABLE "membership_delivery_entitlements" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"membership_request_id" uuid NOT NULL,
	"cycle_start_date" date NOT NULL,
	"cycle_end_date" date NOT NULL,
	"sequence" integer NOT NULL,
	"scheduled_date" date,
	"status" "membership_delivery_status" DEFAULT 'available' NOT NULL,
	"package_snapshot" jsonb NOT NULL,
	"fulfilled_at" timestamp with time zone,
	"fulfilled_by" varchar(120),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "membership_delivery_entitlements" ADD CONSTRAINT "membership_delivery_entitlements_membership_request_id_membership_requests_id_fk" FOREIGN KEY ("membership_request_id") REFERENCES "public"."membership_requests"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "membership_delivery_entitlement_slot_idx" ON "membership_delivery_entitlements" USING btree ("membership_request_id","cycle_start_date","sequence");--> statement-breakpoint
CREATE INDEX "membership_delivery_entitlement_schedule_idx" ON "membership_delivery_entitlements" USING btree ("status","scheduled_date");