interface Props {
  level: number;   // e.g. 14.37
  showLabel?: boolean;
  height?: number;
}

export function LevelBar({ level, showLabel = true, height = 6 }: Props) {
  const whole   = Math.floor(level);
  const frac    = level - whole;
  const pct     = Math.round(frac * 100);

  return (
    <div className="w-full">
      {showLabel && (
        <div className="flex justify-between items-center mb-1">
          <span className="text-xs font-bold text-primary">Level {whole}</span>
          <span className="text-xs text-muted">{pct}%</span>
        </div>
      )}
      <div
        className="w-full bg-border rounded-full overflow-hidden"
        style={{ height }}
      >
        <div
          className="h-full rounded-full transition-[width] duration-500"
          style={{
            width: `${pct}%`,
            background: "linear-gradient(90deg, var(--color-primary), var(--color-purple))",
          }}
        />
      </div>
    </div>
  );
}

export function BigLevel({ level }: { level: number }) {
  const whole = Math.floor(level);
  const frac  = level - whole;
  const pct   = Math.round(frac * 100);

  return (
    <div className="flex flex-col items-center gap-2 px-4 py-3 bg-card-hi rounded-xl border border-border">
      <div
        className="text-4xl font-black"
        style={{ color: "var(--color-primary)" }}
      >
        {whole}
      </div>
      <div className="text-xs text-muted uppercase tracking-wider font-semibold">Level</div>
      <div className="w-full h-2 bg-border rounded-full overflow-hidden">
        <div
          className="h-full rounded-full"
          style={{
            width: `${pct}%`,
            background: "linear-gradient(90deg, var(--color-primary), var(--color-purple))",
          }}
        />
      </div>
      <div className="text-xs text-muted">{pct}% to level {whole + 1}</div>
    </div>
  );
}
