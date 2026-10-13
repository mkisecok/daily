CREATE TYPE "public"."feed_region" AS ENUM('eu', 'de', 'land');--> statement-breakpoint
CREATE TYPE "public"."feed_source_kind" AS ENUM('rss', 'html');--> statement-breakpoint
CREATE TABLE "bookmarks" (
	"user_id" uuid NOT NULL,
	"item_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "bookmarks_user_id_item_id_pk" PRIMARY KEY("user_id","item_id")
);
--> statement-breakpoint
CREATE TABLE "feed_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"source_id" uuid NOT NULL,
	"url" text NOT NULL,
	"url_hash" text NOT NULL,
	"title" text NOT NULL,
	"excerpt" text,
	"published_at" timestamp with time zone NOT NULL,
	"fetched_at" timestamp with time zone DEFAULT now() NOT NULL,
	"lang" text DEFAULT 'de' NOT NULL,
	"tags" text[] DEFAULT '{}' NOT NULL,
	CONSTRAINT "feed_items_url_hash_unique" UNIQUE("url_hash")
);
--> statement-breakpoint
CREATE TABLE "feed_sources" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" text NOT NULL,
	"name" text NOT NULL,
	"kind" "feed_source_kind" NOT NULL,
	"url" text NOT NULL,
	"region" "feed_region" NOT NULL,
	"tier" integer DEFAULT 1 NOT NULL,
	"lang" text DEFAULT 'de' NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"last_fetched_at" timestamp with time zone,
	"last_item_at" timestamp with time zone,
	"last_error" text,
	"failure_count" integer DEFAULT 0 NOT NULL,
	CONSTRAINT "feed_sources_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
ALTER TABLE "bookmarks" ADD CONSTRAINT "bookmarks_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bookmarks" ADD CONSTRAINT "bookmarks_item_id_feed_items_id_fk" FOREIGN KEY ("item_id") REFERENCES "public"."feed_items"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "feed_items" ADD CONSTRAINT "feed_items_source_id_feed_sources_id_fk" FOREIGN KEY ("source_id") REFERENCES "public"."feed_sources"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "feed_items_published_idx" ON "feed_items" USING btree ("published_at");--> statement-breakpoint
CREATE INDEX "feed_items_tags_idx" ON "feed_items" USING gin ("tags");