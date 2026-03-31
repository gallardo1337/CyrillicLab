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
  const [reviewQuestions, setReviewQuestions] = useState([]);
  const [isReviewRound, setIsReviewRound] = useState(false);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [selected, setSelected] = useState(null);
  const [input, setInput] = useState("");
  const [showResult, setShowResult] = useState(false);
  const [options, setOptions] = useState([]);
  const [saveStatus, setSaveStatus] = useState("idle");
  const [sessionChecked, setSessionChecked] = useState(false);
  const [session, setSession] = useState(null);
  const [hardcoreFeedback, setHardcoreFeedback] = useState(null);
  const [mistakes, setMistakes] = useState([]);
  const hasSavedRef = useRef(false);

  const activeQuestions = isReviewRound ? reviewQuestions : questions;
  const current = activeQuestions[currentIndex];

  useEffect(() => {
    let mounted = true;

    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return;
      setSession(data.session || null);
      setSessionChecked(true);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession || null);
      setSessionChecked(true);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    const picked = pickQuestions(alphabet, TOTAL_QUESTIONS);

    setQuestions(picked);
    setReviewQuestions([]);
    setIsReviewRound(false);
    setCurrentIndex(0);
    setScore(0);
    setSelected(null);
    setInput("");
    setShowResult(false);
    setOptions([]);
    setSaveStatus("idle");
    setHardcoreFeedback(null);
    setMistakes([]);
    hasSavedRef.current = false;
  }, [alphabet, mode]);

  useEffect(() => {
    if (
      mode !== "casual" ||
      activeQuestions.length === 0 ||
      currentIndex >= activeQuestions.length
    ) {
      setOptions([]);
      return;
    }

    setOptions(generateOptions(activeQuestions[currentIndex], alphabet, 3));
  }, [mode, activeQuestions, currentIndex, alphabet]);

  useEffect(() => {
    if (!showResult || hasSavedRef.current) return;

    hasSavedRef.current = true;

    if (!session?.user?.id) {
      setSaveStatus("guest");
      return;
    }

    setSaveStatus("saving");

    saveGameResultToSupabase({
      userId: session.user.id,
      score,
      totalQuestions: questions.length,
      mode,
      alphabetType,
    })
      .then(() => setSaveStatus("saved"))
      .catch(() => setSaveStatus("error"));
  }, [showResult, score, mode, alphabetType, session, questions.length]);

  if (!sessionChecked) {
    return (
      <main className="container">
        <div className="card">
          <h1>Lade Spiel...</h1>
        </div>
      </main>
    );
  }

  if (activeQuestions.length === 0 || !current) {
    return (
      <main className="container">
        <div className="card">
          <h1>Lade Spiel...</h1>
        </div>
      </main>
    );
  }

  const totalForProgress = activeQuestions.length;

  const addMistake = (question) => {
    setMistakes((prev) => {
      const exists = prev.some((item) => item.char === question.char);
      if (exists) return prev;
      return [...prev, question];
    });
  };

  const nextQuestion = () => {
    setSelected(null);
    setInput("");
    setHardcoreFeedback(null);

    const isLastQuestion = currentIndex + 1 >= activeQuestions.length;

    if (!isLastQuestion) {
      setCurrentIndex((prev) => prev + 1);
      return;
    }

    if (!isReviewRound && mistakes.length > 0) {
      setReviewQuestions(mistakes);
      setIsReviewRound(true);
      setCurrentIndex(0);
      setSelected(null);
      setInput("");
      setHardcoreFeedback(null);
      return;
    }

    setShowResult(true);
  };

  const handleAnswer = (answer) => {
    if (selected !== null) return;

    const correct = isCorrectAnswer(answer, current.answers);

    if (correct) {
      setScore((prev) => prev + 1);
      playCorrectSound();
    } else {
      addMistake(current);
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
      addMistake(current);
      playWrongSound();
    }

    setSelected(input);
    setHardcoreFeedback({
      userInput: input.trim(),
      correctAnswers: current.answers,
      isCorrect: correct,
    });

    setTimeout(() => {
      nextQuestion();
    }, 1400);
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
            {score} / {questions.length + reviewQuestions.length}
          </p>

          <p className="resultMeta">
            Fehlerbuchstaben in Extra-Runde: {reviewQuestions.length}
          </p>

          <p className="resultMeta">
            {saveStatus === "guest" &&
              "Gastmodus: Ergebnis wurde nicht gespeichert."}
            {saveStatus === "saving" && "Speichere Ergebnis..."}
            {saveStatus === "saved" && "Ergebnis gespeichert."}
            {saveStatus === "error" && "Speichern fehlgeschlagen."}
          </p>

          {!session && (
            <div className="authBox" style={{ marginTop: 18 }}>
              <p className="authInfo">
                Melde dich an, damit deine nächsten Ergebnisse gespeichert
                werden.
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
          )}

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
          <span>{isReviewRound ? "Extra-Runde" : "Hauptrunde"}</span>
          <span>Punkte: {score}</span>
        </div>

        <ProgressBar current={currentIndex + 1} total={totalForProgress} />

        {isReviewRound && (
          <div className="reviewBadge">Schwierige Buchstaben nochmal üben</div>
        )}

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
              disabled={selected !== null}
            />

            <AnswerButton
              onClick={handleSubmit}
              disabled={selected !== null}
            >
              Prüfen
            </AnswerButton>

            {hardcoreFeedback && (
              <div
                className={`hardcoreFeedback ${
                  hardcoreFeedback.isCorrect ? "feedbackCorrect" : "feedbackWrong"
                }`}
              >
                <p>
                  <strong>Deine Eingabe:</strong>{" "}
                  {hardcoreFeedback.userInput || "—"}
                </p>
                <p>
                  <strong>Richtige Antwort:</strong>{" "}
                  {hardcoreFeedback.correctAnswers.join(" / ")}
                </p>
              </div>
            )}
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
