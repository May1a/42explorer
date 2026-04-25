import { API42Error } from "../../lib/api-error";
import { useAuth } from "../../context/AuthContext";

export function InsufficientScopeCard({ error }: { error: unknown }) {
  const { login, currentScope } = useAuth();

  if (!(error instanceof API42Error && error.isInsufficientScope)) {
    return (
      <div
        className="rounded-xl border p-4 md:p-5"
        style={{ background: "var(--color-card)", borderColor: "var(--color-red)" }}
      >
        <div className="text-sm font-bold" style={{ color: "var(--color-red)" }}>Error</div>
        <div className="text-xs mt-1" style={{ color: "var(--color-muted)" }}>
          {error instanceof Error ? error.message : String(error)}
        </div>
      </div>
    );
  }

  const needed = error.neededScopes;

  return (
    <div
      className="rounded-xl border p-4 md:p-5"
      style={{ background: "var(--color-card)", borderColor: "var(--color-purple)" }}
    >
      <div className="text-sm font-bold" style={{ color: "var(--color-purple)" }}>
        Insufficient Scope
      </div>
      <div className="text-xs mt-1 space-y-1" style={{ color: "var(--color-muted)" }}>
        <p>This feature requires elevated API permissions.</p>
        <div className="flex flex-wrap items-center gap-2">
          <span style={{ color: "var(--color-faint)" }}>Current scope:</span>
          <span
            className="text-xs font-mono font-semibold px-2 py-0.5 rounded"
            style={{ background: "var(--color-card-hi)", color: "var(--color-primary)" }}
          >
            {currentScope}
          </span>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span style={{ color: "var(--color-faint)" }}>Needed scope{needed.length !== 1 ? "s" : ""}:</span>
          {needed.map((s) => (
            <span
              key={s}
              className="text-xs font-mono font-semibold px-2 py-0.5 rounded"
              style={{ background: "var(--color-card-hi)", color: "var(--color-yellow)" }}
            >
              {s}
            </span>
          ))}
        </div>
      </div>
      <button
        onClick={() => login(needed)}
        className="mt-3 text-xs font-bold px-4 py-2 rounded-lg uppercase tracking-wider transition-all"
        style={{ background: "var(--color-purple)", color: "#fff" }}
      >
        Re-authorize with {needed.join(" + ")} scope
      </button>
    </div>
  );
}
