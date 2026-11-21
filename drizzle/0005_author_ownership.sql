ALTER TABLE "posts" ADD COLUMN "author_id" text;--> statement-breakpoint
ALTER TABLE "pages" ADD COLUMN "author_id" text;--> statement-breakpoint
ALTER TABLE "posts" ADD CONSTRAINT "posts_author_id_user_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pages" ADD CONSTRAINT "pages_author_id_user_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_posts_author_id" ON "posts" USING btree ("author_id");--> statement-breakpoint
CREATE INDEX "idx_pages_author_id" ON "pages" USING btree ("author_id");--> statement-breakpoint
UPDATE "posts" SET "author_id" = (SELECT "id" FROM "user" WHERE "role" = 'administrator' ORDER BY "created_at" LIMIT 1) WHERE "author_id" IS NULL;--> statement-breakpoint
UPDATE "pages" SET "author_id" = (SELECT "id" FROM "user" WHERE "role" = 'administrator' ORDER BY "created_at" LIMIT 1) WHERE "author_id" IS NULL;
