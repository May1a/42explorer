/**
 * First-time setup screen — user enters their 42 API credentials.
 * These are stored in localStorage.  No server needed.
 */
import { useState } from "react";
import { useAuth } from "../context/AuthContext";

export function SetupPage() {
  const { saveConfig, login } = useAuth();
  const [clientId, setClientId]     = useState("");
  const [redirectUri, setRedirectUri] = useState(window.location.origin + "/");
  const [saved, setSaved] = useState(false);

  function handleSave() {
    if (!clientId.trim()) return;
    saveConfig({ clientId: clientId.trim(), redirectUri: redirectUri.trim() });
    setSaved(true);
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6" style={{ background: "var(--color-bg)" }}>
      <div
        className="w-full max-w-md rounded-2xl border p-8"
        style={{ background: "var(--color-card)", borderColor: "var(--color-border)" }}
      >
        {/* Header */}
        <div className="text-center mb-8">
          <div
            className="text-3xl font-black mb-2"
            style={{ color: "var(--color-primary)", fontFamily: "var(--font-mono)" }}
          >
            ◈ 42 Explorer
          </div>
          <p className="text-sm" style={{ color: "var(--color-muted)" }}>
            Connect to the 42 Network — find peers, explore profiles, track who's online.
          </p>
        </div>

        {/* Setup form */}
        <div className="space-y-5">
          <div>
            <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wider" style={{ color: "var(--color-muted)" }}>
              OAuth Client ID
            </label>
            <input
              type="text"
              value={clientId}
              onChange={e => setClientId(e.target.value)}
              placeholder="u-s4t2ud4-..."
              className="w-full"
              style={{ fontFamily: "var(--font-mono)", fontSize: 13 }}
              autoFocus
            />
            <p className="mt-1.5 text-xs" style={{ color: "var(--color-faint)" }}>
              Create an app at{" "}
              <a
                href="https://profile.intra.42.fr/oauth/applications"
                target="_blank"
                rel="noopener noreferrer"
                style={{ color: "var(--color-primary)" }}
              >
                intra.42.fr/oauth/applications
              </a>{" "}
              — use <strong>Implicit</strong> grant, no secret needed.
            </p>
          </div>

          <div>
            <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wider" style={{ color: "var(--color-muted)" }}>
              Redirect URI
            </label>
            <input
              type="text"
              value={redirectUri}
              onChange={e => setRedirectUri(e.target.value)}
              className="w-full"
              style={{ fontFamily: "var(--font-mono)", fontSize: 13 }}
            />
            <p className="mt-1.5 text-xs" style={{ color: "var(--color-faint)" }}>
              Must exactly match the redirect URI in your 42 app settings.
            </p>
          </div>

          {!saved ? (
            <button
              onClick={handleSave}
              disabled={!clientId.trim()}
              className="w-full py-3 rounded-xl text-sm font-bold transition-all disabled:opacity-40"
              style={{ background: "var(--color-primary)", color: "#000" }}
            >
              Save &amp; Continue
            </button>
          ) : (
            <div className="space-y-3">
              <div
                className="flex items-center gap-2 p-3 rounded-xl border text-sm"
                style={{
                  background: "color-mix(in srgb, var(--color-green) 10%, transparent)",
                  borderColor: "color-mix(in srgb, var(--color-green) 40%, transparent)",
                  color: "var(--color-green)",
                }}
              >
                <span>✓</span>
                <span>Credentials saved! Ready to authenticate.</span>
              </div>
              <button
                onClick={login}
                className="w-full py-3 rounded-xl text-sm font-bold transition-all"
                style={{ background: "var(--color-purple)", color: "#fff" }}
              >
                Login with 42 →
              </button>
            </div>
          )}
        </div>

        {/* Instructions */}
        <details className="mt-6">
          <summary
            className="text-xs cursor-pointer select-none font-semibold"
            style={{ color: "var(--color-faint)" }}
          >
            How to set up your 42 OAuth app
          </summary>
          <ol className="mt-3 space-y-1.5 text-xs list-decimal list-inside" style={{ color: "var(--color-muted)" }}>
            <li>Go to <strong>profile.intra.42.fr</strong> → Settings → API</li>
            <li>Click <strong>Register a new application</strong></li>
            <li>Name: anything (e.g. "42 Explorer")</li>
            <li>Redirect URI: <code style={{ fontFamily: "var(--font-mono)", color: "var(--color-primary)" }}>{redirectUri}</code></li>
            <li>Scopes: leave default (<strong>public</strong>)</li>
            <li>Copy the <strong>UID</strong> (not the secret) and paste above</li>
          </ol>
        </details>
      </div>
    </div>
  );
}
