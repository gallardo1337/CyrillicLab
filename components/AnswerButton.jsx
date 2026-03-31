export default function AnswerButton({
  children,
  onClick,
  className = "",
  disabled = false,
}) {
  return (
    <button
      type="button"
      className={`answerButton ${className}`.trim()}
      onClick={onClick}
      disabled={disabled}
    >
      {children}
    </button>
  );
}
