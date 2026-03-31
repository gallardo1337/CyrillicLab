import Link from "next/link";
import AuthForm from "../../components/AuthForm";

export default function LoginPage() {
  return (
    <main className="container">
      <div className="card">
        <h1 className="title">Login</h1>
        <p className="subtitle">
          Melde dich an, um deine persönlichen Fortschritte zu speichern
        </p>

        <AuthForm mode="login" />

        <div className="bottomLinks homeLinks">
          <Link href="/" className="textLink">
            Zurück zum Menü
          </Link>
          <Link href="/signup" className="textLink">
            Noch kein Konto? Registrieren
          </Link>
        </div>
      </div>
    </main>
  );
}
