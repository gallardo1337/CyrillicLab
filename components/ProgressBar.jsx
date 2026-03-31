export default function ProgressBar({ current, total }) {
  const safeTotal = total > 0 ? total : 1;
  const percentage = Math.min((current / safeTotal) * 100, 100);

  return (
    <div className="progressWrap" aria-label="Fortschritt">
      <div className="progressMeta">
        <span>
          Frage {current} von {total}
        </span>
        <span>{Math.round(percentage)}%</span>
      </div>

      <div className="progressTrack">
        <div
          className="progressFill"
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}
