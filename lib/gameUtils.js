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
  return mode === "hardcore" ? "Hardcore" : "Casual";
}
