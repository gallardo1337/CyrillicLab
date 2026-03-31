"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../lib/supabase";

function isValidUsername(value) {
  return /^[A-Za-z0-9_]+$/.test(value);
}

export default function AuthForm({ mode = "login" }) {
  const router = useRouter();

  const [username, setUsername] = useState("");
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

    const cleanUsername = username.trim();
    const cleanEmail = email.trim().toLowerCase();
    const cleanPassword = password.trim();
    const cleanRepeat = repeatPassword.trim();

    if (!cleanEmail || !cleanPassword) {
      setErrorText("Bitte E-Mail und Passwort eingeben.");
      setLoading(false);
      return;
    }

    if (isSignup) {
      if (!cleanUsername) {
        setErrorText("Bitte einen Username eingeben.");
        setLoading(false);
        return;
      }

      if (cleanUsername.length < 3 || cleanUsername.length > 20) {
        setErrorText("Der Username muss zwischen 3 und 20 Zeichen lang sein.");
        setLoading(false);
        return;
      }

      if (!isValidUsername(cleanUsername)) {
        setErrorText(
          "Der Username darf nur Buchstaben, Zahlen und Unterstriche enthalten."
        );
        setLoading(false);
        return;
      }
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
          options: {
            data: {
              username: cleanUsername,
            },
          },
        });

        if (error) {
          setErrorText(error.message);
          setLoading(false);
          return;
        }

        setMessage(
          "Registrierung erfolgreich. Du kannst dich jetzt einloggen."
        );
        setUsername("");
        setEmail("");
        setPassword("");
        setRepeatPassword("");
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
      {isSignup && (
        <div className="authField">
          <label htmlFor="username">Username</label>
          <input
            id="username"
            type="text"
            placeholder="z. B. Kevin_91"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            autoComplete="username"
            maxLength={20}
          />
          <p className="authHint">
            3–20 Zeichen, nur Buchstaben, Zahlen und Unterstriche
          </p>
        </div>
      )}

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
