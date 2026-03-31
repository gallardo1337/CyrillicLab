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
  formatDurationMs,
} from "../../lib/gameUtils";

async function saveGameResultToSupabase({
  userId,
  score,
  totalQuestions,
  mode,
  alphabetType,
  durationMs,
  endedBy,
}) {
  const accuracy =
    totalQuestions > 0 ? Number(((score / totalQuestions) * 100).toFixed(2)) : 0;

  const isInfinity = mode === "infinity";

  const payload = {
    user_id: userId,
    alphabet: alphabetType,
    mode,
    score,
    total_questions: isInfinity ? score : totalQuestions,
    accuracy,
    duration_ms: durationMs,
    ended_by: endedBy,
    is_infinity: isInfinity,
  };

  const { error } = await supabase.from("game_results").insert(payload);

  if (error) {
    throw new Error(error.message);
  }
}

function GameContent() {
  const params = useSearchParams();
  const router = useRouter();

  const alphabetType = params.get("alphabet") || "ukrainian";
  const mode = params.get("mode") || "casual";
  const isInfinityMode = mode === "infinity";

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
  const [endedBy, setEndedBy] = useState("completed");
  const [elapsedMs, setElapsedMs] = useState(0);

  const hasSavedRef = useRef(false);
  const startTimeRef = useRef(null);
  const timerRef = useRef(null);

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
    if (isInfinityMode) {
      const first = alphabet[Math.floor(Math.random() * alphabet.length)];
      setQuestions(first ? [first] : []);
    } else {
      setQuestions(pickQuestions(alphabet, TOTAL_QUESTIONS));
    }

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
    setEndedBy("completed");
    setElapsedMs(0);

    startTimeRef.current = Date.now();
    hasSavedRef.current = false;
  }, [alphabet, mode, isInfinityMode]);

  useEffect(() => {
    if (showResult) {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      return;
    }

    if (!startTimeRef.current) return;

    timerRef.current = setInterval(() => {
      setElapsedMs(Date.now() - startTimeRef.current);
    }, 50);

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [showResult]);

  useEffect(() => {
    if (isInfinityMode) {
      setOptions([]);
      return;
    }

    if (
      mode !== "casual" ||
      activeQuestions.length === 0 ||
      currentIndex >= activeQuestions.length
    ) {
      setOptions([]);
      return;
    }

    setOptions(generateOptions(activeQuestions[currentIndex], alphabet, 3));
  }, [mode, activeQuestions, currentIndex, alphabet, isInfinityMode]);

  useEffect(() => {
    if (!showResult || hasSavedRef.current) return;

    hasSavedRef.current = true;

    if (!session?.user?.id) {
      setSaveStatus("guest");
      return;
    }

    setSaveStatus("saving");

    const totalQuestionsForSave = isInfinityMode
      ? score
      : questions.length + reviewQuestions.length;

    saveGameResultToSupabase({
      userId: session.user.id,
      score,
      totalQuestions: totalQuestionsForSave,
      mode,
      alphabetType,
      durationMs: elapsedMs,
      endedBy,
    })
      .then(() => setSaveStatus("saved"))
      .catch(() => setSaveStatus("error"));
  }, [
    showResult,
    score,
    mode,
    alphabetType,
    session,
    questions.length,
    reviewQuestions.length,
    elapsedMs,
    endedBy,
    isInfinityMode,
  ]);

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

  const totalForProgress = isInfinityMode ? Math.max(score + 1, 1) : activeQuestions.length;

  const addMistake = (question) => {
    setMistakes((prev) => {
      const exists = prev.some((item) => item.char === question.char);
      if (exists) return prev;
      return [...prev, question];
    });
  };

  const pushNextInfinityQuestion = () => {
    const next = alphabet[Math.floor(Math.random() * alphabet.length)];
    if (!next) return;

    setQuestions([next]);
    setCurrentIndex(0);
    setSelected(null);
    setInput("");
    setHardcoreFeedback(null);
  };

  const finishGame = (reason = "completed") => {
    setEndedBy(reason);
    setShowResult(true);
  };

  const nextQuestion = () => {
    if (isInfinityMode) {
      pushNextInfinityQuestion();
      return;
    }

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

    finishGame("completed");
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
      playWrongSound();
      if (!isInfinityMode) {
        addMistake(current);
      }
    }

    setSelected(input);
    setHardcoreFeedback({
      userInput: input.trim(),
      correctAnswers: current.answers,
      isCorrect: correct,
    });

    if (isInfinityMode) {
      if (!correct) {
        setTimeout(() => {
          finishGame("wrong_answer");
        }, 1400);
      } else {
        setTimeout(() => {
          nextQuestion();
        }, 900);
      }
      return;
    }

    setTimeout(() => {
      nextQuestion();
    }, 1400);
  };

  if (showResult) {
    const totalShown = isInfinityMode
      ? score
      : questions.length + reviewQuestions.length;

    return (
      <main className="container">
        <div className="card">
          <h1>Ergebnis</h1>

          <p className="resultMeta">
            {getAlphabetLabel(alphabetType)} • {getModeLabel(mode)}
          </p>

          <p className="score">
            {score} / {totalShown}
          </p>

          <p className="resultMeta">Zeit: {formatDurationMs(elapsedMs)}</p>

          {isInfinityMode && (
            <p className="resultMeta">
              Ende:{" "}
              {endedBy === "wrong_answer"
                ? "Durch Fehler"
                : endedBy === "manual_exit"
                  ? "Manuell beendet"
                  : "Beendet"}
            </p>
          )}

          {!isInfinityMode && (
            <p className="resultMeta">
              Fehlerbuchstaben in Extra-Runde: {reviewQuestions.length}
            </p>
          )}

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
          <span>
            {isInfinityMode
              ? "Endloslauf"
              : isReviewRound
                ? "Extra-Runde"
                : "Hauptrunde"}
          </span>
          <span>Punkte: {score}</span>
        </div>

        <div className="topbar topbarSecondary">
          <span>Zeit: {formatDurationMs(elapsedMs)}</span>
          {isInfinityMode && (
            <button
              type="button"
              className="smallActionButton"
              onClick={() => finishGame("manual_exit")}
            >
              Beenden
            </button>
          )}
        </div>

        {!isInfinityMode && (
          <ProgressBar current={currentIndex + 1} total={totalForProgress} />
        )}

        {isReviewRound && !isInfinityMode && (
          <div className="reviewBadge">Schwierige Buchstaben nochmal üben</div>
        )}

        {isInfinityMode && (
          <div className="reviewBadge infinityBadge">
            Infinity läuft bis zur ersten falschen Antwort
          </div>
        )}

        <div className="char">{current.char}</div>

        {mode === "casual" && !isInfinityMode && (
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

        {(mode === "hardcore" || isInfinityMode) && (
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
