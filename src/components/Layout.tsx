import type { ReactNode } from "react";
import { useAuth } from "../context/AuthContext";

export type Page = "dashboard" | "students" | "locations" | "profile";

interface Props {
  page: Page;
  onNavigate: (page: Page, extra?: string) => void;
  children: ReactNode;
}

const NAV: { id: Page; label: string; icon: string }[] = [
  { id: "dashboard",  label: "Dashboard",  icon: "⬡" },
  { id: "students",   label: "Students",   icon: "◎" },
  { id: "locations",  label: "PeerFinder", icon: "◉" },
  { id: "profile",    label: "Profile",    icon: "◈" },
];

function formatLevel(cursusUsers: any[]): string {
  if (!cursusUsers?.length) return "";
  const cu = cursusUsers.find((c: any) => c.cursus_id === 21) ?? cursusUsers[cursusUsers.length - 1];
  return `Lv ${cu?.level?.toFixed(2) ?? "?"}`;
}

export function Layout({ page, onNavigate, children }: Props) {
  const { user, login, logout, config } = useAuth();

  return (
    <div className="flex h-full overflow-hidden">
      {/* ── Sidebar ── */}
      <aside
        className="w-[220px] shrink-0 flex flex-col overflow-hidden border-r"
        style={{ background: "var(--color-surface)", borderColor: "var(--color-border)" }}
      >
        {/* Logo */}
        <div className="px-5 pt-5 pb-4">
          <div
            className="flex items-center gap-2"
            style={{ fontFamily: "var(--font-mono)", color: "var(--color-primary)" }}
          >
            <span className="text-lg font-black">◈</span>
            <div>
              <div className="text-xs font-bold tracking-[2px] uppercase">42 Explorer</div>
              <div className="text-[10px] opacity-50 tracking-widest">NETWORK</div>
            </div>
          </div>
        </div>

        <div className="mx-3 h-px" style={{ background: "var(--color-border)" }} />

        {/* Nav */}
        <nav className="flex-1 py-3 flex flex-col gap-0.5 overflow-y-auto">
          {NAV.map(item => {
            const active = page === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onNavigate(item.id)}
                className="flex items-center gap-2.5 mx-2 px-3 py-2 rounded-lg text-sm font-medium transition-all text-left"
                style={
                  active
                    ? {
                        background: "color-mix(in srgb, var(--color-primary) 12%, transparent)",
                        borderLeft: "3px solid var(--color-primary)",
                        color: "var(--color-primary)",
                        paddingLeft: "9px",
                      }
                    : { color: "var(--color-faint)" }
                }
                onMouseEnter={e => {
                  if (!active) {
                    (e.currentTarget as HTMLElement).style.background = "var(--color-card-hi)";
                    (e.currentTarget as HTMLElement).style.color = "#e2e8f0";
                  }
                }}
                onMouseLeave={e => {
                  if (!active) {
                    (e.currentTarget as HTMLElement).style.background = "";
                    (e.currentTarget as HTMLElement).style.color = "var(--color-faint)";
                  }
                }}
              >
                <span style={{ fontFamily: "var(--font-mono)", fontSize: 13 }}>{item.icon}</span>
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Online indicator */}
        {user && (
          <div className="mx-3 px-3 py-2.5 rounded-lg mb-2" style={{ background: "var(--color-card)" }}>
            <div className="flex items-center gap-2 text-[10px]" style={{ color: "var(--color-faint)" }}>
              <span className="online-pulse shrink-0" />
              <span className="truncate">{user.campus?.[0]?.name ?? "Unknown campus"}</span>
            </div>
          </div>
        )}

        <div className="mx-3 h-px" style={{ background: "var(--color-border)" }} />

        {/* User section */}
        <div className="p-3">
          {user ? (
            <>
              <button
                onClick={() => onNavigate("profile")}
                className="flex items-center gap-2.5 w-full p-2 rounded-lg mb-2 transition-all"
                style={{ color: "#e2e8f0" }}
                onMouseEnter={e => (e.currentTarget.style.background = "var(--color-card-hi)")}
                onMouseLeave={e => (e.currentTarget.style.background = "")}
              >
                <img
                  src={user.image?.versions?.small}
                  alt={user.login}
                  className="w-8 h-8 rounded-full object-cover shrink-0"
                />
                <div className="flex-1 min-w-0 text-left">
                  <div
                    className="text-xs font-bold truncate"
                    style={{ fontFamily: "var(--font-mono)" }}
                  >
                    {user.login}
                  </div>
                  <div className="text-[10px]" style={{ color: "var(--color-faint)" }}>
                    {formatLevel(user.cursus_users)}
                  </div>
                </div>
              </button>
              <button
                onClick={logout}
                className="w-full py-1.5 text-xs font-semibold rounded-lg border transition-all"
                style={{ color: "var(--color-purple)", borderColor: "var(--color-purple)" }}
                onMouseEnter={e => {
                  (e.currentTarget as HTMLElement).style.background = "var(--color-purple)";
                  (e.currentTarget as HTMLElement).style.color = "#fff";
                }}
                onMouseLeave={e => {
                  (e.currentTarget as HTMLElement).style.background = "";
                  (e.currentTarget as HTMLElement).style.color = "var(--color-purple)";
                }}
              >
                Logout
              </button>
            </>
          ) : (
            <button
              onClick={config?.clientId ? login : () => onNavigate("dashboard")}
              className="w-full py-2 text-xs font-bold rounded-lg transition-all"
              style={{ background: "var(--color-primary)", color: "#000" }}
            >
              Login with 42
            </button>
          )}
        </div>
      </aside>

      {/* ── Main content ── */}
      <main className="flex-1 overflow-y-auto overflow-x-hidden" style={{ background: "var(--color-bg)" }}>
        {children}
      </main>
    </div>
  );
}
