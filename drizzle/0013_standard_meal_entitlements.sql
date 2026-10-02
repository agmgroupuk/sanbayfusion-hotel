ALTER TABLE "membership_benefit_redemptions" DROP CONSTRAINT "membership_benefit_valid_status";--> statement-breakpoint
ALTER TABLE "membership_benefit_redemptions" ALTER COLUMN "scheduled_date" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "membership_benefit_redemptions" ALTER COLUMN "status" SET DEFAULT 'available';--> statement-breakpoint
ALTER TABLE "membership_benefit_redemptions" ALTER COLUMN "redeemed_at" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "membership_benefit_redemptions" ALTER COLUMN "redeemed_at" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "membership_benefit_redemptions" ADD COLUMN "scheduled_time" varchar(5);--> statement-breakpoint
ALTER TABLE "membership_benefit_redemptions" ADD COLUMN "order_id" uuid;--> statement-breakpoint
ALTER TABLE "membership_benefit_redemptions" ADD CONSTRAINT "membership_benefit_redemptions_order_id_customer_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."customer_orders"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "membership_benefit_order_idx" ON "membership_benefit_redemptions" USING btree ("order_id");--> statement-breakpoint
ALTER TABLE "membership_benefit_redemptions" ADD CONSTRAINT "membership_benefit_valid_time" CHECK ("membership_benefit_redemptions"."scheduled_time" IS NULL OR ("membership_benefit_redemptions"."scheduled_date" IS NOT NULL AND "membership_benefit_redemptions"."scheduled_time" ~ '^((1[1-9]|2[0-3]):(00|30)|24:00)$'));--> statement-breakpoint
UPDATE "membership_benefit_redemptions" SET "status" = CASE WHEN "status" = 'fulfilled' THEN 'redeemed' ELSE 'scheduled' END,
  "redeemed_at" = CASE WHEN "status" = 'fulfilled' THEN COALESCE("fulfilled_at", "redeemed_at") ELSE NULL END;--> statement-breakpoint
ALTER TABLE "membership_benefit_redemptions" ADD CONSTRAINT "membership_benefit_valid_status" CHECK ("membership_benefit_redemptions"."status" in ('available', 'scheduled', 'reserved', 'redeemed', 'expired'));
