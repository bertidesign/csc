import { relations } from "drizzle-orm";
import {
  boolean,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
  unique,
  uuid,
} from "drizzle-orm/pg-core";

export const surveyStatus = pgEnum("survey_status", ["draft", "active", "archived"]);
export const questionKind = pgEnum("question_kind", ["scale", "choice", "text"]);
export const questionMetric = pgEnum("question_metric", ["none", "score", "csat", "nps"]);

export const tenants = pgTable(
  "tenants",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    slug: text("slug").notNull(),
    name: text("name").notNull(),
    clerkOrganizationId: text("clerk_organization_id").notNull(),
    logoUrl: text("logo_url"),
    brandColor: text("brand_color").notNull().default("#103B4A"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    unique("tenants_slug_unique").on(table.slug),
    unique("tenants_clerk_organization_unique").on(table.clerkOrganizationId),
  ],
);

export const surveys = pgTable(
  "surveys",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    publicId: uuid("public_id").defaultRandom().notNull().unique(),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    description: text("description").notNull().default(""),
    status: surveyStatus("status").notNull().default("draft"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index("surveys_tenant_status_idx").on(table.tenantId, table.status)],
);

export const surveyQuestions = pgTable(
  "survey_questions",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    surveyId: uuid("survey_id")
      .notNull()
      .references(() => surveys.id, { onDelete: "cascade" }),
    position: integer("position").notNull(),
    prompt: text("prompt").notNull(),
    kind: questionKind("kind").notNull(),
    metric: questionMetric("metric").notNull().default("none"),
    required: boolean("required").notNull().default(true),
    isSegment: boolean("is_segment").notNull().default(false),
    config: jsonb("config").$type<Record<string, unknown>>().notNull().default({}),
  },
  (table) => [
    index("survey_questions_survey_position_idx").on(table.surveyId, table.position),
    unique("survey_questions_survey_position_unique").on(table.surveyId, table.position),
  ],
);

export const responses = pgTable(
  "responses",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    surveyId: uuid("survey_id")
      .notNull()
      .references(() => surveys.id, { onDelete: "cascade" }),
    submittedAt: timestamp("submitted_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index("responses_survey_submitted_idx").on(table.surveyId, table.submittedAt)],
);

export const responseAnswers = pgTable(
  "response_answers",
  {
    responseId: uuid("response_id")
      .notNull()
      .references(() => responses.id, { onDelete: "cascade" }),
    questionId: uuid("question_id")
      .notNull()
      .references(() => surveyQuestions.id, { onDelete: "cascade" }),
    textValue: text("text_value"),
    numericValue: integer("numeric_value"),
  },
  (table) => [
    unique("response_answers_response_question_unique").on(table.responseId, table.questionId),
    index("response_answers_question_numeric_idx").on(table.questionId, table.numericValue),
  ],
);

export const tenantsRelations = relations(tenants, ({ many }) => ({ surveys: many(surveys) }));
export const surveysRelations = relations(surveys, ({ one, many }) => ({
  tenant: one(tenants, { fields: [surveys.tenantId], references: [tenants.id] }),
  questions: many(surveyQuestions),
  responses: many(responses),
}));
export const surveyQuestionsRelations = relations(surveyQuestions, ({ one, many }) => ({
  survey: one(surveys, { fields: [surveyQuestions.surveyId], references: [surveys.id] }),
  answers: many(responseAnswers),
}));
export const responsesRelations = relations(responses, ({ one, many }) => ({
  survey: one(surveys, { fields: [responses.surveyId], references: [surveys.id] }),
  answers: many(responseAnswers),
}));
export const responseAnswersRelations = relations(responseAnswers, ({ one }) => ({
  response: one(responses, { fields: [responseAnswers.responseId], references: [responses.id] }),
  question: one(surveyQuestions, { fields: [responseAnswers.questionId], references: [surveyQuestions.id] }),
}));
