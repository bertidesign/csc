"use server";

import { and, eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { randomUUID } from "node:crypto";
import { getDb } from "@/db";
import { responseAnswers, responses, surveyQuestions, surveys } from "@/db/schema";

type AnswerRow = {
  responseId: string;
  questionId: string;
  textValue?: string | null;
  numericValue?: number | null;
};

export async function submitSurveyResponse(formData: FormData) {
  const publicId = formData.get("publicId");
  if (typeof publicId !== "string" || !/^[0-9a-f-]{36}$/i.test(publicId)) {
    redirect("/s/non-disponibile?error=invalid");
  }

  const db = getDb();
  const [survey] = await db
    .select({ id: surveys.id, publicId: surveys.publicId })
    .from(surveys)
    .where(and(eq(surveys.publicId, publicId), eq(surveys.status, "active")))
    .limit(1);
  if (!survey) redirect(`/s/${publicId}?error=closed`);

  const questions = await db
    .select()
    .from(surveyQuestions)
    .where(eq(surveyQuestions.surveyId, survey.id))
    .orderBy(surveyQuestions.position);

  const responseId = randomUUID();
  const answerRows: AnswerRow[] = [];

  for (const question of questions) {
    const raw = formData.get(`q_${question.id}`);
    const value = typeof raw === "string" ? raw.trim() : "";
    if (!value) {
      if (question.required) redirect(`/s/${survey.publicId}?error=required`);
      continue;
    }

    if (question.kind === "scale") {
      const min = Number(question.config.min ?? 1);
      const max = Number(question.config.max ?? 5);
      const numericValue = Number(value);
      if (!Number.isInteger(numericValue) || numericValue < min || numericValue > max) {
        redirect(`/s/${survey.publicId}?error=invalid-answer`);
      }
      answerRows.push({ responseId, questionId: question.id, numericValue });
      continue;
    }

    if (question.kind === "choice") {
      const options = Array.isArray(question.config.options)
        ? question.config.options.filter((option): option is string => typeof option === "string")
        : [];
      if (!options.includes(value)) redirect(`/s/${survey.publicId}?error=invalid-answer`);
      answerRows.push({ responseId, questionId: question.id, textValue: value });
      continue;
    }

    if (value.length > 2000) redirect(`/s/${survey.publicId}?error=invalid-answer`);
    answerRows.push({ responseId, questionId: question.id, textValue: value });
  }

  if (answerRows.length === 0) redirect(`/s/${survey.publicId}?error=required`);

  await db.batch([
    db.insert(responses).values({ id: responseId, surveyId: survey.id }),
    db.insert(responseAnswers).values(answerRows),
  ]);

  redirect(`/s/${survey.publicId}?sent=1`);
}
