import { asc, eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { getDb } from "@/db";
import { surveyQuestions, surveys, tenants } from "@/db/schema";
import { submitSurveyResponse } from "./actions";

type SearchParams = Promise<{ sent?: string; error?: string }>;

export default async function PublicSurveyPage({ params, searchParams }: { params: Promise<{ publicId: string }>; searchParams: SearchParams }) {
  const { publicId } = await params;
  const query = await searchParams;
  const [survey] = await getDb().select({ id: surveys.id, title: surveys.title, description: surveys.description, status: surveys.status, tenantName: tenants.name, logoUrl: tenants.logoUrl, brandColor: tenants.brandColor })
    .from(surveys).innerJoin(tenants, eq(surveys.tenantId, tenants.id))
    .where(eq(surveys.publicId, publicId)).limit(1);
  if (!survey) notFound();
  const sent = query.sent === "1";
  const questions = survey.status === "active" && !sent
    ? await getDb().select().from(surveyQuestions).where(eq(surveyQuestions.surveyId, survey.id)).orderBy(asc(surveyQuestions.position))
    : [];

  return (
    <main className="public-survey-shell" style={{ "--tenant-color": survey.brandColor } as React.CSSProperties}>
      <article className="public-survey">
        <header className="public-survey-header">{survey.logoUrl ? <img src={survey.logoUrl} alt="" referrerPolicy="no-referrer" /> : <span className="brand-mark" aria-hidden="true">{survey.tenantName.slice(0, 1).toUpperCase()}</span>}<strong>{survey.tenantName}</strong></header>
        <div className="public-survey-content">
          {sent ? <div className="survey-thanks"><span className="thanks-mark" aria-hidden="true">✓</span><h1>Grazie per il tuo feedback.</h1><p>La tua risposta è stata registrata in forma anonima.</p></div> : survey.status !== "active" ? <div className="survey-thanks"><h1>Questionario non disponibile</h1><p>Questo link non è al momento attivo.</p></div> : <>
            <h1>{survey.title}</h1>
            {survey.description ? <p className="survey-description">{survey.description}</p> : null}
            {query.error ? <p className="notice" role="alert">Controlla le risposte obbligatorie e riprova.</p> : null}
            <form action={submitSurveyResponse}>
              <input type="hidden" name="publicId" value={publicId} />
              <div className="survey-questions">{questions.map((question) => <fieldset className="survey-question" key={question.id}>
                <legend>{question.prompt}{question.required ? <span aria-label="obbligatoria">*</span> : null}</legend>
                {question.kind === "scale" ? <>
                  <div className="scale-options">{Array.from({ length: Math.min(101, Number(question.config.max ?? 5) - Number(question.config.min ?? 1) + 1) }, (_, i) => Number(question.config.min ?? 1) + i).map((value) => <span className="scale-choice" key={value}><input id={`${question.id}-${value}`} type="radio" name={`q_${question.id}`} value={value} required={question.required} /><label htmlFor={`${question.id}-${value}`}>{value}</label></span>)}</div>
                  <div className="scale-ends"><span>{question.metric === "nps" ? "Per nulla probabile" : "Poco soddisfatto"}</span><span>{question.metric === "nps" ? "Estremamente probabile" : "Molto soddisfatto"}</span></div>
                </> : question.kind === "choice" ? <div className="choice-list">{(Array.isArray(question.config.options) ? question.config.options : []).filter((option): option is string => typeof option === "string").map((option, optionIndex) => <label className="choice-row" key={option}><input type="radio" name={`q_${question.id}`} value={option} required={question.required} /><span>{option}</span></label>)}</div> : <><p className="survey-help">Per mantenere il feedback anonimo, non inserire dati personali.</p><textarea name={`q_${question.id}`} maxLength={2000} required={question.required} aria-label={question.prompt} /></>}
              </fieldset>)}</div>
              <p className="privacy-note">Il questionario non chiede il tuo nome o i tuoi recapiti. Le risposte vengono raccolte in forma anonima.</p>
              <button className="button" type="submit">Invia feedback</button>
            </form>
          </>}
        </div>
      </article>
    </main>
  );
}
