import { desc, eq, inArray } from "drizzle-orm";
import { getDb } from "@/db";
import { responseAnswers, responses, surveyQuestions, surveys } from "@/db/schema";
import { requireTenantContext } from "@/lib/auth";

export default async function ResponsesPage() {
  const { tenant } = await requireTenantContext();
  const db = getDb();
  const rows = await db.select({ responseId: responses.id, submittedAt: responses.submittedAt, surveyId: surveys.id, surveyTitle: surveys.title })
    .from(responses).innerJoin(surveys, eq(responses.surveyId, surveys.id))
    .where(eq(surveys.tenantId, tenant.id)).orderBy(desc(responses.submittedAt)).limit(200);
  const responseIds = rows.map(({ responseId }) => responseId);
  const answers = responseIds.length ? await db.select({ responseId: responseAnswers.responseId, prompt: surveyQuestions.prompt, kind: surveyQuestions.kind, textValue: responseAnswers.textValue, numericValue: responseAnswers.numericValue })
    .from(responseAnswers).innerJoin(surveyQuestions, eq(responseAnswers.questionId, surveyQuestions.id))
    .where(inArray(responseAnswers.responseId, responseIds)).orderBy(surveyQuestions.position) : [];
  const grouped = new Map<string, typeof answers>();
  for (const answer of answers) grouped.set(answer.responseId, [...(grouped.get(answer.responseId) ?? []), answer]);

  return <>
    <div className="page-heading"><div><h1>Risposte</h1><p>Le risposte sono anonime. Mostriamo fino alle 200 più recenti.</p></div></div>
    {rows.length ? <div className="response-list">{rows.map((row) => <article className="panel response-card" key={row.responseId}>
      <div className="response-card-heading"><div><h2>{row.surveyTitle}</h2><p>{new Intl.DateTimeFormat("it-IT", { dateStyle: "medium", timeStyle: "short", timeZone: "Europe/Rome" }).format(row.submittedAt)}</p></div><span className="status-chip">Anonima</span></div>
      <dl className="answer-list">{(grouped.get(row.responseId) ?? []).map((answer) => <div className="answer-row" key={`${row.responseId}-${answer.prompt}`}><dt>{answer.prompt}</dt><dd>{answer.kind === "scale" ? answer.numericValue : answer.textValue || "—"}</dd></div>)}</dl>
    </article>)}</div> : <div className="empty-panel"><strong>Nessuna risposta ancora</strong>Quando un cliente compilerà un questionario attivo, troverai qui le sue risposte anonime.</div>}
  </>;
}
