"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { ukrainianAlphabet, russianAlphabet } from "../../lib/alphabetData";

const TOTAL_QUESTIONS = 10;

function normalize(input) {
  return input.trim().toLowerCase();
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

  useEffect(() => {
    const shuffled = [...alphabet].sort(() => Math.random() - 0.5);
    const picked = shuffled.slice(0, TOTAL_QUESTIONS);

    setQuestions(picked);
    setCurrentIndex(0);
    setScore(0);
    setSelected(null);
    setInput("");
    setShowResult(false);
  }, [alphabet]);

  useEffect(() => {
    if (
      mode !== "casual" ||
      questions.length === 0 ||
      currentIndex >= questions.length
    ) {
      setOptions([]);
      return;
    }

    const current = questions[currentIndex];
    const correct = current.answers[0];

    const wrong = alphabet
      .filter((letter) => letter.answers[0] !== correct)
      .sort(() => Math.random() - 0.5)
      .slice(0, 2)
      .map((letter) => letter.answers[0]);

    const mixedOptions = [...wrong, correct].sort(() => Math.random() - 0.5);
    setOptions(mixedOptions);
  }, [mode, questions, currentIndex, alphabet]);

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

    const correctAnswers = current.answers.map((a) => normalize(a));
    const isCorrect = correctAnswers.includes(normalize(answer));

    if (isCorrect) {
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

    const correctAnswers = current.answers.map((a) => normalize(a));
    const isCorrect = correctAnswers.includes(cleanedInput);

    if (isCorrect) {
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
          <p className="score">
            {score} / {TOTAL_QUESTIONS}
          </p>

          <button onClick={() => router.push("/")}>Zurück zum Menü</button>

          <button
            onClick={() =>
              router.push(`/game?alphabet=${alphabetType}&mode=${mode}`)
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
                <button
                  key={`${opt}-${i}`}
                  className={className}
                  onClick={() => handleAnswer(opt)}
                >
                  {opt}
                </button>
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
            <button onClick={handleSubmit}>Prüfen</button>
          </div>
        )}
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
