import { useAuth } from "../context/AuthContext";
import { openOfficial } from "../lib/redirects";

export function SettingsPage() {
  const { user, config, token, currentScope, logout } = useAuth();

  return (
    <div className="p-4 md:p-6 max-w-3xl mx-auto space-y-4 md:space-y-6">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <h1 className="text-base md:text-lg font-bold tracking-widest uppercase" style={{ fontFamily: "var(--font-mono)", color: "#e2e8f0" }}>
          &gt; SETTINGS_
        </h1>
      </div>

      {/* Token info */}
      <div
        className="rounded-xl border p-4 md:p-5"
        style={{ background: "var(--color-card)", borderColor: "var(--color-border)" }}
      >
        <h3 className="text-xs font-bold uppercase tracking-wider mb-3" style={{ color: "var(--color-muted)" }}>
          Authentication
        </h3>

        <div className="space-y-2 text-xs" style={{ fontFamily: "var(--font-mono)" }}>
          {user ? (
            <>
              <div className="flex justify-between">
                <span style={{ color: "var(--color-faint)" }}>User</span>
                <span style={{ color: "#e2e8f0" }}>{user.login}</span>
              </div>
              <div className="flex justify-between">
                <span style={{ color: "var(--color-faint)" }}>Token</span>
                <span style={{ color: "var(--color-green)" }}>Active</span>
              </div>
              {token && (
                <div className="flex justify-between">
                  <span style={{ color: "var(--color-faint)" }}>Token Preview</span>
                  <span style={{ color: "var(--color-muted)" }}>{token.slice(0, 12)}…</span>
                </div>
              )}
              <div className="flex justify-between">
                <span style={{ color: "var(--color-faint)" }}>Client ID</span>
                <span style={{ color: "var(--color-muted)" }}>{config?.clientId ?? "Unknown"}</span>
              </div>
              <div className="flex justify-between">
                <span style={{ color: "var(--color-faint)" }}>Scope</span>
                <span style={{ color: "var(--color-primary)" }}>{currentScope}</span>
              </div>
              <div className="flex justify-between">
                <span style={{ color: "var(--color-faint)" }}>User ID</span>
                <span style={{ color: "var(--color-muted)" }}>{user.id}</span>
              </div>
            </>
          ) : (
            <p className="text-xs" style={{ color: "var(--color-faint)" }}>
              Not authenticated. Go to Dashboard to log in.
            </p>
          )}
        </div>

        {user && (
          <button
            onClick={logout}
            className="mt-3 text-xs font-bold px-3 py-1.5 rounded-lg uppercase tracking-wider transition-all"
            style={{ background: "var(--color-red)", color: "#fff" }}
          >
            Log Out
          </button>
        )}
      </div>

      {/* Official 42 actions */}
      <div
        className="rounded-xl border p-4 md:p-5"
        style={{ background: "var(--color-card)", borderColor: "var(--color-border)" }}
      >
        <h3 className="text-xs font-bold uppercase tracking-wider mb-3" style={{ color: "var(--color-muted)" }}>
          Official 42
        </h3>
        <p className="text-xs mb-3" style={{ color: "var(--color-faint)" }}>
          Account settings, profile editing, and sensitive actions must be done on the official 42 site.
        </p>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => openOfficial("sensitive_action", "https://profile.42.fr/")}
            className="text-xs font-semibold px-3 py-1.5 rounded-lg transition-all"
            style={{ background: "var(--color-card-hi)", color: "var(--color-primary)" }}
          >
            Open profile.42.fr →
          </button>
          <button
            onClick={() => openOfficial("missing_api", "https://profile.42.fr/settings")}
            className="text-xs font-semibold px-3 py-1.5 rounded-lg transition-all"
            style={{ background: "var(--color-card-hi)", color: "var(--color-primary)" }}
          >
            Account Settings →
          </button>
        </div>
      </div>

      {/* API limits info */}
      <div
        className="rounded-xl border p-4 md:p-5"
        style={{ background: "var(--color-card)", borderColor: "var(--color-border)" }}
      >
        <h3 className="text-xs font-bold uppercase tracking-wider mb-3" style={{ color: "var(--color-muted)" }}>
          Rate Limits
        </h3>
        <div className="text-xs space-y-1" style={{ color: "var(--color-faint)" }}>
          <div>42 API: 2 requests/second, 1,200 requests/hour</div>
          <div>This app enforces client-side and server-side rate limiting.</div>
          <div>Cache: profile data 60s, reference data 1h, search 30s.</div>
        </div>
      </div>
    </div>
  );
}
