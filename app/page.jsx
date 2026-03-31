"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();

  const [alphabet, setAlphabet] = useState("ukrainian");
  const [mode, setMode] = useState("casual");

  const startGame = () => {
    router.push(`/game?alphabet=${alphabet}&mode=${mode}`);
  };

  return (
    <main className="container">
      <div className="card">
        <h1 className="title">Cyrillic Lab</h1>
        <p className="subtitle">
          Trainiere kyrillische Buchstaben – Casual & Hardcore
        </p>

        {/* Alphabet Auswahl */}
        <div className="section">
          <h2>Alphabet wählen</h2>
          <div className="options">
            <button
              className={alphabet === "ukrainian" ? "active" : ""}
              onClick={() => setAlphabet("ukrainian")}
            >
              🇺🇦 Ukrainisch
            </button>

            <button
              className={alphabet === "russian" ? "active" : ""}
              onClick={() => setAlphabet("russian")}
            >
              🇷🇺 Russisch
            </button>
          </div>
        </div>

        {/* Modus Auswahl */}
        <div className="section">
          <h2>Modus wählen</h2>
          <div className="options">
            <button
              className={mode === "casual" ? "active" : ""}
              onClick={() => setMode("casual")}
            >
              Casual (3 Auswahlmöglichkeiten)
            </button>

            <button
              className={mode === "hardcore" ? "active" : ""}
              onClick={() => setMode("hardcore")}
            >
              Hardcore (selbst eingeben)
            </button>
          </div>
        </div>

        {/* Start Button */}
        <button className="startButton" onClick={startGame}>
          Spiel starten
        </button>
      </div>
    </main>
  );
}
