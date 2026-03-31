"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

const STORAGE_KEY = "cyrillic-lab-stats";

const emptyStats = {
  totalGames: 0,
  totalCorrect: 0,
  totalQuestions: 0,
  bestScore: 0,
  lastScore: 0,
  casualGames: 0,
  hardcoreGames: 0,
  ukrainianGames: 0,
  russianGames: 0,
};

export default function StatsPage() {
  const [stats, setStats] = useState(emptyStats);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;

      const parsed = JSON.parse(raw);
      setStats({ ...emptyStats, ...parsed });
    } catch {
      setStats(emptyStats);
    }
  }, []);

  const accuracy = useMemo(() => {
    if (!stats.totalQuestions) return 0;
    return Math.round((stats.totalCorrect / stats.totalQuestions) * 100);
  }, [stats.totalCorrect, stats.totalQuestions]);

  const resetStats = () => {
    localStorage.removeItem(STORAGE_KEY);
    setStats(emptyStats);
  };

  return (
    <main className="container">
      <div className="card">
        <h1 className="title">Statistik</h1>
        <p className="subtitle">
          Dein bisheriger Fortschritt in Cyrillic Lab
        </p>

        <div className="statsGrid">
          <div className="statBox">
            <span className="statLabel">Spiele gesamt</span>
            <strong className="statValue">{stats.totalGames}</strong>
          </div>

          <div className="statBox">
            <span className="statLabel">Genauigkeit</span>
            <strong className="statValue">{accuracy}%</strong>
          </div>

          <div className="statBox">
            <span className="statLabel">Bester Score</span>
            <strong className="statValue">{stats.bestScore}/10</strong>
          </div>

          <div className="statBox">
            <span className="statLabel">Letzter Score</span>
            <strong className="statValue">{stats.lastScore}/10</strong>
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
        </div>

        <div className="statsActions">
          <Link href="/" className="linkButton">
            Zurück zum Menü
          </Link>

          <button type="button" className="dangerButton" onClick={resetStats}>
            Statistik zurücksetzen
          </button>
        </div>
      </div>
    </main>
  );
}
