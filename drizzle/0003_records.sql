CREATE TYPE "public"."record_event_kind" AS ENUM('created', 'updated', 'transition', 'assessment', 'archived');--> statement-breakpoint
CREATE TABLE "deadlines" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organisation_id" uuid NOT NULL,
	"record_id" uuid NOT NULL,
	"tool_slug" text NOT NULL,
	"kind" text NOT NULL,
	"due_at" timestamp with time zone NOT NULL,
	"done_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "record_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"record_id" uuid NOT NULL,
	"user_id" uuid,
	"kind" "record_event_kind" NOT NULL,
	"changes" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"from_state" text,
	"to_state" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "records" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organisation_id" uuid NOT NULL,
	"tool_slug" text NOT NULL,
	"definition_version" integer NOT NULL,
	"state" text,
	"title" text NOT NULL,
	"data" jsonb NOT NULL,
	"version" integer DEFAULT 1 NOT NULL,
	"created_by" uuid,
	"updated_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"archived_at" timestamp with time zone
);
--> statement-breakpoint
ALTER TABLE "deadlines" ADD CONSTRAINT "deadlines_organisation_id_organisations_id_fk" FOREIGN KEY ("organisation_id") REFERENCES "public"."organisations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "deadlines" ADD CONSTRAINT "deadlines_record_id_records_id_fk" FOREIGN KEY ("record_id") REFERENCES "public"."records"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "record_events" ADD CONSTRAINT "record_events_record_id_records_id_fk" FOREIGN KEY ("record_id") REFERENCES "public"."records"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "record_events" ADD CONSTRAINT "record_events_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "records" ADD CONSTRAINT "records_organisation_id_organisations_id_fk" FOREIGN KEY ("organisation_id") REFERENCES "public"."organisations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "records" ADD CONSTRAINT "records_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "records" ADD CONSTRAINT "records_updated_by_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "deadlines_org_due_idx" ON "deadlines" USING btree ("organisation_id","done_at","due_at");--> statement-breakpoint
CREATE INDEX "record_events_record_idx" ON "record_events" USING btree ("record_id","created_at");--> statement-breakpoint
CREATE INDEX "records_org_tool_idx" ON "records" USING btree ("organisation_id","tool_slug","updated_at");