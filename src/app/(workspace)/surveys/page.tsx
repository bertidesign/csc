import { asc, eq } from "drizzle-orm";
import Link from "next/link";
import { CopyLinkButton } from "@/components/copy-link-button";
import { QuestionForm } from "@/components/question-form";
import { getDb } from "@/db";
import { surveyQuestions, surveys } from "@/db/schema";
import { requireTenantContext } from "@/lib/auth";
import { addQuestionAction, createSurveyAction, toggleSurveyStatusAction } from "@/app/surveys/actions";

type SearchParams = Promise<{ survey?: string; created?: string; error?: string }>;

export default async function SurveysPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const { tenant } = await requireTenantContext();
  const db = getDb();
  const surveyRows = await db.select().from(surveys).where(eq(surveys.tenantId, tenant.id)).orderBy(asc(surveys.createdAt));
  const selectedSurvey = surveyRows.find((row) => row.id === params.survey) ?? surveyRows[0];
  const questions = selectedSurvey
    ? await db.select().from(surveyQuestions).where(eq(surveyQuestions.surveyId, selectedSurvey.id)).orderBy(asc(surveyQuestions.position))
    : [];
  const errorMessage = params.error === "no-questions"
    ? "Aggiungi almeno una domanda prima di pubblicare."
    : params.error === "question-options"
      ? "Inserisci almeno due opzioni, una per riga."
      : params.error
        ? "Non è stato possibile salvare. Controlla i campi e riprova."
        : null;

  return <>
    <div className="page-heading"><div><h1>Questionari</h1><p>Crea un questionario, aggiungi le domande e condividi il link.</p></div></div>
    {params.created ? <p className="notice is-success" role="status">Questionario creato. Aggiungi la prima domanda qui sotto.</p> : null}
    {errorMessage ? <p className="notice" role="alert">{errorMessage}</p> : null}
    <div className={`form-layout${selectedSurvey ? "" : " is-single"}`}>
      <section className="form-section">
        <h2>I tuoi questionari</h2>
        {surveyRows.length ? <div className="list-stack">{surveyRows.map((survey) => <article className="list-row" key={survey.id}>
          <div><h3>{survey.title}</h3><p>{survey.description || "Nessuna descrizione"}</p></div>
          <span className={`status-chip ${survey.status === "active" ? "is-active" : "is-draft"}`}>{survey.status === "active" ? "Pubblicato" : "Bozza"}</span>
          <div className="list-row-actions"><Link className="button button-small button-quiet" href={`/surveys?survey=${survey.id}`}>{selectedSurvey?.id === survey.id ? "Aperto" : "Apri"}</Link></div>
        </article>)}</div> : <p className="section-intro">Il questionario è il modulo che i tuoi clienti compileranno.</p>}
        <details className="create-survey-form" open={surveyRows.length === 0}>
          <summary>{surveyRows.length ? "Crea un altro questionario" : "Crea il primo questionario"}</summary>
          <form className="field-stack details-content" action={createSurveyAction}>
            <div className="field"><label htmlFor="survey-title">Nome del questionario</label><input id="survey-title" name="title" required minLength={2} maxLength={120} placeholder="es. Dopo il servizio" /></div>
            <div className="field"><label htmlFor="survey-description">Introduzione <span>(facoltativa)</span></label><textarea id="survey-description" name="description" maxLength={500} placeholder="Spiega in breve perché chiedi un feedback" /></div>
            <button className="button" type="submit">Crea questionario</button>
          </form>
        </details>
      </section>

      {selectedSurvey ? <section className="form-section">
        <div className="survey-heading"><div><h2>{selectedSurvey.title}</h2><p>{questions.length ? `${questions.length} ${questions.length === 1 ? "domanda" : "domande"}` : "Aggiungi la prima domanda per iniziare."}</p></div>
          {selectedSurvey.status === "active" ? <span className="status-chip is-active">Pubblicato</span> : <span className="status-chip is-draft">Bozza</span>}
        </div>
        {questions.length ? <ol className="question-list">{questions.map((question, index) => <li className="question-row" key={question.id}><span className="question-number">{index + 1}</span><div><strong>{question.prompt}</strong><p>{question.kind === "scale" ? `Scala ${String(question.config.min ?? 1)}–${String(question.config.max ?? 5)}` : question.kind === "choice" ? `Scelta${question.isSegment ? " · confronto per risposta" : ""}` : "Commento"}</p></div><span className="question-required">{question.required ? "Obbligatoria" : "Facoltativa"}</span></li>)}</ol> : null}
        {selectedSurvey.status === "draft" ? <details className="question-form-wrap" open={questions.length === 0}>
          <summary>{questions.length ? "Aggiungi una domanda" : "Crea la prima domanda"}</summary>
          <QuestionForm surveyId={selectedSurvey.id} action={addQuestionAction} />
        </details> : <p className="notice">Per cambiare le domande, rimetti il questionario in bozza.</p>}
        <div className="survey-actions">
          {selectedSurvey.status === "active" ? <CopyLinkButton href={`/s/${selectedSurvey.publicId}`} /> : null}
          <form action={toggleSurveyStatusAction}><input type="hidden" name="surveyId" value={selectedSurvey.id} /><button className="button button-small button-secondary" type="submit">{selectedSurvey.status === "active" ? "Metti in bozza" : "Pubblica questionario"}</button></form>
        </div>
        {selectedSurvey.status === "draft" && questions.length === 0 ? <p className="form-hint">Il questionario è privato finché non lo pubblichi.</p> : null}
      </section> : null}
    </div>
  </>;
}
