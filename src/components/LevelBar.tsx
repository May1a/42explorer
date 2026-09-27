interface Props {
  level: number;
  showLabel?: boolean;
  height?: number;
}

export function LevelBar({ level, showLabel = true, height = 2 }: Props) {
  const whole = Math.floor(level);
  const frac  = level - whole;
  const pct   = Math.round(frac * 100);

  return (
    <div className="w-full">
      {showLabel && (
        <div className="flex justify-between items-center mb-1.5">
          <span className="text-[12.5px] font-medium num" style={{ color: "var(--color-ink)" }}>
            Level {whole}
          </span>
          <span className="text-[11.5px] num" style={{ color: "var(--color-faint)" }}>{pct}%</span>
        </div>
      )}
      <div className="w-full overflow-hidden" style={{ height, background: "var(--color-border)" }}>
        <div
          className="h-full transition-[width] duration-500 ease-out"
          style={{ width: `${pct}%`, background: "var(--color-primary)" }}
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
    <div
      className="flex flex-col items-center gap-3 px-5 py-5 h-full justify-center"
      style={{
        background: "var(--color-surface)",
        border: "1px solid var(--color-border)",
        borderRadius: 4,
      }}
    >
      <div className="flex flex-col items-center gap-0.5">
        <div
          className="text-[36px] font-semibold leading-none tracking-tight num"
          style={{ color: "var(--color-ink)" }}
        >
          {whole}
        </div>
        <div className="text-[11.5px] font-medium" style={{ color: "var(--color-faint)" }}>
          Level
        </div>
      </div>

      <div className="w-full">
        <div className="w-full h-0.5 overflow-hidden" style={{ background: "var(--color-border)" }}>
          <div
            className="h-full transition-[width] duration-500 ease-out"
            style={{ width: `${pct}%`, background: "var(--color-primary)" }}
          />
        </div>
      </div>

      <div className="text-[12px]" style={{ color: "var(--color-muted)" }}>
        {pct}% to level {whole + 1}
      </div>
    </div>
  );
}
