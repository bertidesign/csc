import { updateBrandAction } from "@/app/settings/actions";
import { requireTenantContext } from "@/lib/auth";

type SearchParams = Promise<{ saved?: string; error?: string }>;

export default async function SettingsPage({ searchParams }: { searchParams: SearchParams }) {
  const { tenant } = await requireTenantContext();
  const query = await searchParams;
  return <>
    <div className="page-heading"><div><h1>Impostazioni</h1><p>Personalizza come appare il questionario ai tuoi clienti.</p></div></div>
    {query.saved ? <p className="notice is-success" role="status">Brand aggiornato.</p> : null}
    {query.error ? <p className="notice" role="alert">Il colore o l’indirizzo del logo non è valido.</p> : null}
    <div className="form-layout">
      <section className="form-section"><h2>Identità visiva</h2><p>Lo spazio cliente si chiama {tenant.name}. Puoi personalizzarne logo e colore principale.</p>
        <form className="field-stack" action={updateBrandAction}>
          <div className="field"><label htmlFor="brandColor">Colore principale</label><input id="brandColor" name="brandColor" type="color" defaultValue={tenant.brandColor} required /><small>Usato nei pulsanti e negli elementi del questionario pubblico.</small></div>
          <div className="field"><label htmlFor="logoUrl">URL del logo</label><input id="logoUrl" name="logoUrl" type="url" inputMode="url" defaultValue={tenant.logoUrl ?? ""} placeholder="https://…" /><small>Inserisci un indirizzo HTTPS diretto a un’immagine.</small></div>
          <button className="button" type="submit">Salva identità visiva</button>
        </form>
      </section>
      <aside className="form-section"><h2>Anteprima</h2><p>Il logo e il colore saranno applicati al questionario pubblico.</p>
        <div className="brand-preview" style={{ "--tenant-color": tenant.brandColor } as React.CSSProperties}>
          {tenant.logoUrl ? <img className="tenant-logo" src={tenant.logoUrl} alt="" referrerPolicy="no-referrer" /> : <span className="brand-preview-mark" aria-hidden="true">{tenant.name.slice(0, 1).toUpperCase()}</span>}
          <div><strong>{tenant.name}</strong><span>Customer feedback</span></div>
        </div>
      </aside>
    </div>
  </>;
}
