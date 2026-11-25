import Link from "next/link";
import { auth } from "@clerk/nextjs/server";

export default async function HomePage() {
  const session = await auth();
  return (
    <main className="public-home">
      <section className="home-panel">
        <div className="home-header"><span className="brand-mark" aria-hidden="true">C</span> CSC</div>
        <p className="eyebrow">Customer Satisfaction Collector</p>
        <h1>Ascolta i clienti. Capisci cosa cambia.</h1>
        <p>Raccogli feedback anonimi con questionari configurabili e osserva l’andamento della soddisfazione per segmento e periodo.</p>
        <div className="home-actions">
          <Link className="button" href={session.userId ? (session.orgId ? "/dashboard" : "/admin/tenants") : "/sign-in"}>
            {session.userId ? "Apri CSC" : "Accedi"}
          </Link>
          <span className="home-detail">Questionari semplici · risposte anonime · logo e colori personalizzati</span>
        </div>
      </section>
    </main>
  );
}
