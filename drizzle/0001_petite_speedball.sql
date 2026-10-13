CREATE TYPE "public"."tool_shape" AS ENUM('questionnaire', 'register', 'workflow');--> statement-breakpoint
CREATE TABLE "tool_runs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organisation_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"tool_slug" text NOT NULL,
	"shape" "tool_shape" NOT NULL,
	"catalog_version" integer NOT NULL,
	"input" jsonb NOT NULL,
	"result" jsonb NOT NULL,
	"verdict" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "tool_runs" ADD CONSTRAINT "tool_runs_organisation_id_organisations_id_fk" FOREIGN KEY ("organisation_id") REFERENCES "public"."organisations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tool_runs" ADD CONSTRAINT "tool_runs_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "tool_runs_org_tool_idx" ON "tool_runs" USING btree ("organisation_id","tool_slug","created_at");