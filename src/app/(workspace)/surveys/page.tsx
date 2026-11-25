import { asc, eq } from "drizzle-orm";
import { CopyLinkButton } from "@/components/copy-link-button";
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

  return (
    <>
      <div className="page-heading"><div><h1>Questionari</h1><p>Crea un questionario, definisci le domande e condividi il link pubblico.</p></div></div>
      {params.created ? <p className="notice is-success" role="status">Questionario creato. Ora puoi aggiungere le domande.</p> : null}
      {params.error ? <p className="notice" role="alert">Non è stato possibile completare l’operazione. Controlla i campi e riprova.</p> : null}
      <div className="form-layout">
        <section className="form-section">
          <h2>I tuoi questionari</h2><p>Un link pubblico per ogni questionario attivo. Le risposte sono anonime.</p>
          {surveyRows.length ? <div className="list-stack">{surveyRows.map((survey) => <article className="list-row" key={survey.id}>
            <div><h3>{survey.title}</h3><p>{survey.description || "Nessuna descrizione"}</p></div>
            <span className={`status-chip ${survey.status === "active" ? "is-active" : "is-draft"}`}>{survey.status === "active" ? "Attivo" : "Bozza"}</span>
            <div className="list-row-actions">
              {survey.status === "active" ? <CopyLinkButton href={`/s/${survey.publicId}`} /> : null}
              <a className="button button-small button-quiet" href={`/surveys?survey=${survey.id}`}>Modifica</a>
              <form action={toggleSurveyStatusAction}><input type="hidden" name="surveyId" value={survey.id} /><button className="button button-small button-secondary" type="submit">{survey.status === "active" ? "Metti in bozza" : "Pubblica"}</button></form>
            </div>
          </article>)}</div> : <div className="empty-panel"><strong>Ancora nessun questionario</strong>Creane uno per raccogliere il primo feedback.</div>}
          <form className="field-stack create-survey-form" action={createSurveyAction}>
            <div className="field"><label htmlFor="survey-title">Nuovo questionario</label><input id="survey-title" name="title" required minLength={2} maxLength={120} placeholder="es. Dopo il servizio" /></div>
            <div className="field"><label htmlFor="survey-description">Descrizione per il cliente</label><textarea id="survey-description" name="description" maxLength={500} placeholder="Spiega in breve perché chiedi un feedback" /></div>
            <button className="button" type="submit">Crea questionario</button>
          </form>
        </section>

        <section className="form-section">
          <h2>{selectedSurvey ? `Domande · ${selectedSurvey.title}` : "Domande"}</h2>
          <p>Scale numeriche, scelte singole e commenti. Le domande a scelta possono creare confronti per segmento.</p>
          {selectedSurvey ? <>
            {questions.length ? <ol className="question-list">{questions.map((question, index) => <li className="question-row" key={question.id}><span className="question-number">{String(index + 1).padStart(2, "0")}</span><div><strong>{question.prompt}</strong><p>{question.kind === "scale" ? `Scala ${String(question.config.min ?? 1)}–${String(question.config.max ?? 5)} · ${question.metric === "none" ? "nessuna metrica" : question.metric.toUpperCase()}` : question.kind === "choice" ? `Scelta singola${question.isSegment ? " · segmento" : ""}` : "Commento"}</p></div><span className="question-required">{question.required ? "Obbligatoria" : "Facoltativa"}</span></li>)}</ol> : <div className="empty-panel"><strong>Costruisci il tuo questionario</strong>Aggiungi una domanda qui sotto; potrai pubblicare quando sarà pronta.</div>}
            {selectedSurvey.status === "draft" ? <form className="field-stack question-form" action={addQuestionAction}>
              <input type="hidden" name="surveyId" value={selectedSurvey.id} />
              <div className="field"><label htmlFor="prompt">Testo della domanda</label><input id="prompt" name="prompt" required minLength={3} maxLength={240} placeholder="es. Quanto sei soddisfatto del servizio?" /></div>
              <div className="field-inline"><div className="field"><label htmlFor="kind">Tipo</label><select id="kind" name="kind" defaultValue="scale"><option value="scale">Scala numerica</option><option value="choice">Scelta singola</option><option value="text">Commento</option></select></div><div className="field"><label htmlFor="metric">Metrica</label><select id="metric" name="metric" defaultValue="none"><option value="none">Nessuna</option><option value="score">Punteggio</option><option value="csat">CSAT 1–5</option><option value="nps">NPS 0–10</option></select></div></div>
              <div className="field-inline"><div className="field"><label htmlFor="min">Valore minimo</label><input id="min" name="min" type="number" min={0} max={100} placeholder="predefinito" /></div><div className="field"><label htmlFor="max">Valore massimo</label><input id="max" name="max" type="number" min={1} max={100} placeholder="predefinito" /></div></div>
              <div className="field"><label htmlFor="options">Opzioni (una per riga)</label><textarea id="options" name="options" maxLength={1000} placeholder={"es.\nNegozio\nOnline"} /><small>Usate solo per il tipo “Scelta singola”. Almeno due opzioni.</small></div>
              <label className="check-field"><input name="required" type="checkbox" defaultChecked />Risposta obbligatoria</label>
              <label className="check-field"><input name="isSegment" type="checkbox" />Usa le opzioni come segmento per i report (solo scelta singola)</label>
              <button className="button" type="submit">Aggiungi domanda</button>
            </form> : <p className="notice">Il questionario è attivo. Mettilo in bozza per modificare le domande.</p>}
          </> : <div className="empty-panel"><strong>Crea prima un questionario</strong>Le domande verranno associate a quel questionario.</div>}
        </section>
      </div>
    </>
  );
}
