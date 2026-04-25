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
        <div className="flex justify-between items-center mb-1.5">
          <span className="text-xs font-bold" style={{ color: "var(--color-primary)" }}>Level {whole}</span>
          <span className="text-xs" style={{ color: "var(--color-faint)" }}>{pct}%</span>
        </div>
      )}
      <div
        className="w-full rounded-full overflow-hidden"
        style={{ height, background: "var(--color-border)" }}
      >
        <div
          className="h-full rounded-full transition-[width] duration-700 ease-out relative"
          style={{
            width: `${pct}%`,
            background: "linear-gradient(90deg, var(--color-primary), var(--color-purple))",
          }}
        >
          <div
            className="absolute inset-0 rounded-full opacity-30"
            style={{
              background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent)",
              backgroundSize: "200% 100%",
              animation: "progress-shine 2s infinite",
            }}
          />
        </div>
      </div>
    </div>
  );
}

export function BigLevel({ level }: { level: number }) {
  const whole = Math.floor(level);
  const frac  = level - whole;
  const pct   = Math.round(frac * 100);

  return (
    <div
      className="flex flex-col items-center gap-3 px-4 py-4 rounded-2xl border h-full justify-center"
      style={{
        background: "linear-gradient(180deg, var(--color-card-hi), var(--color-card))",
        borderColor: "var(--color-border)",
      }}
    >
      <div className="flex flex-col items-center gap-0.5">
        <div
          className="text-3xl md:text-4xl font-black leading-none"
          style={{ color: "var(--color-primary)", fontFamily: "var(--font-mono)" }}
        >
          {whole}
        </div>
        <div className="text-[10px] uppercase tracking-[0.15em] font-semibold" style={{ color: "var(--color-faint)" }}>
          Level
        </div>
      </div>

      <div className="w-full px-1">
        <div className="w-full h-1.5 rounded-full overflow-hidden" style={{ background: "var(--color-border)" }}>
          <div
            className="h-full rounded-full transition-[width] duration-700 ease-out relative"
            style={{
              width: `${pct}%`,
              background: "linear-gradient(90deg, var(--color-primary), var(--color-purple))",
            }}
          >
            <div
              className="absolute inset-0 rounded-full opacity-40"
              style={{
                background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.5), transparent)",
                backgroundSize: "200% 100%",
                animation: "progress-shine 2s infinite",
              }}
            />
          </div>
        </div>
      </div>

      <div className="text-[10px] font-medium" style={{ color: "var(--color-muted)" }}>
        {pct}% to level {whole + 1}
      </div>
    </div>
  );
}
