CREATE TYPE "public"."reservation_status" AS ENUM('pending', 'confirmed', 'cancelled');--> statement-breakpoint
CREATE TABLE "reservations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(120) NOT NULL,
	"email" varchar(200) NOT NULL,
	"phone" varchar(40) NOT NULL,
	"party_size" integer NOT NULL,
	"date" date NOT NULL,
	"time_slot" varchar(5) NOT NULL,
	"status" "reservation_status" DEFAULT 'pending' NOT NULL,
	"special_requests" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "reservations_date_slot_idx" ON "reservations" USING btree ("date","time_slot");