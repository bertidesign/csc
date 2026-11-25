# Customer Satisfaction Collector

CSC raccoglie feedback anonimi tramite questionari configurabili e offre ai gestori trend, metriche e confronti per segmento.

## Stack e provisioning

- Next.js App Router, collegato al progetto Vercel `bncom/csc`.
- Neon Postgres tramite integrazione Vercel; schema Drizzle in `src/db/schema.ts` e migrazioni in `drizzle/`.
- Clerk per accesso, organizzazioni tenant e inviti.

Neon e Clerk sono stati collegati al progetto Vercel per i relativi ambienti. Il database di sviluppo è stato inizializzato con la migrazione `0000_even_lady_bullseye.sql`.

## Avvio locale

1. Installa Node.js 22 o successivo e le dipendenze con `npm install`.
2. Collega questa directory al progetto Vercel e scarica le variabili di sviluppo con `vercel env pull .env.local --yes`.
3. In Clerk abilita Organizations e l’invio di email. Le organizzazioni CSC sono create dall’amministratore della piattaforma.
4. Crea o invita il primo amministratore in Clerk e aggiungi la sua email primaria verificata a `CSC_PLATFORM_ADMIN_EMAILS` in locale e su Vercel.
5. Imposta `NEXT_PUBLIC_APP_URL` sull’URL pubblico usato per i link d’invito.
6. Applica la migrazione al database indicato da `DATABASE_URL` con `npm run db:migrate`.
7. Avvia il progetto con `npm run dev`.

Per applicare le migrazioni a un altro ambiente, fornisci la sua `DATABASE_URL` all’esecuzione di `npm run db:migrate`; non copiare la stringa nel repository.

## Funzioni incluse

- Tenant creati dalla piattaforma e utenti invitati all’organizzazione Clerk.
- Questionari con scale numeriche, scelta singola e commento; metriche CSAT, NPS e punteggio personalizzato.
- Link pubblico anonimo, branding per tenant tramite logo e colore.
- Dashboard con volume, andamento, CSAT/NPS e confronti sui segmenti configurati.
- Elenco delle 200 risposte più recenti per tenant.

La piattaforma non salva nome, email, identificativo cliente o indirizzo IP nelle proprie tabelle di risposta. I commenti liberi possono comunque contenere informazioni personali se il rispondente le inserisce.

Prima di condividere i link pubblici, configura una regola di rate limiting nel Firewall Vercel per le richieste `POST /s/*`: l’endpoint anonimo non applica al momento un limite applicativo e potrebbe ricevere invii ripetuti. La regola WAF usa la sorgente di rete per limitare il traffico senza memorizzare tale dato nelle tabelle CSC. Vedi la [guida Vercel al rate limiting WAF](https://vercel.com/docs/vercel-firewall/vercel-waf/rate-limiting).

## Variabili

- `DATABASE_URL`: fornita da Neon.
- `CLERK_SECRET_KEY` e `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`: fornite da Clerk.
- `CSC_PLATFORM_ADMIN_EMAILS`: email primarie verificate degli amministratori CSC, separate da virgole.
- `NEXT_PUBLIC_APP_URL`: URL completo usato nei link d’invito.
- `NEXT_PUBLIC_CLERK_SIGN_IN_URL`: percorso di accesso, `/sign-in`.

Non committare `.env.local`; il file è escluso da Git.
