import { useState } from "react";
import { useMyScaleTeams } from "../api/scale-teams";
import { useAuth } from "../context/AuthContext";
import type { ScaleTeam } from "../types";
import { InsufficientScopeCard } from "../components/errors/InsufficientScopeCard";

type Tab = "as_corrector" | "as_corrected";

export function EvaluationsPage() {
  const [tab, setTab] = useState<Tab>("as_corrected");
  const { hasScope } = useAuth();

  const { data: corrByData, isLoading: corrByLoad, error: corrByErr } = useMyScaleTeams("as_corrected", undefined, { enabled: hasScope("projects") });
  const { data: corrForData, isLoading: corrForLoad, error: corrForErr } = useMyScaleTeams("as_corrector", undefined, { enabled: hasScope("projects") });

  const items = tab === "as_corrected" ? corrByData?.data : corrForData?.data;
  const loading = tab === "as_corrected" ? corrByLoad : corrForLoad;
  const error = tab === "as_corrected" ? corrByErr : corrForErr;

  return (
    <div className="p-5 md:p-8 max-w-4xl mx-auto">
      <div className="flex items-baseline justify-between gap-3 flex-wrap mb-1">
        <h1 className="text-[24px] font-semibold tracking-tight" style={{ color: "var(--color-ink)" }}>
          Evaluations
        </h1>
        <span className="text-[12px] num" style={{ color: "var(--color-faint)" }}>
          {items?.length ?? 0} evaluations
        </span>
      </div>
      <p className="text-[13.5px] mb-5" style={{ color: "var(--color-muted)" }}>
        Scales you owe and scales you give.
      </p>

      <div className="flex gap-2 mb-5">
        {(["as_corrected", "as_corrector"] as Tab[]).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className="text-[12.5px] font-medium px-3 py-1.5 rounded-md transition-colors"
            style={
              tab === t
                ? { background: "var(--color-primary)", color: "#FBF8F3" }
                : {
                    background: "var(--color-surface)",
                    color: "var(--color-muted)",
                    border: "1px solid var(--color-border)",
                  }
            }
          >
            {t === "as_corrected" ? "To be evaluated" : "I'm evaluating"}
          </button>
        ))}
      </div>

      {loading && (
        <div className="space-y-2">
          {[1,2,3].map(i => <div key={i} className="skeleton h-14 w-full" />)}
        </div>
      )}

      {error && <InsufficientScopeCard error={error} />}

      {!loading && !error && !items?.length && (
        <p className="text-[13px] text-center py-12" style={{ color: "var(--color-faint)" }}>
          No evaluations found
        </p>
      )}

      <div style={{ borderTop: "1px solid var(--color-border)" }}>
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
      className="px-1 py-3"
      style={{ borderBottom: "1px solid var(--color-rule-soft)" }}
    >
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span
              className="badge"
              style={{
                color: filled ? "var(--color-green)" : "var(--color-yellow)",
                borderColor: `color-mix(in srgb, ${filled ? "var(--color-green)" : "var(--color-yellow)"} 30%, var(--color-border))`,
              }}
            >
              {filled ? "Filled" : "Pending"}
            </span>
            <span className="badge">{kind}</span>
          </div>

          <div className="text-[14px] font-medium mt-2" style={{ color: "var(--color-ink)" }}>
            {ev.scale?.name ?? `Scale #${ev.scale_id}`}
          </div>
          <div className="text-[12.5px] mt-0.5" style={{ color: "var(--color-muted)" }}>
            {ev.team?.name ?? `Team #${ev.team?.id}`}
            {ev.team?.project_id ? ` · Project #${ev.team.project_id}` : ""}
          </div>

          {ev.correcteds?.length > 0 && (
            <div className="flex items-center gap-2 mt-1.5">
              {ev.correcteds.map(c => (
                <span key={c.id} className="text-[11.5px] data-mono" style={{ color: "var(--color-faint)" }}>
                  {c.login}
                </span>
              ))}
            </div>
          )}
        </div>

        <div className="text-right shrink-0">
          {mark != null && (
            <div className="text-[18px] font-medium num" style={{ color: mark >= 50 ? "var(--color-green)" : "var(--color-red)" }}>
              {mark}
            </div>
          )}
          <div className="text-[11.5px]" style={{ color: "var(--color-faint)" }}>
            {new Date(ev.begin_at).toLocaleDateString()}
          </div>
          {ev.filled_at && (
            <div className="text-[11px]" style={{ color: "var(--color-faint)" }}>
              filled {new Date(ev.filled_at).toLocaleDateString()}
            </div>
          )}
        </div>
      </div>

      {ev.comment && (
        <div
          className="mt-2 text-[12.5px] p-2.5 rounded-md"
          style={{ background: "var(--color-card-hi)", color: "var(--color-muted)" }}
        >
          {ev.comment.length > 200 ? ev.comment.slice(0, 200) + "…" : ev.comment}
        </div>
      )}
    </div>
  );
}
