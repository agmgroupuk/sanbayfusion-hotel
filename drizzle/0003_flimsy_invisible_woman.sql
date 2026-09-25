CREATE TYPE "public"."customer_order_status" AS ENUM('pending_payment', 'confirmed', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."customer_payment_status" AS ENUM('pending', 'paid', 'failed', 'refunded');--> statement-breakpoint
CREATE TABLE "customer_order_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"order_id" uuid NOT NULL,
	"product_name" varchar(200) NOT NULL,
	"category_name" varchar(120) NOT NULL,
	"unit_price" integer NOT NULL,
	"quantity" integer NOT NULL,
	"line_total" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "customer_orders" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"order_number" varchar(32) NOT NULL,
	"account_id" uuid NOT NULL,
	"membership_request_id" uuid NOT NULL,
	"subtotal" integer NOT NULL,
	"total" integer NOT NULL,
	"notes" text,
	"delivery_details" jsonb NOT NULL,
	"status" "customer_order_status" DEFAULT 'pending_payment' NOT NULL,
	"payment_status" "customer_payment_status" DEFAULT 'pending' NOT NULL,
	"stripe_payment_intent_id" varchar(120),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"paid_at" timestamp with time zone,
	CONSTRAINT "customer_orders_order_number_unique" UNIQUE("order_number")
);
--> statement-breakpoint
ALTER TABLE "customer_accounts" ALTER COLUMN "full_name" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "customer_accounts" ALTER COLUMN "phone" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "customer_order_items" ADD CONSTRAINT "customer_order_items_order_id_customer_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."customer_orders"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "customer_orders" ADD CONSTRAINT "customer_orders_account_id_customer_accounts_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."customer_accounts"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "customer_orders" ADD CONSTRAINT "customer_orders_membership_request_id_membership_requests_id_fk" FOREIGN KEY ("membership_request_id") REFERENCES "public"."membership_requests"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "customer_order_items_order_idx" ON "customer_order_items" USING btree ("order_id");--> statement-breakpoint
CREATE INDEX "customer_orders_account_idx" ON "customer_orders" USING btree ("account_id");--> statement-breakpoint
CREATE INDEX "customer_orders_membership_idx" ON "customer_orders" USING btree ("membership_request_id");--> statement-breakpoint
CREATE INDEX "customer_orders_payment_intent_idx" ON "customer_orders" USING btree ("stripe_payment_intent_id");