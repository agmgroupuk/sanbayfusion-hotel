CREATE TABLE "membership_benefit_redemptions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"membership_request_id" uuid NOT NULL,
	"service_month" varchar(7) NOT NULL,
	"meal_name" varchar(120) NOT NULL,
	"menu_value" integer NOT NULL,
	"scheduled_date" date NOT NULL,
	"status" varchar(16) DEFAULT 'requested' NOT NULL,
	"redeemed_at" timestamp with time zone DEFAULT now() NOT NULL,
	"fulfilled_at" timestamp with time zone,
	"fulfilled_by" varchar(200),
	CONSTRAINT "membership_benefit_valid_month" CHECK ("membership_benefit_redemptions"."service_month" ~ '^[0-9]{4}-(0[1-9]|1[0-2])$'),
	CONSTRAINT "membership_benefit_in_month" CHECK (to_char("membership_benefit_redemptions"."scheduled_date", 'YYYY-MM') = "membership_benefit_redemptions"."service_month"),
	CONSTRAINT "membership_benefit_valid_status" CHECK ("membership_benefit_redemptions"."status" in ('requested', 'fulfilled')),
	CONSTRAINT "membership_benefit_positive_value" CHECK ("membership_benefit_redemptions"."menu_value" > 0)
);
--> statement-breakpoint
ALTER TABLE "membership_requests" ADD COLUMN "selected_service_months" jsonb;--> statement-breakpoint
ALTER TABLE "membership_benefit_redemptions" ADD CONSTRAINT "membership_benefit_redemptions_membership_request_id_membership_requests_id_fk" FOREIGN KEY ("membership_request_id") REFERENCES "public"."membership_requests"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "membership_benefit_month_idx" ON "membership_benefit_redemptions" USING btree ("membership_request_id","service_month");
--> statement-breakpoint
-- Extend the existing agreement. Historical v1-v3 snapshots keep null months.
CREATE FUNCTION sbf_check_service_month_agreement() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE month_count integer; distinct_count integer; year_count integer; valid_count integer;
BEGIN
  IF TG_OP = 'UPDATE' AND OLD.selected_service_months IS NOT NULL
     AND (OLD.submitted_at IS NOT NULL OR OLD.status <> 'application_draft')
     AND (NEW.selected_service_months IS DISTINCT FROM OLD.selected_service_months
       OR NEW.purchase_snapshot IS DISTINCT FROM OLD.purchase_snapshot) THEN
    RAISE EXCEPTION 'Finalized service months and included benefit are fixed' USING ERRCODE = '23514';
  END IF;
  IF NEW.purchase_snapshot->>'version' = '4' THEN
    IF NEW.selected_service_months IS NULL OR jsonb_typeof(NEW.selected_service_months) <> 'array' THEN
      RAISE EXCEPTION 'Selected service months are required' USING ERRCODE = '23514';
    END IF;
    SELECT count(*), count(DISTINCT value), count(DISTINCT left(value, 4)),
      count(*) FILTER (WHERE value ~ '^[0-9]{4}-(0[1-9]|1[0-2])$')
      INTO month_count, distinct_count, year_count, valid_count
      FROM jsonb_array_elements_text(NEW.selected_service_months);
    IF NEW.validity_months NOT BETWEEN 1 AND 12 OR month_count <> NEW.validity_months
      OR distinct_count <> month_count OR year_count <> 1 OR valid_count <> month_count
      OR NEW.selected_service_months IS DISTINCT FROM NEW.purchase_snapshot->'selectedServiceMonths' THEN
      RAISE EXCEPTION 'Selected service months must match the saved plan and agreement' USING ERRCODE = '23514';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;
--> statement-breakpoint
CREATE TRIGGER membership_service_month_agreement BEFORE INSERT OR UPDATE ON membership_requests
FOR EACH ROW EXECUTE FUNCTION sbf_check_service_month_agreement();
