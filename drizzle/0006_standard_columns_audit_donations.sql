CREATE TABLE "audit_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"action" text NOT NULL,
	"entity_type" text NOT NULL,
	"entity_id" text,
	"actor_type" text NOT NULL,
	"actor_id" text,
	"user_id" text,
	"request_id" text,
	"before" jsonb,
	"after" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "chk_audit_logs_actor_type" CHECK ("audit_logs"."actor_type" in ('user', 'api_key', 'system'))
);
--> statement-breakpoint
CREATE TABLE "donations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"order_id" text NOT NULL,
	"amount" integer NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"payment_url" text,
	"request_id" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"completed_at" timestamp with time zone,
	CONSTRAINT "donations_order_id_unique" UNIQUE("order_id"),
	CONSTRAINT "chk_donations_amount" CHECK ("donations"."amount" > 0),
	CONSTRAINT "chk_donations_status" CHECK ("donations"."status" in ('pending', 'completed', 'failed', 'expired'))
);
--> statement-breakpoint
ALTER TABLE "posts" ALTER COLUMN "status" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "posts" ALTER COLUMN "status" SET DEFAULT 'draft';--> statement-breakpoint
ALTER TABLE "pages" ALTER COLUMN "status" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "pages" ALTER COLUMN "status" SET DEFAULT 'draft';--> statement-breakpoint
ALTER TABLE "taxonomies" ALTER COLUMN "type" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "taxonomies" ALTER COLUMN "type" SET DEFAULT 'tag';--> statement-breakpoint
ALTER TABLE "posts" ADD COLUMN "deleted_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "pages" ADD COLUMN "deleted_at" timestamp with time zone;--> statement-breakpoint
CREATE INDEX "idx_audit_logs_entity" ON "audit_logs" USING btree ("entity_type","entity_id");--> statement-breakpoint
CREATE INDEX "idx_audit_logs_created_at" ON "audit_logs" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "idx_audit_logs_user_id" ON "audit_logs" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_donations_created_at" ON "donations" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "idx_posts_deleted_at" ON "posts" USING btree ("deleted_at");--> statement-breakpoint
CREATE INDEX "idx_pages_deleted_at" ON "pages" USING btree ("deleted_at");--> statement-breakpoint
ALTER TABLE "posts" ADD CONSTRAINT "chk_posts_status" CHECK ("posts"."status" in ('draft', 'published'));--> statement-breakpoint
ALTER TABLE "pages" ADD CONSTRAINT "chk_pages_status" CHECK ("pages"."status" in ('draft', 'published'));--> statement-breakpoint
ALTER TABLE "taxonomies" ADD CONSTRAINT "chk_taxonomies_type" CHECK ("taxonomies"."type" in ('category', 'tag', 'custom'));--> statement-breakpoint
DROP TYPE "public"."post_status";--> statement-breakpoint
DROP TYPE "public"."page_status";--> statement-breakpoint
DROP TYPE "public"."taxonomy_type";--> statement-breakpoint
ALTER TABLE "audit_logs" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "donations" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE OR REPLACE FUNCTION "fn_audit_logs_append_only"() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  RAISE EXCEPTION 'audit_logs is append-only';
END;
$$;--> statement-breakpoint
CREATE TRIGGER "trg_audit_logs_append_only" BEFORE UPDATE OR DELETE ON "audit_logs" FOR EACH ROW EXECUTE FUNCTION "fn_audit_logs_append_only"();
