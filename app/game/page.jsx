"use client";

import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { ukrainianAlphabet, russianAlphabet } from "../../lib/alphabetData";
import ProgressBar from "../../components/ProgressBar";
import AnswerButton from "../../components/AnswerButton";
import { supabase } from "../../lib/supabase";
import { playCorrectSound, playWrongSound } from "../../lib/sound";
import {
  TOTAL_QUESTIONS,
  pickQuestions,
  generateOptions,
  isCorrectAnswer,
  getAlphabetLabel,
  getModeLabel,
  normalize,
} from "../../lib/gameUtils";

async function saveGameResultToSupabase({
  userId,
  score,
  totalQuestions,
  mode,
  alphabetType,
}) {
  const accuracy =
    totalQuestions > 0 ? Number(((score / totalQuestions) * 100).toFixed(2)) : 0;

  const { error } = await supabase.from("game_results").insert({
    user_id: userId,
    alphabet: alphabetType,
    mode,
    score,
    total_questions: totalQuestions,
    accuracy,
  });

  if (error) {
    throw new Error(error.message);
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
  const [sessionChecked, setSessionChecked] = useState(false);
  const [session, setSession] = useState(null);
  const hasSavedRef = useRef(false);

  useEffect(() => {
    let mounted = true;

    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return;

      const currentSession = data.session || null;
      setSession(currentSession);
      setSessionChecked(true);

      if (!currentSession) {
        router.push("/login");
      }
    });

    return () => {
      mounted = false;
    };
  }, [router]);

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
    if (!showResult || hasSavedRef.current || !session?.user?.id) return;

    hasSavedRef.current = true;
    setSaveStatus("saving");

    saveGameResultToSupabase({
      userId: session.user.id,
      score,
      totalQuestions: TOTAL_QUESTIONS,
      mode,
      alphabetType,
    })
      .then(() => setSaveStatus("saved"))
      .catch(() => setSaveStatus("error"));
  }, [showResult, score, mode, alphabetType, session]);

  if (!sessionChecked || !session) {
    return (
      <main className="container">
        <div className="card">
          <h1>Lade Spiel...</h1>
        </div>
      </main>
    );
  }

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
      playCorrectSound();
    } else {
      playWrongSound();
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
      playCorrectSound();
    } else {
      playWrongSound();
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
              Meine Statistik
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
              const correctAnswer = current.answers[0];
              const isCorrect = normalize(opt) === normalize(correctAnswer);
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
            Meine Statistik
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
