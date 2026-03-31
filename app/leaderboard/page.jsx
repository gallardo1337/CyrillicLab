"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
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

export default function LeaderboardPage() {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorText, setErrorText] = useState("");
  const [modeFilter, setModeFilter] = useState("infinity");
  const [alphabetFilter, setAlphabetFilter] = useState("all");

  useEffect(() => {
    let isMounted = true;

    async function loadLeaderboard() {
      setLoading(true);
      setErrorText("");

      const { data, error } = await supabase
        .from("leaderboard_entries")
        .select(
          "id, username, alphabet, mode, score, total_questions, duration_ms, accuracy, ended_by, is_infinity, created_at"
        )
        .order("score", { ascending: false })
        .order("duration_ms", { ascending: true })
        .order("created_at", { ascending: true })
        .limit(200);

      if (!isMounted) return;

      if (error) {
        setErrorText(error.message || "Fehler beim Laden der Bestenliste.");
        setEntries([]);
        setLoading(false);
        return;
      }

      setEntries(data || []);
      setLoading(false);
    }

    loadLeaderboard();

    return () => {
      isMounted = false;
    };
  }, []);

  const filteredEntries = useMemo(() => {
    return entries.filter((entry) => {
      const modeOk = entry.mode === modeFilter;
      const alphabetOk =
        alphabetFilter === "all" || entry.alphabet === alphabetFilter;

      return modeOk && alphabetOk;
    });
  }, [entries, modeFilter, alphabetFilter]);

  const topEntries = useMemo(() => filteredEntries.slice(0, 25), [filteredEntries]);

  const headingText = useMemo(() => {
    const modeLabel =
      modeFilter === "casual"
        ? "Casual"
        : modeFilter === "hardcore"
          ? "Hardcore"
          : "Infinity";

    const alphabetLabel =
      alphabetFilter === "ukrainian"
        ? " • Ukrainisch"
        : alphabetFilter === "russian"
          ? " • Russisch"
          : "";

    return `${modeLabel}${alphabetLabel}`;
  }, [modeFilter, alphabetFilter]);

  return (
    <main className="container">
      <div className="card">
        <h1 className="title">Bestenliste</h1>
        <p className="subtitle">
          Ranking nach Score und bei Gleichstand nach schnellerer Zeit
        </p>

        <div className="section">
          <h2>Modus</h2>
          <div className="options">
            <button
              type="button"
              className={modeFilter === "casual" ? "active" : ""}
              onClick={() => setModeFilter("casual")}
            >
              Casual
            </button>

            <button
              type="button"
              className={modeFilter === "hardcore" ? "active" : ""}
              onClick={() => setModeFilter("hardcore")}
            >
              Hardcore
            </button>

            <button
              type="button"
              className={modeFilter === "infinity" ? "active" : ""}
              onClick={() => setModeFilter("infinity")}
            >
              Infinity
            </button>
          </div>
        </div>

        <div className="section">
          <h2>Alphabet</h2>
          <div className="options">
            <button
              type="button"
              className={alphabetFilter === "all" ? "active" : ""}
              onClick={() => setAlphabetFilter("all")}
            >
              Alle
            </button>

            <button
              type="button"
              className={alphabetFilter === "ukrainian" ? "active" : ""}
              onClick={() => setAlphabetFilter("ukrainian")}
            >
              🇺🇦 Ukrainisch
            </button>

            <button
              type="button"
              className={alphabetFilter === "russian" ? "active" : ""}
              onClick={() => setAlphabetFilter("russian")}
            >
              🇷🇺 Russisch
            </button>
          </div>
        </div>

        <div className="section">
          <h2>Top-Ranking: {headingText}</h2>

          {loading && <p className="resultMeta">Lade Bestenliste...</p>}

          {!loading && errorText && (
            <p className="resultMeta">Fehler: {errorText}</p>
          )}

          {!loading && !errorText && topEntries.length === 0 && (
            <div className="statBox">
              <span className="statLabel">Noch keine Einträge vorhanden</span>
              <strong className="statValue">0</strong>
            </div>
          )}

          {!loading && !errorText && topEntries.length > 0 && (
            <div className="leaderboardList">
              {topEntries.map((entry, index) => (
                <div key={entry.id} className="leaderboardItem">
                  <div className="leaderboardRank">#{index + 1}</div>

                  <div className="leaderboardMain">
                    <div className="leaderboardTopRow">
                      <strong className="leaderboardName">
                        {entry.username || "User"}
                      </strong>
                      <span className="leaderboardScore">
                        {entry.score}
                        {entry.mode === "infinity"
                          ? " Punkte"
                          : ` / ${entry.total_questions}`}
                      </span>
                    </div>

                    <div className="leaderboardMeta">
                      <span>
                        {entry.alphabet === "ukrainian"
                          ? "Ukrainisch"
                          : "Russisch"}
                      </span>
                      <span>•</span>
                      <span>{formatDurationMs(entry.duration_ms || 0)}</span>

                      {entry.mode === "infinity" && entry.ended_by ? (
                        <>
                          <span>•</span>
                          <span>
                            {entry.ended_by === "wrong_answer"
                              ? "durch Fehler"
                              : entry.ended_by === "manual_exit"
                                ? "manuell beendet"
                                : "beendet"}
                          </span>
                        </>
                      ) : null}
                    </div>

                    <div className="leaderboardDate">
                      {formatDate(entry.created_at)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bottomLinks homeLinks">
          <Link href="/" className="textLink">
            Menü
          </Link>
          <Link href="/stats" className="textLink">
            Meine Statistik
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
