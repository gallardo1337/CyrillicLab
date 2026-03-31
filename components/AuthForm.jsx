"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../lib/supabase";

export default function AuthForm({ mode = "login" }) {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [repeatPassword, setRepeatPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [errorText, setErrorText] = useState("");

  const isSignup = mode === "signup";

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");
    setErrorText("");

    const cleanEmail = email.trim().toLowerCase();
    const cleanPassword = password.trim();
    const cleanRepeat = repeatPassword.trim();

    if (!cleanEmail || !cleanPassword) {
      setErrorText("Bitte E-Mail und Passwort eingeben.");
      setLoading(false);
      return;
    }

    if (cleanPassword.length < 6) {
      setErrorText("Das Passwort muss mindestens 6 Zeichen haben.");
      setLoading(false);
      return;
    }

    if (isSignup && cleanPassword !== cleanRepeat) {
      setErrorText("Die Passwörter stimmen nicht überein.");
      setLoading(false);
      return;
    }

    try {
      if (isSignup) {
        const { error } = await supabase.auth.signUp({
          email: cleanEmail,
          password: cleanPassword,
        });

        if (error) {
          setErrorText(error.message);
          setLoading(false);
          return;
        }

        setMessage(
          "Registrierung erfolgreich. Prüfe ggf. deine E-Mails zur Bestätigung oder logge dich direkt ein."
        );
        setLoading(false);
        return;
      }

      const { error } = await supabase.auth.signInWithPassword({
        email: cleanEmail,
        password: cleanPassword,
      });

      if (error) {
        setErrorText(error.message);
        setLoading(false);
        return;
      }

      router.push("/");
      router.refresh();
    } catch {
      setErrorText("Es ist ein unerwarteter Fehler aufgetreten.");
    }

    setLoading(false);
  };

  return (
    <form className="authForm" onSubmit={handleSubmit}>
      <div className="authField">
        <label htmlFor="email">E-Mail</label>
        <input
          id="email"
          type="email"
          placeholder="deine@email.de"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          autoComplete="email"
        />
      </div>

      <div className="authField">
        <label htmlFor="password">Passwort</label>
        <input
          id="password"
          type="password"
          placeholder="Passwort"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete={isSignup ? "new-password" : "current-password"}
        />
      </div>

      {isSignup && (
        <div className="authField">
          <label htmlFor="repeatPassword">Passwort wiederholen</label>
          <input
            id="repeatPassword"
            type="password"
            placeholder="Passwort wiederholen"
            value={repeatPassword}
            onChange={(e) => setRepeatPassword(e.target.value)}
            autoComplete="new-password"
          />
        </div>
      )}

      {errorText ? <p className="authError">{errorText}</p> : null}
      {message ? <p className="authSuccess">{message}</p> : null}

      <button type="submit" className="startButton" disabled={loading}>
        {loading
          ? "Bitte warten..."
          : isSignup
            ? "Konto erstellen"
            : "Einloggen"}
      </button>
    </form>
  );
}
