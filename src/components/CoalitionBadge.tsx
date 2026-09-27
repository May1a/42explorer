import type { Coalition } from "../types";

interface Props {
  coalition?: Coalition;
  size?: "sm" | "md" | "lg";
}

export function CoalitionBadge({ coalition, size = "md" }: Props) {
  if (!coalition) return null;

  const px = { sm: "px-2 py-0.5 text-[11px]", md: "px-2.5 py-1 text-[11px]", lg: "px-2.5 py-1 text-[12px]" }[size];

  return (
    <span
      className={`inline-flex items-center gap-1.5 font-medium coalition-fg coalition-tick ${px}`}
      style={{
        ["--coalition" as any]: coalition.color,
        border: `1px solid color-mix(in srgb, ${coalition.color} 28%, var(--color-border))`,
        borderRadius: 3,
        fontFamily: "var(--font-mono)",
        background: "var(--color-surface)",
      }}
    >
      {coalition.image_url && (
        <img src={coalition.image_url} alt="" className="w-3 h-3 object-contain" />
      )}
      {coalition.name}
    </span>
  );
}

/** Thin color bar used on student cards */
export function CoalitionStripe({ color }: { color?: string }) {
  if (!color) return null;
  return (
    <div
      className="absolute inset-x-0 top-0"
      style={{ height: 2, background: color }}
    />
  );
}
