"use client";

import { useState } from "react";

type Metric = "none" | "score" | "csat" | "nps";
type QuestionKind = "scale" | "choice" | "text";

export function QuestionForm({
  surveyId,
  action,
}: {
  surveyId: string;
  action: (formData: FormData) => Promise<void>;
}) {
  const [kind, setKind] = useState<QuestionKind>("scale");
  const [metric, setMetric] = useState<Metric>("csat");

  return (
    <form className="field-stack question-form" action={action}>
      <input type="hidden" name="surveyId" value={surveyId} />
      <div className="field">
        <label htmlFor="prompt">Domanda</label>
        <input id="prompt" name="prompt" required minLength={3} maxLength={240} placeholder="es. Quanto sei soddisfatto del servizio?" />
      </div>
      <div className="field">
        <label htmlFor="kind">Tipo di risposta</label>
        <select id="kind" name="kind" value={kind} onChange={(event) => setKind(event.target.value as QuestionKind)}>
          <option value="scale">Valutazione numerica</option>
          <option value="choice">Scelta tra opzioni</option>
          <option value="text">Commento libero</option>
        </select>
      </div>

      {kind === "scale" ? <>
        <div className="field">
          <label htmlFor="metric">Indicatore</label>
          <select id="metric" name="metric" value={metric} onChange={(event) => setMetric(event.target.value as Metric)}>
            <option value="csat">Soddisfazione (CSAT, da 1 a 5)</option>
            <option value="nps">Propensione a consigliare (NPS, da 0 a 10)</option>
            <option value="score">Punteggio medio</option>
            <option value="none">Nessun indicatore</option>
          </select>
        </div>
        {metric === "score" || metric === "none" ? <details>
          <summary>Personalizza i valori della scala</summary>
          <div className="field-inline details-content">
            <div className="field"><label htmlFor="min">Da</label><input id="min" name="min" type="number" min={0} max={100} defaultValue={1} /></div>
            <div className="field"><label htmlFor="max">A</label><input id="max" name="max" type="number" min={1} max={100} defaultValue={5} /></div>
          </div>
        </details> : null}
      </> : <input type="hidden" name="metric" value="none" />}

      {kind === "choice" ? <>
        <div className="field">
          <label htmlFor="options">Opzioni di risposta</label>
          <textarea id="options" name="options" required maxLength={1000} placeholder={"Una per riga\nNegozio\nOnline"} />
        </div>
        <label className="check-field"><input name="isSegment" type="checkbox" />Confronta i risultati per risposta</label>
      </> : null}

      <details>
        <summary>Altre impostazioni</summary>
        <label className="check-field details-content"><input name="required" type="checkbox" defaultChecked />Risposta obbligatoria</label>
      </details>
      <button className="button" type="submit">Aggiungi domanda</button>
    </form>
  );
}
