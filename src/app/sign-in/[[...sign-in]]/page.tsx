import { SignIn } from "@clerk/nextjs";

export default function SignInPage() {
  return (
    <main className="sign-in-page">
      <div className="sign-in-frame">
        <section className="sign-in-copy">
          <span className="brand-mark" aria-hidden="true">C</span>
          <h1>Il feedback diventa una direzione.</h1>
          <p>Accedi allo spazio del tuo team per leggere le risposte e creare questionari.</p>
        </section>
        <div className="sign-in-widget"><SignIn routing="hash" /></div>
      </div>
    </main>
  );
}
