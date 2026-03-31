"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabase";
import { formatDurationMs } from "../../lib/gameUtils";

function formatDate(value) {
  try {
    return new Date(value).toLocaleString("de-DE", {
      dateStyle: "short",
      timeStyle: "short",
    });
  } catch {
    return value;
  }
}

export default function StatsPage() {
  const router = useRouter();

  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorText, setErrorText] = useState("");
  const [sessionChecked, setSessionChecked] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function loadStats() {
      setLoading(true);
      setErrorText("");

      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!isMounted) return;

      setSessionChecked(true);

      if (!session?.user?.id) {
        router.push("/login");
        return;
      }

      const { data, error } = await supabase
        .from("game_results")
        .select(
          "id, alphabet, mode, score, total_questions, accuracy, duration_ms, ended_by, is_infinity, created_at"
        )
        .eq("user_id", session.user.id)
        .order("created_at", { ascending: false })
        .limit(200);

      if (!isMounted) return;

      if (error) {
        setErrorText(error.message || "Fehler beim Laden der Statistik.");
        setResults([]);
        setLoading(false);
        return;
      }

      setResults(data || []);
      setLoading(false);
    }

    loadStats();

    return () => {
      isMounted = false;
    };
  }, [router]);

  const stats = useMemo(() => {
    const totalGames = results.length;
    const totalCorrect = results.reduce((sum, item) => sum + (item.score || 0), 0);
    const totalQuestions = results.reduce(
      (sum, item) => sum + (item.total_questions || 0),
      0
    );

    const bestScore = results.reduce(
      (max, item) => Math.max(max, item.score || 0),
      0
    );

    const averageScore = totalGames
      ? (totalCorrect / totalGames).toFixed(2)
      : "0.00";

    const accuracy = totalQuestions
      ? Math.round((totalCorrect / totalQuestions) * 100)
      : 0;

    const casualGames = results.filter((item) => item.mode === "casual").length;
    const hardcoreGames = results.filter((item) => item.mode === "hardcore").length;
    const infinityGames = results.filter((item) => item.mode === "infinity").length;
    const ukrainianGames = results.filter(
      (item) => item.alphabet === "ukrainian"
    ).length;
    const russianGames = results.filter(
      (item) => item.alphabet === "russian"
    ).length;

    const bestCasual = results
      .filter((item) => item.mode === "casual")
      .reduce((max, item) => Math.max(max, item.score || 0), 0);

    const bestHardcore = results
      .filter((item) => item.mode === "hardcore")
      .reduce((max, item) => Math.max(max, item.score || 0), 0);

    const bestInfinity = results
      .filter((item) => item.mode === "infinity")
      .reduce((max, item) => Math.max(max, item.score || 0), 0);

    return {
      totalGames,
      totalCorrect,
      totalQuestions,
      bestScore,
      averageScore,
      accuracy,
      casualGames,
      hardcoreGames,
      infinityGames,
      ukrainianGames,
      russianGames,
      bestCasual,
      bestHardcore,
      bestInfinity,
    };
  }, [results]);

  const recentResults = useMemo(() => results.slice(0, 10), [results]);

  if (!sessionChecked || loading) {
    return (
      <main className="container">
        <div className="card">
          <h1 className="title">Statistik</h1>
          <p className="subtitle">Lade deine persönlichen Daten...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="container">
      <div className="card">
        <h1 className="title">Meine Statistik</h1>
        <p className="subtitle">Deine persönlichen Daten aus Supabase</p>

        {errorText ? <p className="resultMeta">Fehler: {errorText}</p> : null}

        {!errorText && (
          <>
            <div className="statsGrid">
              <div className="statBox">
                <span className="statLabel">Spiele gesamt</span>
                <strong className="statValue">{stats.totalGames}</strong>
              </div>

              <div className="statBox">
                <span className="statLabel">Genauigkeit</span>
                <strong className="statValue">{stats.accuracy}%</strong>
              </div>

              <div className="statBox">
                <span className="statLabel">Bester Score</span>
                <strong className="statValue">{stats.bestScore}</strong>
              </div>

              <div className="statBox">
                <span className="statLabel">Ø Score</span>
                <strong className="statValue">{stats.averageScore}</strong>
              </div>

              <div className="statBox">
                <span className="statLabel">Casual Spiele</span>
                <strong className="statValue">{stats.casualGames}</strong>
              </div>

              <div className="statBox">
                <span className="statLabel">Hardcore Spiele</span>
                <strong className="statValue">{stats.hardcoreGames}</strong>
              </div>

              <div className="statBox">
                <span className="statLabel">Infinity Spiele</span>
                <strong className="statValue">{stats.infinityGames}</strong>
              </div>

              <div className="statBox">
                <span className="statLabel">Ukrainisch</span>
                <strong className="statValue">{stats.ukrainianGames}</strong>
              </div>

              <div className="statBox">
                <span className="statLabel">Russisch</span>
                <strong className="statValue">{stats.russianGames}</strong>
              </div>

              <div className="statBox">
                <span className="statLabel">Bester Casual Score</span>
                <strong className="statValue">{stats.bestCasual}</strong>
              </div>

              <div className="statBox">
                <span className="statLabel">Bester Hardcore Score</span>
                <strong className="statValue">{stats.bestHardcore}</strong>
              </div>

              <div className="statBox">
                <span className="statLabel">Bester Infinity Run</span>
                <strong className="statValue">{stats.bestInfinity}</strong>
              </div>
            </div>

            <div className="section">
              <h2>Letzte 10 Ergebnisse</h2>

              {recentResults.length === 0 ? (
                <div className="statBox">
                  <span className="statLabel">Noch keine Daten vorhanden</span>
                  <strong className="statValue">0 Einträge</strong>
                </div>
              ) : (
                <div className="statsGrid">
                  {recentResults.map((item) => (
                    <div key={item.id} className="statBox">
                      <span className="statLabel">
                        {item.alphabet === "ukrainian"
                          ? "Ukrainisch"
                          : "Russisch"}{" "}
                        •{" "}
                        {item.mode === "hardcore"
                          ? "Hardcore"
                          : item.mode === "infinity"
                            ? "Infinity"
                            : "Casual"}
                      </span>

                      <strong className="statValue">
                        {item.mode === "infinity"
                          ? `${item.score} Punkte`
                          : `${item.score}/${item.total_questions}`}
                      </strong>

                      <p className="resultMeta" style={{ marginTop: 10 }}>
                        Zeit: {formatDurationMs(item.duration_ms || 0)}
                      </p>

                      {item.mode === "infinity" && item.ended_by ? (
                        <p className="resultMeta">
                          Ende:{" "}
                          {item.ended_by === "wrong_answer"
                            ? "durch Fehler"
                            : item.ended_by === "manual_exit"
                              ? "manuell beendet"
                              : "beendet"}
                        </p>
                      ) : null}

                      <p className="resultMeta">{formatDate(item.created_at)}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}

        <div className="bottomLinks homeLinks">
          <Link href="/" className="textLink">
            Menü
          </Link>
          <Link href="/leaderboard" className="textLink">
            Bestenliste
          </Link>
          <Link
            href="/game?alphabet=ukrainian&mode=infinity"
            className="textLink"
          >
            Infinity starten
          </Link>
        </div>
      </div>
    </main>
  );
}
