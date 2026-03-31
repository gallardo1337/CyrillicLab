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
  const [profileName, setProfileName] = useState("");

  useEffect(() => {
    let mounted = true;

    async function loadSessionAndProfile() {
      const { data } = await supabase.auth.getSession();
      if (!mounted) return;

      const currentSession = data.session || null;
      setSession(currentSession);

      if (currentSession?.user?.id) {
        const metadataName = currentSession.user.user_metadata?.username || "";

        if (metadataName) {
          setProfileName(metadataName);
        } else {
          const { data: profile } = await supabase
            .from("profiles")
            .select("username")
            .eq("id", currentSession.user.id)
            .single();

          if (!mounted) return;
          setProfileName(profile?.username || "");
        }
      } else {
        setProfileName("");
      }

      setLoadingSession(false);
    }

    loadSessionAndProfile();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, newSession) => {
      setSession(newSession || null);

      if (newSession?.user?.id) {
        const metadataName = newSession.user.user_metadata?.username || "";

        if (metadataName) {
          setProfileName(metadataName);
        } else {
          const { data: profile } = await supabase
            .from("profiles")
            .select("username")
            .eq("id", newSession.user.id)
            .single();

          setProfileName(profile?.username || "");
        }
      } else {
        setProfileName("");
      }

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
          Trainiere kyrillische Buchstaben – Casual, Hardcore & Infinity
        </p>

        {!loadingSession && session ? (
          <div className="authBox">
            <p className="authInfo">
              Eingeloggt als{" "}
              <strong>{profileName || userEmail || "User"}</strong>
            </p>
            <LogoutButton />
          </div>
        ) : null}

        {!loadingSession && !session ? (
          <div className="authBox">
            <p className="authInfo">
              Du kannst auch ohne Login spielen. Mit Konto werden deine
              Ergebnisse, persönliche Statistiken und später auch dein Platz in
              der Bestenliste gespeichert.
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

            <button
              type="button"
              className={mode === "infinity" ? "active" : ""}
              onClick={() => setMode("infinity")}
            >
              Infinity (Endlos bis Fehler)
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
