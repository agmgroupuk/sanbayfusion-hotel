CREATE TABLE "stripe_membership_catalog" (
	"plan_id" varchar(40) PRIMARY KEY NOT NULL,
	"plan_slug" varchar(80) NOT NULL,
	"product_id" varchar(120) NOT NULL,
	"price_id" varchar(120) NOT NULL,
	"amount" integer NOT NULL,
	"currency" varchar(3) DEFAULT 'thb' NOT NULL,
	"mode" varchar(12) DEFAULT 'test' NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "stripe_membership_catalog_plan_slug_unique" UNIQUE("plan_slug")
);
