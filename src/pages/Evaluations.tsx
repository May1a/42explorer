import { useState } from "react";
import { useMyScaleTeams } from "../api/scale-teams";
import type { ScaleTeam } from "../types";

type Tab = "as_corrector" | "as_corrected";

export function EvaluationsPage() {
  const [tab, setTab] = useState<Tab>("as_corrected");

  const { data: corrByData, isLoading: corrByLoad } = useMyScaleTeams("as_corrected");
  const { data: corrForData, isLoading: corrForLoad } = useMyScaleTeams("as_corrector");

  const items = tab === "as_corrected" ? corrByData?.data : corrForData?.data;
  const loading = tab === "as_corrected" ? corrByLoad : corrForLoad;

  return (
    <div className="p-4 md:p-6 max-w-5xl mx-auto space-y-4 md:space-y-6">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <h1 className="text-base md:text-lg font-bold tracking-widest uppercase" style={{ fontFamily: "var(--font-mono)", color: "#e2e8f0" }}>
          &gt; EVALUATIONS_
        </h1>
        <span className="text-xs" style={{ color: "var(--color-faint)", fontFamily: "var(--font-mono)" }}>
          {items?.length ?? 0} evaluations
        </span>
      </div>

      <div className="flex gap-2">
        {(["as_corrected", "as_corrector"] as Tab[]).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className="text-xs font-bold px-3 py-1.5 rounded-lg uppercase tracking-wider transition-all"
            style={{
              background: tab === t ? "var(--color-primary)" : "var(--color-card-hi)",
              color: tab === t ? "#000" : "var(--color-muted)",
            }}
          >
            {t === "as_corrected" ? "To Be Evaluated" : "I'm Evaluating"}
          </button>
        ))}
      </div>

      {loading && (
        <div className="space-y-2">
          {[1,2,3].map(i => <div key={i} className="skeleton h-16 w-full rounded-xl" />)}
        </div>
      )}

      {!loading && !items?.length && (
        <p className="text-xs text-center py-12" style={{ color: "var(--color-faint)" }}>
          No evaluations found
        </p>
      )}

      <div className="space-y-2">
        {(items ?? []).map(ev => (
          <EvalCard key={ev.id} eval={ev} />
        ))}
      </div>
    </div>
  );
}

function EvalCard({ eval: ev }: { eval: ScaleTeam }) {
  const filled = ev.filled_at != null;
  const mark = ev.final_mark;
  const kind = typeof ev.corrector === "string" ? "auto" : "peer";

  return (
    <div
      className="rounded-xl border p-3 md:p-4"
      style={{ background: "var(--color-card)", borderColor: "var(--color-border)" }}
    >
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span
              className="text-[10px] font-bold uppercase px-1.5 py-0.5 rounded"
              style={{
                color: filled ? "var(--color-green)" : "var(--color-yellow)",
                background: `color-mix(in srgb, ${filled ? "var(--color-green)" : "var(--color-yellow)"} 12%, transparent)`,
              }}
            >
              {filled ? "Filled" : "Pending"}
            </span>
            <span className="text-[10px] font-bold uppercase px-1.5 py-0.5 rounded" style={{ color: "var(--color-faint)", background: "var(--color-card-hi)" }}>
              {kind}
            </span>
          </div>

          <div className="text-sm font-semibold text-[#e2e8f0] mt-1.5">
            {ev.scale?.name ?? `Scale #${ev.scale_id}`}
          </div>
          <div className="text-xs mt-0.5" style={{ color: "var(--color-muted)" }}>
            {ev.team?.name ?? `Team #${ev.team?.id}`}
            {ev.team?.project_id ? ` · Project #${ev.team.project_id}` : ""}
          </div>

          {ev.correcteds?.length > 0 && (
            <div className="flex items-center gap-1 mt-1.5">
              {ev.correcteds.map(c => (
                <span key={c.id} className="text-[10px] font-mono" style={{ color: "var(--color-faint)", fontFamily: "var(--font-mono)" }}>
                  {c.login}
                </span>
              ))}
            </div>
          )}
        </div>

        <div className="text-right shrink-0">
          {mark != null && (
            <div className="text-lg font-black" style={{ fontFamily: "var(--font-mono)", color: mark >= 50 ? "var(--color-green)" : "var(--color-red)" }}>
              {mark}
            </div>
          )}
          <div className="text-[10px]" style={{ color: "var(--color-faint)" }}>
            {new Date(ev.begin_at).toLocaleDateString()}
          </div>
          {ev.filled_at && (
            <div className="text-[10px]" style={{ color: "var(--color-faint)" }}>
              filled {new Date(ev.filled_at).toLocaleDateString()}
            </div>
          )}
        </div>
      </div>

      {ev.comment && (
        <div
          className="mt-2 text-xs p-2 rounded-lg"
          style={{ background: "var(--color-card-hi)", color: "var(--color-muted)" }}
        >
          {ev.comment.length > 200 ? ev.comment.slice(0, 200) + "…" : ev.comment}
        </div>
      )}
    </div>
  );
}
