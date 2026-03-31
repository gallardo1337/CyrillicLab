export const TOTAL_QUESTIONS = 10;

export function normalize(input) {
  return String(input || "").trim().toLowerCase();
}

export function shuffleArray(array) {
  return [...array].sort(() => Math.random() - 0.5);
}

export function pickQuestions(alphabet, total = TOTAL_QUESTIONS) {
  return shuffleArray(alphabet).slice(0, total);
}

export function generateOptions(current, alphabet, amount = 3) {
  const correct = current.answers[0];

  const wrong = shuffleArray(
    alphabet.filter((letter) => letter.answers[0] !== correct)
  )
    .slice(0, amount - 1)
    .map((letter) => letter.answers[0]);

  return shuffleArray([...wrong, correct]);
}

export function isCorrectAnswer(userInput, answers) {
  const normalizedInput = normalize(userInput);
  const normalizedAnswers = answers.map((answer) => normalize(answer));
  return normalizedAnswers.includes(normalizedInput);
}

export function getAlphabetLabel(alphabetType) {
  return alphabetType === "russian" ? "Russisch" : "Ukrainisch";
}

export function getModeLabel(mode) {
  if (mode === "hardcore") return "Hardcore";
  if (mode === "infinity") return "Infinity";
  return "Casual";
}

export function formatDurationMs(ms) {
  const totalMs = Math.max(0, Number(ms || 0));
  const totalSeconds = Math.floor(totalMs / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  const centiseconds = Math.floor((totalMs % 1000) / 10);

  const mm = String(minutes).padStart(2, "0");
  const ss = String(seconds).padStart(2, "0");
  const cc = String(centiseconds).padStart(2, "0");

  return `${mm}:${ss}.${cc}`;
}
