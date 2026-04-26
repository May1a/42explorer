import { API42Error } from "../../lib/api-error";
import { useAuth } from "../../context/AuthContext";

type ScopePromptProps = {
  neededScopes?: readonly string[];
  title?: string;
  message?: string;
};

export function ScopePrompt({
  neededScopes = ["projects"],
  title = "Additional Scope Needed",
  message = "This feature requires elevated API permissions.",
}: ScopePromptProps) {
  const { login, currentScope } = useAuth();
  const needed = neededScopes.length > 0 ? [...neededScopes] : ["projects"];

  return (
    <div
      className="rounded-xl border p-4 md:p-5"
      style={{ background: "var(--color-card)", borderColor: "var(--color-purple)" }}
    >
      <div className="text-sm font-bold" style={{ color: "var(--color-purple)" }}>
        {title}
      </div>
      <div className="text-xs mt-1 space-y-1" style={{ color: "var(--color-muted)" }}>
        <p>{message}</p>
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

export function InsufficientScopeCard({ error }: { error: unknown }) {
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

  return (
    <ScopePrompt
      neededScopes={error.neededScopes}
      title="Insufficient Scope"
    />
  );
}
