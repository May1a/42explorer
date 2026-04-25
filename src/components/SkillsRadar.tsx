import type { Skill } from "../types";

interface Props {
  skills: Skill[];
  size?: number;
}

export function SkillsRadar({ skills, size = 260 }: Props) {
  if (!skills.length) {
    return <div className="text-muted text-sm text-center py-8">No skills data</div>;
  }

  // Take top 8 skills by level
  const top = [...skills].sort((a, b) => b.level - a.level).slice(0, 8);
  const max  = 21; // max level in 42
  const cx   = size / 2;
  const cy   = size / 2;
  const r    = (size / 2) * 0.75;
  const n    = top.length;

  function toXY(i: number, radius: number) {
    const angle = (i / n) * Math.PI * 2 - Math.PI / 2;
    return { x: cx + radius * Math.cos(angle), y: cy + radius * Math.sin(angle) };
  }

  // Background rings
  const rings = [0.25, 0.5, 0.75, 1].map(frac => {
    const pts = top.map((_, i) => {
      const { x, y } = toXY(i, r * frac);
      return `${x},${y}`;
    });
    return pts.join(" ");
  });

  // Data polygon
  const dataPoints = top.map((skill, i) => {
    const pct = Math.min(skill.level / max, 1);
    return toXY(i, r * pct);
  });
  const polyPoints = dataPoints.map(p => `${p.x},${p.y}`).join(" ");

  // Axis lines
  const axes = top.map((_, i) => toXY(i, r));

  return (
    <div className="flex flex-col items-center gap-3">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="max-w-full h-auto">
        {/* Rings */}
        {rings.map((pts, ri) => (
          <polygon
            key={ri}
            points={pts}
            fill="none"
            stroke="var(--color-border)"
            strokeWidth="1"
          />
        ))}

        {/* Axis lines */}
        {axes.map((pt, i) => (
          <line
            key={i}
            x1={cx} y1={cy}
            x2={pt.x} y2={pt.y}
            stroke="var(--color-border)"
            strokeWidth="1"
          />
        ))}

        {/* Data polygon */}
        <polygon
          points={polyPoints}
          className="radar-polygon radar-polygon-stroke"
          strokeWidth="2"
        />

        {/* Data dots */}
        {dataPoints.map((pt, i) => (
          <circle
            key={i}
            cx={pt.x} cy={pt.y} r="3"
            fill="var(--color-primary)"
          />
        ))}

        {/* Labels */}
        {top.map((skill, i) => {
          const labelR = r + 18;
          const { x, y } = toXY(i, labelR);
          return (
            <text
              key={i}
              x={x} y={y}
              textAnchor="middle"
              dominantBaseline="middle"
              fontSize="10"
              fill="var(--color-muted)"
            >
              {skill.name.length > 14 ? skill.name.slice(0, 13) + "…" : skill.name}
            </text>
          );
        })}
      </svg>

      {/* Legend */}
      <div className="w-full grid grid-cols-2 gap-1">
        {top.map(skill => (
          <div key={skill.id} className="flex items-center justify-between gap-2 text-[11px] md:text-xs">
            <span className="text-muted truncate">{skill.name}</span>
            <span className="text-primary font-mono font-semibold shrink-0">
              {skill.level.toFixed(2)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
