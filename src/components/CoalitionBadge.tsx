import type { Coalition } from "../types";

interface Props {
  coalition?: Coalition;
  size?: "sm" | "md" | "lg";
}

export function CoalitionBadge({ coalition, size = "md" }: Props) {
  if (!coalition) return null;

  const px = { sm: "px-2 py-0.5 text-[11px]", md: "px-2.5 py-1 text-xs", lg: "px-3 py-1.5 text-sm" }[size];

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full font-semibold ${px}`}
      style={{
        background: `${coalition.color}22`,
        color:       coalition.color,
        border:     `1px solid ${coalition.color}44`,
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
  return <div className="absolute inset-x-0 top-0 h-0.5 rounded-t-xl" style={{ background: color }} />;
}
