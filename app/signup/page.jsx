import Link from "next/link";
import AuthForm from "../../components/AuthForm";

export default function SignupPage() {
  return (
    <main className="container">
      <div className="card">
        <h1 className="title">Registrieren</h1>
        <p className="subtitle">
          Erstelle ein Konto für persönliche Statistiken in Cyrillic Lab
        </p>

        <AuthForm mode="signup" />

        <div className="bottomLinks homeLinks">
          <Link href="/" className="textLink">
            Zurück zum Menü
          </Link>
          <Link href="/login" className="textLink">
            Schon ein Konto? Einloggen
          </Link>
        </div>
      </div>
    </main>
  );
}
