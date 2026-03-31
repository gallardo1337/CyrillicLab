"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { supabase } from "../../lib/supabase";

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
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorText, setErrorText] = useState("");

  useEffect(() => {
    let isMounted = true;

    async function loadStats() {
      setLoading(true);
      setErrorText("");

      const { data, error } = await supabase
        .from("game_results")
        .select("id, alphabet, mode, score, total_questions, accuracy, created_at")
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
  }, []);

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

    return {
      totalGames,
      totalCorrect,
      totalQuestions,
      bestScore,
      averageScore,
      accuracy,
      casualGames,
      hardcoreGames,
      ukrainianGames,
      russianGames,
      bestCasual,
      bestHardcore,
    };
  }, [results]);

  const recentResults = useMemo(() => results.slice(0, 10), [results]);

  return (
    <main className="container">
      <div className="card">
        <h1 className="title">Statistik</h1>
        <p className="subtitle">Echte Daten aus Supabase</p>

        {loading && <p className="resultMeta">Lade Statistik...</p>}

        {!loading && errorText && (
          <p className="resultMeta">Fehler: {errorText}</p>
        )}

        {!loading && !errorText && (
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
                <strong className="statValue">{stats.bestScore}/10</strong>
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
                <span className="statLabel">Ukrainisch</span>
                <strong className="statValue">{stats.ukrainianGames}</strong>
              </div>

              <div className="statBox">
                <span className="statLabel">Russisch</span>
                <strong className="statValue">{stats.russianGames}</strong>
              </div>

              <div className="statBox">
                <span className="statLabel">Bester Casual Score</span>
                <strong className="statValue">{stats.bestCasual}/10</strong>
              </div>

              <div className="statBox">
                <span className="statLabel">Bester Hardcore Score</span>
                <strong className="statValue">{stats.bestHardcore}/10</strong>
              </div>

              <div className="statBox">
                <span className="statLabel">Richtige Antworten</span>
                <strong className="statValue">{stats.totalCorrect}</strong>
              </div>

              <div className="statBox">
                <span className="statLabel">Fragen gesamt</span>
                <strong className="statValue">{stats.totalQuestions}</strong>
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
                        • {item.mode === "hardcore" ? "Hardcore" : "Casual"}
                      </span>

                      <strong className="statValue">
                        {item.score}/{item.total_questions}
                      </strong>

                      <p className="resultMeta" style={{ marginTop: 10 }}>
                        Accuracy: {Number(item.accuracy || 0).toFixed(2)}%
                      </p>

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
          <Link
            href="/game?alphabet=ukrainian&mode=casual"
            className="textLink"
          >
            Spiel starten
          </Link>
        </div>
      </div>
    </main>
  );
}
