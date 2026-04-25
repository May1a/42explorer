import { useMySlots } from "../api/slots";

export function SlotsPage() {
  const { data, isLoading, error } = useMySlots({ "page.size": 100 });

  const slots = data?.data ?? [];

  return (
    <div className="p-4 md:p-6 max-w-5xl mx-auto space-y-4 md:space-y-6">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <h1 className="text-base md:text-lg font-bold tracking-widest uppercase" style={{ fontFamily: "var(--font-mono)", color: "#e2e8f0" }}>
          &gt; SLOTS_
        </h1>
        <span className="text-xs" style={{ color: "var(--color-faint)", fontFamily: "var(--font-mono)" }}>
          {slots.length} slots
        </span>
      </div>

      {isLoading && (
        <div className="space-y-2">
          {[1,2,3].map(i => <div key={i} className="skeleton h-14 w-full rounded-xl" />)}
        </div>
      )}

      {error && (
        <div
          className="rounded-xl border p-4"
          style={{ background: "var(--color-card)", borderColor: "var(--color-red)" }}
        >
          <div className="text-sm font-bold" style={{ color: "var(--color-red)" }}>Error</div>
          <div className="text-xs mt-1" style={{ color: "var(--color-muted)" }}>{(error as Error).message}</div>
        </div>
      )}

      {!isLoading && !error && !slots.length && (
        <p className="text-xs text-center py-12" style={{ color: "var(--color-faint)" }}>
          No slots available
        </p>
      )}

      <div className="space-y-1.5">
        {slots.map((s: any) => (
          <div
            key={s.id}
            className="rounded-lg border px-3 py-2 flex items-center justify-between"
            style={{ background: "var(--color-card)", borderColor: "var(--color-border)" }}
          >
            <div className="flex items-center gap-2 min-w-0">
              <span
                className="text-xs font-mono font-semibold shrink-0"
                style={{ fontFamily: "var(--font-mono)", color: "var(--color-primary)" }}
              >
                {s.scale ? s.scale.name : `Slot #${s.id}`}
              </span>
              <span className="text-[10px]" style={{ color: "var(--color-faint)" }}>
                {s.user?.login ?? ""}
              </span>
            </div>
            {s.begin_at && (
              <span className="text-[10px] shrink-0" style={{ color: "var(--color-faint)", fontFamily: "var(--font-mono)" }}>
                {new Date(s.begin_at).toLocaleString()}
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
