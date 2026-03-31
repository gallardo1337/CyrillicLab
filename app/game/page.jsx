"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { ukrainianAlphabet, russianAlphabet } from "../../lib/alphabetData";

const TOTAL_QUESTIONS = 10;

function normalize(input) {
  return input.trim().toLowerCase();
}

export default function Game() {
  const params = useSearchParams();
  const router = useRouter();

  const alphabetType = params.get("alphabet") || "ukrainian";
  const mode = params.get("mode") || "casual";

  const alphabet =
    alphabetType === "russian" ? russianAlphabet : ukrainianAlphabet;

  const [questions, setQuestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [selected, setSelected] = useState(null);
  const [input, setInput] = useState("");
  const [showResult, setShowResult] = useState(false);

  // Fragen generieren
  useEffect(() => {
    const shuffled = [...alphabet].sort(() => Math.random() - 0.5);
    setQuestions(shuffled.slice(0, TOTAL_QUESTIONS));
  }, [alphabetType]);

  if (questions.length === 0) return null;

  const current = questions[currentIndex];

  // Casual Antworten erzeugen
  const getOptions = () => {
    const correct = current.answers[0];

    const wrong = alphabet
      .filter((l) => l.answers[0] !== correct)
      .sort(() => Math.random() - 0.5)
      .slice(0, 2)
      .map((l) => l.answers[0]);

    return [...wrong, correct].sort(() => Math.random() - 0.5);
  };

  const options = mode === "casual" ? getOptions() : [];

  const handleAnswer = (answer) => {
    if (selected) return;

    const correctAnswers = current.answers.map((a) => normalize(a));
    const isCorrect = correctAnswers.includes(normalize(answer));

    if (isCorrect) setScore((s) => s + 1);

    setSelected(answer);

    setTimeout(() => nextQuestion(), 800);
  };

  const handleSubmit = () => {
    const correctAnswers = current.answers.map((a) => normalize(a));
    const isCorrect = correctAnswers.includes(normalize(input));

    if (isCorrect) setScore((s) => s + 1);

    setSelected(input);

    setTimeout(() => nextQuestion(), 800);
  };

  const nextQuestion = () => {
    setSelected(null);
    setInput("");

    if (currentIndex + 1 >= TOTAL_QUESTIONS) {
      setShowResult(true);
    } else {
      setCurrentIndex((i) => i + 1);
    }
  };

  if (showResult) {
    return (
      <main className="container">
        <div className="card">
          <h1>Ergebnis</h1>
          <p className="score">
            {score} / {TOTAL_QUESTIONS}
          </p>

          <button onClick={() => router.push("/")}>
            Zurück zum Menü
          </button>

          <button
            onClick={() =>
              router.push(
                `/game?alphabet=${alphabetType}&mode=${mode}`
              )
            }
          >
            Nochmal spielen
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="container">
      <div className="card">
        <div className="topbar">
          <span>
            {currentIndex + 1} / {TOTAL_QUESTIONS}
          </span>
          <span>Punkte: {score}</span>
        </div>

        <div className="char">{current.char}</div>

        {/* CASUAL */}
        {mode === "casual" && (
          <div className="options">
            {options.map((opt, i) => {
              const correct = current.answers[0];
              const isCorrect = normalize(opt) === normalize(correct);
              const isSelected = selected === opt;

              let className = "";
              if (selected) {
                if (isCorrect) className = "correct";
                else if (isSelected) className = "wrong";
              }

              return (
                <button
                  key={i}
                  className={className}
                  onClick={() => handleAnswer(opt)}
                >
                  {opt}
                </button>
              );
            })}
          </div>
        )}

        {/* HARDCORE */}
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

            <button onClick={handleSubmit}>Prüfen</button>
          </div>
        )}
      </div>
    </main>
  );
}
