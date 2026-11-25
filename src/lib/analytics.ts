import "server-only";

import { and, count, eq, gte, sql } from "drizzle-orm";
import { getDb } from "@/db";
import { responseAnswers, responses, surveyQuestions, surveys } from "@/db/schema";

type SegmentRow = {
  prompt: string;
  segment: string | null;
  response_count: number | string;
  csat_average: number | string | null;
  nps: number | string | null;
};

export async function getTenantDashboard(
  tenantId: string,
  rangeDays: 7 | 30 | 90,
  requestedSurveyId?: string,
) {
  const db = getDb();
  const tenantSurveys = await db
    .select({ id: surveys.id, title: surveys.title, status: surveys.status })
    .from(surveys)
    .where(eq(surveys.tenantId, tenantId))
    .orderBy(surveys.createdAt);

  const surveyId = tenantSurveys.some((survey) => survey.id === requestedSurveyId)
    ? requestedSurveyId
    : undefined;
  const surveyFilter = surveyId ? eq(surveys.id, surveyId) : undefined;
  const since = new Date(Date.now() - rangeDays * 24 * 60 * 60 * 1000);
  const whereRecent = and(eq(surveys.tenantId, tenantId), gte(responses.submittedAt, since), surveyFilter);

  const [activeSurveyCount] = await db
    .select({ value: count() })
    .from(surveys)
    .where(and(eq(surveys.tenantId, tenantId), eq(surveys.status, "active")));

  const [responseCount] = await db
    .select({ value: count() })
    .from(responses)
    .innerJoin(surveys, eq(responses.surveyId, surveys.id))
    .where(whereRecent);

  const [scoreRows] = await db
    .select({
      csatAverage: sql<number | string | null>`avg(${responseAnswers.numericValue}) filter (where ${surveyQuestions.metric} = 'csat')`,
      csatCount: sql<number | string>`count(*) filter (where ${surveyQuestions.metric} = 'csat')`,
      npsPromoters: sql<number | string>`count(*) filter (where ${surveyQuestions.metric} = 'nps' and ${responseAnswers.numericValue} >= 9)`,
      npsDetractors: sql<number | string>`count(*) filter (where ${surveyQuestions.metric} = 'nps' and ${responseAnswers.numericValue} <= 6)`,
      npsCount: sql<number | string>`count(*) filter (where ${surveyQuestions.metric} = 'nps')`,
    })
    .from(responseAnswers)
    .innerJoin(responses, eq(responseAnswers.responseId, responses.id))
    .innerJoin(surveyQuestions, eq(responseAnswers.questionId, surveyQuestions.id))
    .innerJoin(surveys, eq(surveyQuestions.surveyId, surveys.id))
    .where(whereRecent);

  const customScores = await db
    .select({
      prompt: surveyQuestions.prompt,
      average: sql<number | string>`avg(${responseAnswers.numericValue})`,
      answerCount: count(responseAnswers.questionId),
    })
    .from(responseAnswers)
    .innerJoin(responses, eq(responseAnswers.responseId, responses.id))
    .innerJoin(surveyQuestions, eq(responseAnswers.questionId, surveyQuestions.id))
    .innerJoin(surveys, eq(surveyQuestions.surveyId, surveys.id))
    .where(and(whereRecent, eq(surveyQuestions.metric, "score")))
    .groupBy(surveyQuestions.id, surveyQuestions.prompt)
    .orderBy(surveyQuestions.prompt);

  const trendRows = await db
    .select({
      day: sql<string>`to_char(${responses.submittedAt} at time zone 'Europe/Rome', 'YYYY-MM-DD')`,
      value: count(),
    })
    .from(responses)
    .innerJoin(surveys, eq(responses.surveyId, surveys.id))
    .where(whereRecent)
    .groupBy(sql`date_trunc('day', ${responses.submittedAt} at time zone 'Europe/Rome')`)
    .orderBy(sql`date_trunc('day', ${responses.submittedAt} at time zone 'Europe/Rome')`);

  const segmentResults = await db.execute<SegmentRow>(sql`
    select
      segment_question.prompt,
      segment_answer.text_value as segment,
      count(distinct segment_answer.response_id)::int as response_count,
      avg(score_answer.numeric_value) filter (where score_question.metric = 'csat') as csat_average,
      case
        when count(*) filter (where score_question.metric = 'nps') = 0 then null
        else round(100.0 * (
          count(*) filter (where score_question.metric = 'nps' and score_answer.numeric_value >= 9) -
          count(*) filter (where score_question.metric = 'nps' and score_answer.numeric_value <= 6)
        ) / nullif(count(*) filter (where score_question.metric = 'nps'), 0), 1)
      end as nps
    from response_answers as segment_answer
    inner join survey_questions as segment_question
      on segment_question.id = segment_answer.question_id
    inner join responses as response
      on response.id = segment_answer.response_id
    inner join surveys as survey
      on survey.id = response.survey_id
    left join response_answers as score_answer
      on score_answer.response_id = segment_answer.response_id
      and score_answer.question_id <> segment_question.id
    left join survey_questions as score_question
      on score_question.id = score_answer.question_id
    where survey.tenant_id = ${tenantId}
      and segment_question.is_segment = true
      and segment_question.kind = 'choice'
      and response.submitted_at >= ${since}
      and (${surveyId ?? null}::uuid is null or survey.id = ${surveyId ?? null}::uuid)
    group by segment_question.id, segment_question.prompt, segment_answer.text_value
    order by segment_question.prompt, response_count desc
    limit 60
  `);

  const npsCount = Number(scoreRows.npsCount ?? 0);
  const csatCount = Number(scoreRows.csatCount ?? 0);
  const nps = npsCount
    ? Math.round(((Number(scoreRows.npsPromoters) - Number(scoreRows.npsDetractors)) / npsCount) * 100)
    : null;

  return {
    surveys: tenantSurveys,
    selectedSurveyId: surveyId ?? "",
    rangeDays,
    activeSurveyCount: activeSurveyCount.value,
    responseCount: responseCount.value,
    csatAverage: csatCount ? Number(Number(scoreRows.csatAverage).toFixed(1)) : null,
    nps,
    trend: trendRows.map((row) => ({ day: row.day, value: row.value })),
    customScores: customScores.map((row) => ({
      prompt: row.prompt,
      average: Number(Number(row.average).toFixed(1)),
      answerCount: row.answerCount,
    })),
    segments: segmentResults.rows.map((row) => ({
      prompt: row.prompt,
      segment: row.segment ?? "Senza risposta",
      responseCount: Number(row.response_count),
      csatAverage: row.csat_average === null ? null : Number(Number(row.csat_average).toFixed(1)),
      nps: row.nps === null ? null : Number(row.nps),
    })),
  };
}
