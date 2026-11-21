ALTER TABLE "posts" ADD COLUMN "visibility" text DEFAULT 'public' NOT NULL;--> statement-breakpoint
ALTER TABLE "posts" ADD COLUMN "format" text DEFAULT 'standard' NOT NULL;--> statement-breakpoint
ALTER TABLE "posts" ADD COLUMN "is_sticky" boolean DEFAULT false NOT NULL;--> statement-breakpoint
CREATE INDEX "idx_posts_status_published_at" ON "posts" USING btree ("status","published_at");--> statement-breakpoint
ALTER TABLE "posts" ADD CONSTRAINT "chk_posts_visibility" CHECK ("posts"."visibility" in ('public', 'private'));--> statement-breakpoint
ALTER TABLE "posts" ADD CONSTRAINT "chk_posts_format" CHECK ("posts"."format" in ('standard', 'gallery', 'video', 'audio'));