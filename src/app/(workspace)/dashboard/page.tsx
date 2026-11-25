import Link from "next/link";
import { requireTenantContext } from "@/lib/auth";
import { getTenantDashboard } from "@/lib/analytics";
import { ResponseChart } from "@/components/response-chart";

type SearchParams = Promise<{ days?: string; survey?: string }>;

export default async function DashboardPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const rangeDays = params.days === "7" || params.days === "90" ? Number(params.days) as 7 | 90 : 30;
  const { tenant } = await requireTenantContext();
  const dashboard = await getTenantDashboard(tenant.id, rangeDays, params.survey);
  return (
    <>
      <div className="page-heading">
        <div><h1>Soddisfazione clienti</h1><p>Un quadro sintetico dei feedback ricevuti nel periodo selezionato.</p></div>
        <form className="filter-bar" action="/dashboard">
          <label className="field-compact"><span>Periodo</span><select name="days" defaultValue={String(rangeDays)}><option value="7">Ultimi 7 giorni</option><option value="30">Ultimi 30 giorni</option><option value="90">Ultimi 90 giorni</option></select></label>
          <label className="field-compact"><span>Questionario</span><select name="survey" defaultValue={dashboard.selectedSurveyId}><option value="">Tutti</option>{dashboard.surveys.map((survey) => <option key={survey.id} value={survey.id}>{survey.title}</option>)}</select></label>
          <button className="button button-secondary" type="submit">Applica</button>
        </form>
      </div>
      <div className="metric-strip" aria-label="Metriche riepilogative">
        <div className="metric-cell"><span className="metric-label">Risposte</span><strong className="metric-value">{dashboard.responseCount}</strong><span className="metric-note">nel periodo selezionato</span></div>
        <div className="metric-cell"><span className="metric-label">CSAT medio</span><strong className={`metric-value${dashboard.csatAverage === null ? " is-muted" : ""}`}>{dashboard.csatAverage === null ? "—" : `${dashboard.csatAverage}/5`}</strong><span className="metric-note">sulle risposte disponibili</span></div>
        <div className="metric-cell"><span className="metric-label">NPS</span><strong className={`metric-value${dashboard.nps === null ? " is-muted" : ""}`}>{dashboard.nps === null ? "—" : dashboard.nps}</strong><span className="metric-note">da −100 a +100</span></div>
      </div>
      <div className="dashboard-grid">
        <section className="panel chart-panel">
          <div className="panel-heading"><div><h2>Risposte nel tempo</h2><p>Conteggio giornaliero · fuso orario Europa/Roma</p></div><span className="status-chip">{rangeDays} giorni</span></div>
          <ResponseChart points={dashboard.trend} />
        </section>
        <section className="panel side-metrics">
          <div className="panel-heading"><div><h2>Questionari</h2><p>Attivi nello spazio di lavoro</p></div></div>
          <div className="side-metric"><span className="side-metric-label">Questionari attivi</span><strong className="side-metric-value">{dashboard.activeSurveyCount}</strong><span className="side-metric-note">Pronti a ricevere risposte</span></div>
          <div className="side-metric"><span className="side-metric-label">Link pubblico</span>{dashboard.surveys.filter((survey) => survey.status === "active").length ? <div className="button-row"><Link className="button button-small button-quiet" href="/surveys">Gestisci e copia link</Link></div> : <span className="side-metric-note">Crea e pubblica un questionario per iniziare.</span>}</div>
        </section>
      </div>
      {dashboard.customScores.length ? <section className="section-block"><div className="section-heading"><h2>Punteggi personalizzati</h2><p>Media per domanda e numero di risposte</p></div><div className="panel table-wrap"><table className="data-table"><thead><tr><th>Domanda</th><th className="numeric">Media</th><th className="numeric">Risposte</th></tr></thead><tbody>{dashboard.customScores.map((row) => <tr key={row.prompt}><td>{row.prompt}</td><td className="numeric">{row.average}</td><td className="numeric">{row.answerCount}</td></tr>)}</tbody></table></div></section> : null}
      <section className="section-block">
        <div className="section-heading"><h2>Confronti per segmento</h2><p>Dimensioni definite nelle domande a scelta</p></div>
        {dashboard.segments.length ? <div className="panel table-wrap"><table className="data-table"><thead><tr><th>Dimensione</th><th>Segmento</th><th className="numeric">Risposte</th><th className="numeric">CSAT</th><th className="numeric">NPS</th></tr></thead><tbody>{dashboard.segments.map((row, index) => <tr key={`${row.prompt}-${row.segment}-${index}`}><td><span>{row.prompt}</span></td><td>{row.segment}</td><td className="numeric">{row.responseCount}</td><td className="numeric">{row.csatAverage === null ? "—" : `${row.csatAverage}/5`}</td><td className="numeric">{row.nps === null ? "—" : row.nps}</td></tr>)}</tbody></table></div> : <div className="empty-panel"><strong>Nessun confronto disponibile</strong>Quando raccoglierai risposte con domande segmentabili, le metriche appariranno qui.</div>}
      </section>
    </>
  );
}
