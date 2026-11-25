import { asc } from "drizzle-orm";
import { AppShell } from "@/components/app-shell";
import { getDb } from "@/db";
import { tenants } from "@/db/schema";
import { getViewer, requirePlatformAdmin } from "@/lib/auth";
import { createTenantAction, inviteTenantUserAction } from "./actions";

type SearchParams = Promise<{ created?: string; invited?: string; error?: string }>;

export default async function TenantsAdminPage({ searchParams }: { searchParams: SearchParams }) {
  const viewer = await getViewer();
  const hasAdminList = Boolean(process.env.CSC_PLATFORM_ADMIN_EMAILS?.trim());
  if (hasAdminList) await requirePlatformAdmin();
  const query = await searchParams;
  const tenantRows = hasAdminList ? await getDb().select().from(tenants).orderBy(asc(tenants.createdAt)) : [];

  return <AppShell tenant={null} orgId={null} isPlatformAdmin={Boolean(viewer?.isPlatformAdmin)}>
    <div className="page-heading"><div><h1>Clienti</h1><p>Crea gli spazi di lavoro e gestisci gli inviti.</p></div></div>
    {!hasAdminList ? <div className="notice"><strong>Configurazione iniziale richiesta.</strong> Aggiungi l’indirizzo email verificato del primo amministratore a <code>CSC_PLATFORM_ADMIN_EMAILS</code>, poi ricarica questa pagina.</div> : !viewer?.isPlatformAdmin ? <div className="empty-panel"><strong>Accesso non autorizzato</strong>Questo account non è configurato come amministratore della piattaforma.</div> : <>
      {query.created ? <p className="notice is-success" role="status">Spazio cliente creato.</p> : null}
      {query.error === "create" ? <p className="notice" role="alert">Non è stato possibile creare lo spazio cliente. Riprova tra poco.</p> : null}
      {query.invited ? <p className="notice is-success" role="status">Invito inviato.</p> : null}
      {query.error && query.error !== "create" ? <p className="notice" role="alert">Non è stato possibile completare l’operazione. Controlla i dati e riprova.</p> : null}
      <section className="form-section customer-manager">
        <h2>Nuovo cliente</h2>
        <form className="field-stack" action={createTenantAction}><div className="field"><label htmlFor="tenant-name">Nome dell’azienda o attività</label><input id="tenant-name" name="name" required minLength={2} maxLength={100} placeholder="es. Bottega Centrale" /></div><button className="button" type="submit">Aggiungi cliente</button></form>
        {tenantRows.length ? <div className="customer-list"><h2>Clienti</h2><div className="list-stack">{tenantRows.map((tenant) => <article className="tenant-admin-row" key={tenant.id}><h3>{tenant.name}</h3><form className="invite-inline" action={inviteTenantUserAction}><input type="hidden" name="tenantId" value={tenant.id} /><label className="sr-only" htmlFor={`invite-${tenant.id}`}>Email da invitare in {tenant.name}</label><input id={`invite-${tenant.id}`} name="email" type="email" required maxLength={254} placeholder="Email della persona da invitare" /><button className="button button-small" type="submit">Invita</button></form></article>)}</div></div> : <p className="customer-empty">Nessun cliente ancora.</p>}
      </section>
    </>}
  </AppShell>;
}
