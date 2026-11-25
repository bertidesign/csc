CREATE TYPE "public"."question_kind" AS ENUM('scale', 'choice', 'text');--> statement-breakpoint
CREATE TYPE "public"."question_metric" AS ENUM('none', 'score', 'csat', 'nps');--> statement-breakpoint
CREATE TYPE "public"."survey_status" AS ENUM('draft', 'active', 'archived');--> statement-breakpoint
CREATE TABLE "response_answers" (
	"response_id" uuid NOT NULL,
	"question_id" uuid NOT NULL,
	"text_value" text,
	"numeric_value" integer,
	CONSTRAINT "response_answers_response_question_unique" UNIQUE("response_id","question_id")
);
--> statement-breakpoint
CREATE TABLE "responses" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"survey_id" uuid NOT NULL,
	"submitted_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "survey_questions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"survey_id" uuid NOT NULL,
	"position" integer NOT NULL,
	"prompt" text NOT NULL,
	"kind" "question_kind" NOT NULL,
	"metric" "question_metric" DEFAULT 'none' NOT NULL,
	"required" boolean DEFAULT true NOT NULL,
	"is_segment" boolean DEFAULT false NOT NULL,
	"config" jsonb DEFAULT '{}'::jsonb NOT NULL,
	CONSTRAINT "survey_questions_survey_position_unique" UNIQUE("survey_id","position")
);
--> statement-breakpoint
CREATE TABLE "surveys" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"public_id" uuid DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"title" text NOT NULL,
	"description" text DEFAULT '' NOT NULL,
	"status" "survey_status" DEFAULT 'draft' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "surveys_public_id_unique" UNIQUE("public_id")
);
--> statement-breakpoint
CREATE TABLE "tenants" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" text NOT NULL,
	"name" text NOT NULL,
	"clerk_organization_id" text NOT NULL,
	"logo_url" text,
	"brand_color" text DEFAULT '#103B4A' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "tenants_slug_unique" UNIQUE("slug"),
	CONSTRAINT "tenants_clerk_organization_unique" UNIQUE("clerk_organization_id")
);
--> statement-breakpoint
ALTER TABLE "response_answers" ADD CONSTRAINT "response_answers_response_id_responses_id_fk" FOREIGN KEY ("response_id") REFERENCES "public"."responses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "response_answers" ADD CONSTRAINT "response_answers_question_id_survey_questions_id_fk" FOREIGN KEY ("question_id") REFERENCES "public"."survey_questions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "responses" ADD CONSTRAINT "responses_survey_id_surveys_id_fk" FOREIGN KEY ("survey_id") REFERENCES "public"."surveys"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "survey_questions" ADD CONSTRAINT "survey_questions_survey_id_surveys_id_fk" FOREIGN KEY ("survey_id") REFERENCES "public"."surveys"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "surveys" ADD CONSTRAINT "surveys_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "response_answers_question_numeric_idx" ON "response_answers" USING btree ("question_id","numeric_value");--> statement-breakpoint
CREATE INDEX "responses_survey_submitted_idx" ON "responses" USING btree ("survey_id","submitted_at");--> statement-breakpoint
CREATE INDEX "survey_questions_survey_position_idx" ON "survey_questions" USING btree ("survey_id","position");--> statement-breakpoint
CREATE INDEX "surveys_tenant_status_idx" ON "surveys" USING btree ("tenant_id","status");