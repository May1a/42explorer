import { useState } from "react";
import { useAuth } from "../context/AuthContext";

export function SetupPage() {
  const { saveConfig, login } = useAuth();
  const [clientId, setClientId] = useState("");
  const [saved,    setSaved]    = useState(false);

  // The callback URL the user must register in their 42 app
  const callbackUrl = window.location.origin + "/api/auth/callback";

  function handleSave() {
    if (!clientId.trim()) return;
    saveConfig({ clientId: clientId.trim() });
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
            Connect to the 42 Network — find peers, explore profiles, see who's online.
          </p>
        </div>

        <div className="space-y-5">
          {/* Step 1 — register the redirect URI */}
          <div
            className="p-4 rounded-xl border"
            style={{ background: "var(--color-card-hi)", borderColor: "var(--color-border-hi)" }}
          >
            <div className="text-xs font-bold uppercase tracking-wider mb-2" style={{ color: "var(--color-faint)" }}>
              Step 1 — Register your 42 OAuth app
            </div>
            <ol className="text-xs space-y-1.5 list-decimal list-inside" style={{ color: "var(--color-muted)" }}>
              <li>
                Go to{" "}
                <a
                  href="https://profile.intra.42.fr/oauth/applications"
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ color: "var(--color-primary)" }}
                >
                  intra.42.fr → Settings → API
                </a>
              </li>
              <li>Click <strong>Register a new application</strong></li>
              <li>Set the <strong>Redirect URI</strong> to exactly:</li>
            </ol>
            <div
              className="mt-2 px-3 py-2 rounded-lg text-xs font-mono select-all break-all"
              style={{
                background: "var(--color-card)",
                border: "1px solid var(--color-border-hi)",
                color: "var(--color-primary)",
                fontFamily: "var(--font-mono)",
              }}
            >
              {callbackUrl}
            </div>
            <p className="mt-1.5 text-[11px]" style={{ color: "var(--color-faint)" }}>
              Copy the <strong>UID</strong> (not the Secret) and enter it below.
            </p>
          </div>

          {/* Step 2 — enter Client ID */}
          <div>
            <label
              className="block text-xs font-bold mb-1.5 uppercase tracking-wider"
              style={{ color: "var(--color-muted)" }}
            >
              Step 2 — Paste your Client UID
            </label>
            <input
              type="text"
              value={clientId}
              onChange={e => setClientId(e.target.value)}
              onKeyDown={e => e.key === "Enter" && handleSave()}
              placeholder="u-s4t2ud4-..."
              className="w-full"
              style={{ fontFamily: "var(--font-mono)", fontSize: 13 }}
              autoFocus
            />
          </div>

          {/* Step 3 — set server env vars (Vercel) */}
          <div
            className="p-4 rounded-xl border"
            style={{ background: "var(--color-card-hi)", borderColor: "var(--color-border-hi)" }}
          >
            <div className="text-xs font-bold uppercase tracking-wider mb-2" style={{ color: "var(--color-faint)" }}>
              Step 3 — Add secrets to Vercel
            </div>
            <p className="text-xs mb-2" style={{ color: "var(--color-muted)" }}>
              Run these in your project directory (the Client Secret stays server-side):
            </p>
            <div
              className="text-[11px] font-mono p-3 rounded-lg space-y-1"
              style={{ background: "var(--color-card)", color: "var(--color-primary)", fontFamily: "var(--font-mono)" }}
            >
              <div>vercel env add FORTY_TWO_CLIENT_ID</div>
              <div>vercel env add FORTY_TWO_CLIENT_SECRET</div>
            </div>
            <p className="mt-1.5 text-[11px]" style={{ color: "var(--color-faint)" }}>
              Then redeploy: <code style={{ fontFamily: "var(--font-mono)" }}>vercel --prod</code>
            </p>
          </div>

          {!saved ? (
            <button
              onClick={handleSave}
              disabled={!clientId.trim()}
              className="w-full py-3 rounded-xl text-sm font-bold transition-all disabled:opacity-40"
              style={{ background: "var(--color-primary)", color: "#000" }}
            >
              Save &amp; Continue →
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
                <span>Client ID saved. Ready to authenticate.</span>
              </div>
              <button
                onClick={() => login()}
                className="w-full py-3 rounded-xl text-sm font-bold transition-all"
                style={{ background: "var(--color-purple)", color: "#fff" }}
              >
                Login with 42 →
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
