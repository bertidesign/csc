"use server";

import { and, count, eq, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { getDb } from "@/db";
import { surveyQuestions, surveys } from "@/db/schema";
import { requireTenantContext } from "@/lib/auth";

const surveyInput = z.object({
  title: z.string().trim().min(2).max(120),
  description: z.string().trim().max(500),
});

const questionInput = z.object({
  surveyId: z.string().uuid(),
  prompt: z.string().trim().min(3).max(240),
  kind: z.enum(["scale", "choice", "text"]),
  metric: z.enum(["none", "score", "csat", "nps"]),
  min: z.number().int().min(0).max(100),
  max: z.number().int().min(1).max(100),
  options: z.string().max(1000),
  required: z.boolean(),
  isSegment: z.boolean(),
});

export async function createSurveyAction(formData: FormData) {
  const { tenant } = await requireTenantContext();
  const parsed = surveyInput.safeParse({
    title: formData.get("title"),
    description: formData.get("description") ?? "",
  });
  if (!parsed.success) redirect("/surveys?error=survey");

  const [survey] = await getDb().insert(surveys).values({
    tenantId: tenant.id,
    title: parsed.data.title,
    description: parsed.data.description,
  }).returning({ id: surveys.id });

  revalidatePath("/surveys");
  redirect(`/surveys?created=1&survey=${survey.id}`);
}

export async function addQuestionAction(formData: FormData) {
  const { tenant } = await requireTenantContext();
  const requestedSurveyId = z.string().uuid().safeParse(formData.get("surveyId"));
  const errorUrl = requestedSurveyId.success
    ? `/surveys?survey=${requestedSurveyId.data}&error=`
    : "/surveys?error=";
  const kind = formData.get("kind");
  const rawMin = formData.get("min");
  const rawMax = formData.get("max");
  const parsed = questionInput.safeParse({
    surveyId: formData.get("surveyId"),
    prompt: formData.get("prompt"),
    kind,
    metric: formData.get("metric") ?? "none",
    min: Number(rawMin || (formData.get("metric") === "nps" ? 0 : 1)),
    max: Number(rawMax || (formData.get("metric") === "nps" ? 10 : 5)),
    options: formData.get("options") ?? "",
    required: formData.get("required") === "on",
    isSegment: formData.get("isSegment") === "on",
  });

  if (!parsed.success) redirect(`${errorUrl}question`);
  const input = parsed.data;
  if ((input.kind === "scale" && input.max <= input.min) ||
      (input.metric === "score" && input.kind !== "scale") ||
      (input.metric === "nps" && (input.kind !== "scale" || input.min !== 0 || input.max !== 10)) ||
      (input.metric === "csat" && (input.kind !== "scale" || input.min !== 1 || input.max !== 5)) ||
      (input.isSegment && input.kind !== "choice")) {
    redirect(`${errorUrl}question-config`);
  }

  const options = input.kind === "choice"
    ? [...new Set(input.options.split("\n").map((option) => option.trim()).filter(Boolean))]
    : [];
  if (input.kind === "choice" && (options.length < 2 || options.length > 20)) {
    redirect(`${errorUrl}question-options`);
  }

  const db = getDb();
  const [survey] = await db
    .select({ id: surveys.id, status: surveys.status })
    .from(surveys)
    .where(and(eq(surveys.id, input.surveyId), eq(surveys.tenantId, tenant.id)))
    .limit(1);
  if (!survey) redirect(`${errorUrl}survey-not-found`);
  if (survey.status !== "draft") redirect(`/surveys?survey=${survey.id}&error=active-survey`);

  const [position] = await db
    .select({ value: sql<number>`coalesce(max(${surveyQuestions.position}), 0)` })
    .from(surveyQuestions)
    .where(eq(surveyQuestions.surveyId, survey.id));

  await db.insert(surveyQuestions).values({
    surveyId: survey.id,
    position: position.value + 1,
    prompt: input.prompt,
    kind: input.kind,
    metric: input.metric,
    required: input.required,
    isSegment: input.isSegment,
    config: input.kind === "scale"
      ? { min: input.min, max: input.max }
      : input.kind === "choice"
        ? { options }
        : { maxLength: 2000 },
  });

  revalidatePath("/surveys");
  redirect(`/surveys?survey=${survey.id}`);
}

export async function toggleSurveyStatusAction(formData: FormData) {
  const { tenant } = await requireTenantContext();
  const surveyId = z.string().uuid().safeParse(formData.get("surveyId"));
  if (!surveyId.success) redirect("/surveys?error=survey");

  const db = getDb();
  const [survey] = await db
    .select({ id: surveys.id, status: surveys.status })
    .from(surveys)
    .where(and(eq(surveys.id, surveyId.data), eq(surveys.tenantId, tenant.id)))
    .limit(1);
  if (!survey) redirect("/surveys?error=survey-not-found");

  const [questionCount] = await db
    .select({ value: count() })
    .from(surveyQuestions)
    .where(eq(surveyQuestions.surveyId, survey.id));

  const nextStatus = survey.status === "active" ? "draft" : "active";
  if (nextStatus === "active" && questionCount.value === 0) {
    redirect(`/surveys?survey=${survey.id}&error=no-questions`);
  }

  await db
    .update(surveys)
    .set({ status: nextStatus, updatedAt: new Date() })
    .where(and(eq(surveys.id, survey.id), eq(surveys.tenantId, tenant.id)));

  revalidatePath("/surveys");
  redirect(`/surveys?survey=${survey.id}`);
}
