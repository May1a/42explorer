import { useState, type ChangeEvent, type FormEvent } from "react";
import { useAuth } from "../context/AuthContext";
import { useUpdateProfilePicture } from "../api/me";
import { openOfficial } from "../lib/redirects";

const MIN_PROFILE_IMAGE_SIZE = 3 * 1024;
const MAX_PROFILE_IMAGE_SIZE = 1024 * 1024;

const KNOWN_SCOPES: { scope: string; label: string; description: string }[] = [
  { scope: "public",    label: "Public",    description: "Read your profile, campus, projects, evaluations, events, and slots." },
  { scope: "projects",  label: "Projects",   description: "Elevated access to project data. Needed for write operations and certain project API endpoints." },
  { scope: "forum",     label: "Forum",      description: "Access to 42 forum data." },
  { scope: "tig",       label: "TIG",        description: "Tutoring-related features." },
  { scope: "elearning", label: "E-learning", description: "Access to e-learning platform data." },
  { scope: "profil",    label: "Profile",     description: "Edit your 42 profile via API." },
];

export function SettingsPage() {
  const { user, token, currentScope, hasScope, login, logout } = useAuth();
  const updatePicture = useUpdateProfilePicture();
  const [picture, setPicture] = useState<File | null>(null);
  const [pictureError, setPictureError] = useState<string | null>(null);
  const [pictureSuccess, setPictureSuccess] = useState<string | null>(null);

  const activeScopes = currentScope.split(" ").filter(Boolean);
  const canUseProfileScope = hasScope("profil");

  function onPictureChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0] ?? null;
    setPictureSuccess(null);
    setPictureError(null);
    setPicture(file);

    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setPictureError("Choose an image file.");
    } else if (file.size < MIN_PROFILE_IMAGE_SIZE) {
      setPictureError("42 requires profile images to be at least 3 KB.");
    } else if (file.size > MAX_PROFILE_IMAGE_SIZE) {
      setPictureError("42 profile images must be 1 MB or smaller.");
    }
  }

  async function onPictureSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    setPictureSuccess(null);

    if (!picture || pictureError) return;

    try {
      await updatePicture.mutateAsync(picture);
      setPictureSuccess("Profile picture update request accepted.");
      setPicture(null);
      form.reset();
    } catch (error: any) {
      setPictureError(error?.body || error?.message || "Could not update profile picture.");
    }
  }

  return (
    <div className="p-5 md:p-8 max-w-4xl mx-auto animate-fade-in">
      <div className="flex items-baseline justify-between gap-3 flex-wrap mb-1">
        <h1 className="text-[24px] font-semibold tracking-tight" style={{ color: "var(--color-ink)" }}>
          Settings
        </h1>
      </div>
      <p className="text-[13.5px] mb-6" style={{ color: "var(--color-muted)" }}>
        Authentication, API scopes, and account links.
      </p>

      <div className="space-y-6">
        {/* Token info */}
        <section className="section-card p-5">
          <h3 className="text-[13px] font-semibold tracking-tight mb-3" style={{ color: "var(--color-ink)" }}>
            Authentication
          </h3>

          <div className="space-y-2 text-[12.5px] data-mono">
            {user ? (
              <>
                <div className="flex justify-between gap-3 py-1" style={{ borderBottom: "1px solid var(--color-rule-soft)" }}>
                  <span style={{ color: "var(--color-faint)" }}>User</span>
                  <span style={{ color: "var(--color-ink)" }}>{user.login}</span>
                </div>
                <div className="flex justify-between gap-3 py-1" style={{ borderBottom: "1px solid var(--color-rule-soft)" }}>
                  <span style={{ color: "var(--color-faint)" }}>Token</span>
                  <span style={{ color: "var(--color-green)" }}>Active</span>
                </div>
                {token && (
                  <div className="flex justify-between gap-3 py-1" style={{ borderBottom: "1px solid var(--color-rule-soft)" }}>
                    <span style={{ color: "var(--color-faint)" }}>Token Preview</span>
                    <span style={{ color: "var(--color-muted)" }}>{token.slice(0, 12)}…</span>
                  </div>
                )}
                <div className="flex justify-between gap-3 py-1" style={{ borderBottom: "1px solid var(--color-rule-soft)" }}>
                  <span style={{ color: "var(--color-faint)" }}>Scope</span>
                  <span style={{ color: "var(--color-primary)" }}>{currentScope}</span>
                </div>
                <div className="flex justify-between gap-3 py-1">
                  <span style={{ color: "var(--color-faint)" }}>User ID</span>
                  <span style={{ color: "var(--color-muted)" }}>{user.id}</span>
                </div>
              </>
            ) : (
              <p className="text-[13px]" style={{ color: "var(--color-faint)" }}>
                Not authenticated. Go to Dashboard to log in.
              </p>
            )}
          </div>

          {user && (
            <button
              onClick={logout}
              className="btn-secondary mt-4"
              style={{ color: "var(--color-red)", borderColor: "color-mix(in srgb, var(--color-red) 35%, var(--color-border))" }}
            >
              Log Out
            </button>
          )}
        </section>

        {/* Scope Management */}
        {user && (
          <section className="section-card p-5">
            <h3 className="text-[13px] font-semibold tracking-tight mb-1" style={{ color: "var(--color-ink)" }}>
              API Scopes
            </h3>
            <p className="text-[12.5px] mb-4" style={{ color: "var(--color-muted)" }}>
              Each scope grants access to different API endpoints. Granting additional scopes requires re-authentication.
            </p>
            <div style={{ borderTop: "1px solid var(--color-border)" }}>
              {KNOWN_SCOPES.map(({ scope, label, description }) => {
                const active = activeScopes.includes(scope);
                return (
                  <div
                    key={scope}
                    className="flex items-start justify-between gap-3 py-3 px-1"
                    style={{ borderBottom: "1px solid var(--color-rule-soft)" }}
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-[13px] font-medium" style={{ color: active ? "var(--color-ink)" : "var(--color-muted)" }}>
                          {label}
                        </span>
                        {active && <span className="badge badge-ok">active</span>}
                      </div>
                      <p className="text-[12px] mt-0.5" style={{ color: "var(--color-faint)" }}>
                        {description}
                      </p>
                    </div>
                    {!active && (
                      <button
                        onClick={() => login(
                          scope === "public"
                            ? undefined
                            : [scope]
                        )}
                        className="btn-quiet shrink-0 text-[12px]"
                        style={{ color: "var(--color-primary)" }}
                      >
                        + Enable
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* Profile picture */}
        {user && (
          <section className="section-card p-5">
            <h3 className="text-[13px] font-semibold tracking-tight mb-3" style={{ color: "var(--color-ink)" }}>
              Profile Picture
            </h3>
            <div className="flex items-start gap-4 flex-wrap">
              <img
                src={user.image?.versions?.small || user.image?.link}
                alt=""
                className="w-16 h-16 rounded-full avatar-soft object-cover"
              />
              <form onSubmit={onPictureSubmit} className="flex-1 min-w-[220px] space-y-3">
                <input
                  type="file"
                  accept="image/*"
                  onChange={onPictureChange}
                  className="block w-full text-[12.5px]"
                />
                <div className="text-[12px] leading-relaxed" style={{ color: "var(--color-faint)" }}>
                  Uses 42's user update endpoint with <span className="data-mono">user[image]</span>. The API accepts image files from 3 KB to 1 MB and may require elevated 42 permissions.
                </div>
                {!canUseProfileScope && (
                  <div
                    className="flex items-center justify-between gap-3 rounded p-2"
                    style={{ background: "var(--color-card-hi)" }}
                  >
                    <span className="text-[12px]" style={{ color: "var(--color-muted)" }}>
                      The profile edit scope is not active for this token.
                    </span>
                    <button
                      type="button"
                      onClick={() => login(["profil"])}
                      className="btn-quiet shrink-0 text-[12px]"
                      style={{ color: "var(--color-primary)" }}
                    >
                      Enable
                    </button>
                  </div>
                )}
                {pictureError && (
                  <div className="text-[12px] rounded p-2" style={{ color: "var(--color-red)", background: "color-mix(in srgb, var(--color-red) 8%, transparent)" }}>
                    {pictureError}
                  </div>
                )}
                {pictureSuccess && (
                  <div className="text-[12px] rounded p-2" style={{ color: "var(--color-green)", background: "color-mix(in srgb, var(--color-green) 8%, transparent)" }}>
                    {pictureSuccess}
                  </div>
                )}
                <button
                  type="submit"
                  disabled={!picture || Boolean(pictureError) || updatePicture.isPending}
                  className="btn-primary disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {updatePicture.isPending ? "Uploading..." : "Update Picture"}
                </button>
              </form>
            </div>
          </section>
        )}

        {/* Official 42 actions */}
        <section className="section-card p-5">
          <h3 className="text-[13px] font-semibold tracking-tight mb-1" style={{ color: "var(--color-ink)" }}>
            Official 42
          </h3>
          <p className="text-[12.5px] mb-3" style={{ color: "var(--color-muted)" }}>
            Account settings, profile editing, and sensitive actions must be done on the official 42 site.
          </p>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => openOfficial("sensitive_action", "https://profile.42.fr/")}
              className="btn-secondary"
            >
              Open profile.42.fr →
            </button>
            <button
              onClick={() => openOfficial("missing_api", "https://profile.42.fr/settings")}
              className="btn-secondary"
            >
              Account Settings →
            </button>
          </div>
        </section>

        {/* API limits info */}
        <section className="section-card p-5">
          <h3 className="text-[13px] font-semibold tracking-tight mb-3" style={{ color: "var(--color-ink)" }}>
            Rate Limits
          </h3>
          <div className="text-[12.5px] space-y-1" style={{ color: "var(--color-faint)" }}>
            <div>42 API: 2 requests/second, 1,200 requests/hour</div>
            <div>This app enforces client-side and server-side rate limiting.</div>
            <div>Cache: profile data 60s, reference data 1h, search 30s.</div>
          </div>
        </section>
      </div>
    </div>
  );
}
