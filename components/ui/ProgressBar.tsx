interface Props {
  value: number;
  max: number;
  /** Screen-reader description, e.g. "Lesson progress". */
  label: string;
  className?: string;
}

export function ProgressBar({ value, max, label, className = "" }: Props) {
  const safeMax = Math.max(1, max);
  const pct = Math.round((Math.min(value, safeMax) / safeMax) * 100);
  return (
    <div
      role="progressbar"
      aria-label={label}
      aria-valuenow={value}
      aria-valuemin={0}
      aria-valuemax={max}
      className={`h-1 w-full overflow-hidden rounded-full bg-track ${className}`}
    >
      <div className="h-full rounded-full bg-green" style={{ width: `${pct}%` }} />
    </div>
  );
}
