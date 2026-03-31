"use client";

import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { ukrainianAlphabet, russianAlphabet } from "../../lib/alphabetData";
import ProgressBar from "../../components/ProgressBar";
import AnswerButton from "../../components/AnswerButton";
import { supabase } from "../../lib/supabase";
import {
  TOTAL_QUESTIONS,
  pickQuestions,
  generateOptions,
  isCorrectAnswer,
  getAlphabetLabel,
  getModeLabel,
  normalize,
} from "../../lib/gameUtils";

const STORAGE_KEY = "cyrillic-lab-stats";

function saveLocalStats({ score, totalQuestions, mode, alphabetType }) {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const existing = raw
      ? JSON.parse(raw)
      : {
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

    const nextStats = {
      ...existing,
      totalGames: (existing.totalGames || 0) + 1,
      totalCorrect: (existing.totalCorrect || 0) + score,
      totalQuestions: (existing.totalQuestions || 0) + totalQuestions,
      bestScore: Math.max(existing.bestScore || 0, score),
      lastScore: score,
      casualGames:
        (existing.casualGames || 0) + (mode === "casual" ? 1 : 0),
      hardcoreGames:
        (existing.hardcoreGames || 0) + (mode === "hardcore" ? 1 : 0),
      ukrainianGames:
        (existing.ukrainianGames || 0) +
        (alphabetType === "ukrainian" ? 1 : 0),
      russianGames:
        (existing.russianGames || 0) + (alphabetType === "russian" ? 1 : 0),
    };

    localStorage.setItem(STORAGE_KEY, JSON.stringify(nextStats));
  } catch {
    // absichtlich still
  }
}

async function saveGameResultToSupabase({
  score,
  totalQuestions,
  mode,
  alphabetType,
}) {
  const accuracy =
    totalQuestions > 0 ? Number(((score / totalQuestions) * 100).toFixed(2)) : 0;

  const { error } = await supabase.from("game_results").insert({
    alphabet: alphabetType,
    mode,
    score,
    total_questions: totalQuestions,
    accuracy,
  });

  if (error) {
    console.error("Supabase insert error:", error.message);
  }
}

function GameContent() {
  const params = useSearchParams();
  const router = useRouter();

  const alphabetType = params.get("alphabet") || "ukrainian";
  const mode = params.get("mode") || "casual";

  const alphabet = useMemo(() => {
    return alphabetType === "russian" ? russianAlphabet : ukrainianAlphabet;
  }, [alphabetType]);

  const [questions, setQuestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [selected, setSelected] = useState(null);
  const [input, setInput] = useState("");
  const [showResult, setShowResult] = useState(false);
  const [options, setOptions] = useState([]);
  const [saveStatus, setSaveStatus] = useState("idle");
  const hasSavedRef = useRef(false);

  useEffect(() => {
    const picked = pickQuestions(alphabet, TOTAL_QUESTIONS);

    setQuestions(picked);
    setCurrentIndex(0);
    setScore(0);
    setSelected(null);
    setInput("");
    setShowResult(false);
    setSaveStatus("idle");
    hasSavedRef.current = false;
  }, [alphabet, mode]);

  useEffect(() => {
    if (
      mode !== "casual" ||
      questions.length === 0 ||
      currentIndex >= questions.length
    ) {
      setOptions([]);
      return;
    }

    setOptions(generateOptions(questions[currentIndex], alphabet, 3));
  }, [mode, questions, currentIndex, alphabet]);

  useEffect(() => {
    if (!showResult || hasSavedRef.current) return;

    hasSavedRef.current = true;

    saveLocalStats({
      score,
      totalQuestions: TOTAL_QUESTIONS,
      mode,
      alphabetType,
    });

    setSaveStatus("saving");

    saveGameResultToSupabase({
      score,
      totalQuestions: TOTAL_QUESTIONS,
      mode,
      alphabetType,
    })
      .then(() => setSaveStatus("saved"))
      .catch(() => setSaveStatus("error"));
  }, [showResult, score, mode, alphabetType]);

  if (questions.length === 0) {
    return (
      <main className="container">
        <div className="card">
          <h1>Lade Spiel...</h1>
        </div>
      </main>
    );
  }

  const current = questions[currentIndex];

  const nextQuestion = () => {
    setSelected(null);
    setInput("");

    if (currentIndex + 1 >= TOTAL_QUESTIONS) {
      setShowResult(true);
    } else {
      setCurrentIndex((prev) => prev + 1);
    }
  };

  const handleAnswer = (answer) => {
    if (selected !== null) return;

    const correct = isCorrectAnswer(answer, current.answers);

    if (correct) {
      setScore((prev) => prev + 1);
    }

    setSelected(answer);

    setTimeout(() => {
      nextQuestion();
    }, 800);
  };

  const handleSubmit = () => {
    if (selected !== null) return;

    const cleanedInput = normalize(input);
    if (!cleanedInput) return;

    const correct = isCorrectAnswer(cleanedInput, current.answers);

    if (correct) {
      setScore((prev) => prev + 1);
    }

    setSelected(input);

    setTimeout(() => {
      nextQuestion();
    }, 800);
  };

  if (showResult) {
    return (
      <main className="container">
        <div className="card">
          <h1>Ergebnis</h1>

          <p className="resultMeta">
            {getAlphabetLabel(alphabetType)} • {getModeLabel(mode)}
          </p>

          <p className="score">
            {score} / {TOTAL_QUESTIONS}
          </p>

          <p className="resultMeta">
            {saveStatus === "saving" && "Speichere Ergebnis..."}
            {saveStatus === "saved" && "Ergebnis gespeichert."}
            {saveStatus === "error" && "Speichern fehlgeschlagen."}
          </p>

          <div className="resultActions">
            <button type="button" onClick={() => router.push("/")}>
              Zurück zum Menü
            </button>

            <button
              type="button"
              onClick={() =>
                router.push(`/game?alphabet=${alphabetType}&mode=${mode}`)
              }
            >
              Nochmal spielen
            </button>

            <Link href="/stats" className="linkButton">
              Statistik ansehen
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="container">
      <div className="card">
        <div className="topbar">
          <span>{getAlphabetLabel(alphabetType)}</span>
          <span>{getModeLabel(mode)}</span>
          <span>Punkte: {score}</span>
        </div>

        <ProgressBar current={currentIndex + 1} total={TOTAL_QUESTIONS} />

        <div className="char">{current.char}</div>

        {mode === "casual" && (
          <div className="options">
            {options.map((opt, i) => {
              const correct = current.answers[0];
              const isCorrect = normalize(opt) === normalize(correct);
              const isSelected = selected === opt;

              let className = "";
              if (selected !== null) {
                if (isCorrect) className = "correct";
                else if (isSelected) className = "wrong";
              }

              return (
                <AnswerButton
                  key={`${opt}-${i}`}
                  className={className}
                  disabled={selected !== null}
                  onClick={() => handleAnswer(opt)}
                >
                  {opt}
                </AnswerButton>
              );
            })}
          </div>
        )}

        {mode === "hardcore" && (
          <div className="inputArea">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Antwort eingeben..."
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSubmit();
              }}
            />

            <AnswerButton
              onClick={handleSubmit}
              disabled={selected !== null}
            >
              Prüfen
            </AnswerButton>
          </div>
        )}

        <div className="bottomLinks">
          <Link href="/" className="textLink">
            Menü
          </Link>
          <Link href="/stats" className="textLink">
            Statistik
          </Link>
        </div>
      </div>
    </main>
  );
}

export default function GamePage() {
  return (
    <Suspense
      fallback={
        <main className="container">
          <div className="card">
            <h1>Lade Spiel...</h1>
          </div>
        </main>
      }
    >
      <GameContent />
    </Suspense>
  );
}
