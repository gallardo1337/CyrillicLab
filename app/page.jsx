"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "../lib/supabase";
import LogoutButton from "../components/LogoutButton";

export default function Home() {
  const router = useRouter();

  const [alphabet, setAlphabet] = useState("ukrainian");
  const [mode, setMode] = useState("casual");
  const [session, setSession] = useState(null);
  const [loadingSession, setLoadingSession] = useState(true);

  useEffect(() => {
    let mounted = true;

    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return;
      setSession(data.session || null);
      setLoadingSession(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession || null);
      setLoadingSession(false);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const startGame = () => {
    router.push(`/game?alphabet=${alphabet}&mode=${mode}`);
  };

  const userEmail = session?.user?.email || "";

  return (
    <main className="container">
      <div className="card">
        <h1 className="title">Cyrillic Lab</h1>
        <p className="subtitle">
          Trainiere kyrillische Buchstaben – Casual & Hardcore
        </p>

        {!loadingSession && session ? (
          <div className="authBox">
            <p className="authInfo">
              Eingeloggt als <strong>{userEmail}</strong>
            </p>
            <LogoutButton />
          </div>
        ) : null}

        {!loadingSession && !session ? (
          <div className="authBox">
            <p className="authInfo">
              Du kannst auch ohne Login spielen. Mit Konto werden deine
              Ergebnisse und persönlichen Statistiken gespeichert.
            </p>

            <div className="authActions">
              <Link href="/login" className="linkButton">
                Einloggen
              </Link>
              <Link href="/signup" className="linkButton">
                Registrieren
              </Link>
            </div>
          </div>
        ) : null}

        <div className="section">
          <h2>Alphabet wählen</h2>
          <div className="options">
            <button
              type="button"
              className={alphabet === "ukrainian" ? "active" : ""}
              onClick={() => setAlphabet("ukrainian")}
            >
              🇺🇦 Ukrainisch
            </button>

            <button
              type="button"
              className={alphabet === "russian" ? "active" : ""}
              onClick={() => setAlphabet("russian")}
            >
              🇷🇺 Russisch
            </button>
          </div>
        </div>

        <div className="section">
          <h2>Modus wählen</h2>
          <div className="options">
            <button
              type="button"
              className={mode === "casual" ? "active" : ""}
              onClick={() => setMode("casual")}
            >
              Casual (3 Auswahlmöglichkeiten)
            </button>

            <button
              type="button"
              className={mode === "hardcore" ? "active" : ""}
              onClick={() => setMode("hardcore")}
            >
              Hardcore (selbst eingeben)
            </button>
          </div>
        </div>

        <button type="button" className="startButton" onClick={startGame}>
          Spiel starten
        </button>

        <div className="bottomLinks homeLinks">
          <Link href="/stats" className="textLink">
            Meine Statistik
          </Link>
        </div>
      </div>
    </main>
  );
}
