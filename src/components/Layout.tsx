import { type ReactNode, useState, useEffect } from "react";
import { Link, useLocation } from "@tanstack/react-router";
import { useAuth } from "../context/AuthContext";

interface Props {
  children: ReactNode;
}

const NAV = [
  { to: "/" as const,           label: "My 42",         icon: "⬡" },
  { to: "/dashboard" as const,  label: "Dashboard",     icon: "◉" },
  { to: "/students" as const,   label: "Students",      icon: "◎" },
  { to: "/projects" as const,   label: "Projects",      icon: "◉" },
  { to: "/evaluations" as const,label: "Evaluations",   icon: "◎" },
  { to: "/events" as const,     label: "Events",        icon: "◉" },
  { to: "/slots" as const,      label: "Slots",         icon: "◈" },
  { to: "/locations" as const,  label: "PeerFinder",    icon: "◉" },
  { to: "/settings" as const,   label: "Settings",      icon: "◈" },
];

function formatLevel(cursusUsers: any[]): string {
  if (!cursusUsers?.length) return "";
  const cu = cursusUsers.find((c: any) => c.cursus_id === 21) ?? cursusUsers[cursusUsers.length - 1];
  return `Lv ${cu?.level?.toFixed(2) ?? "?"}`;
}

export function Layout({ children }: Props) {
  const { user, login, logout, config } = useAuth();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const pathname = location.pathname;

  function closeSidebar() {
    setSidebarOpen(false);
  }

  useEffect(() => {
    if (sidebarOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [sidebarOpen]);

  function isActive(path: string) {
    if (path === "/") return pathname === "/";
    return pathname.startsWith(path);
  }

  return (
    <div className="flex h-full overflow-hidden w-full">
      {/* Hamburger button — fixed position, mobile only */}
      <button
        onClick={() => setSidebarOpen(true)}
        className="md:hidden fixed top-3 left-3 z-30 flex flex-col items-center justify-center gap-[5px] w-10 h-10 rounded-xl transition-colors"
        style={{ background: "var(--color-card)", border: "1px solid var(--color-border)" }}
        aria-label="Open navigation"
      >
        <span className="block w-[18px] h-[2px] rounded-full" style={{ background: "var(--color-muted)" }} />
        <span className="block w-[18px] h-[2px] rounded-full" style={{ background: "var(--color-muted)" }} />
        <span className="block w-[18px] h-[2px] rounded-full" style={{ background: "var(--color-muted)" }} />
      </button>

      {/* Backdrop overlay — mobile only */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm md:hidden"
          onClick={closeSidebar}
        />
      )}

      <aside
        className={
          `w-[230px] shrink-0 flex flex-col overflow-hidden border-r
           md:relative md:translate-x-0
           max-md:fixed max-md:left-0 max-md:top-0 max-md:bottom-0 max-md:z-50 max-md:will-change-transform
           max-md:transition-transform max-md:duration-300 max-md:ease-out
           ${sidebarOpen ? "max-md:translate-x-0" : "max-md:-translate-x-full"}`
        }
        style={{ background: "var(--color-surface)", borderColor: "var(--color-border)" }}
      >
        {/* Logo + mobile close button */}
        <div className="px-5 pt-6 pb-5 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5" onClick={closeSidebar}>
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center text-lg font-black"
              style={{
                background: "linear-gradient(135deg, var(--color-primary), var(--color-purple))",
                color: "#000",
              }}
            >
              ◈
            </div>
            <div>
              <div
                className="text-[11px] font-bold tracking-[2.5px] uppercase"
                style={{ fontFamily: "var(--font-sans)", color: "#e2e8f0" }}
              >
                42 Explorer
              </div>
              <div className="text-[9px] tracking-[3px] uppercase" style={{ color: "var(--color-faint)" }}>
                Network
              </div>
            </div>
          </Link>
          <button
            onClick={closeSidebar}
            className="md:hidden p-1.5 rounded-lg transition-colors flex items-center justify-center hover:bg-card-hi"
            style={{ color: "var(--color-muted)" }}
            aria-label="Close navigation"
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M1 1L13 13M13 1L1 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        <div className="mx-4 h-px" style={{ background: "var(--color-border)" }} />

        {/* Nav */}
        <nav className="flex-1 py-4 flex flex-col gap-1 overflow-y-auto px-3">
          {NAV.map((item) => {
            const active = isActive(item.to);
            return (
              <Link
                key={item.to}
                to={item.to}
                onClick={closeSidebar}
                className={`
                  group flex items-center gap-3 px-3 py-2.5 rounded-lg text-[13px] font-medium transition-all text-left
                  relative overflow-hidden
                  ${active ? "text-[#e2e8f0]" : ""}
                `}
                style={
                  active
                    ? {
                        background: "linear-gradient(90deg, color-mix(in srgb, var(--color-primary) 10%, transparent), color-mix(in srgb, var(--color-primary) 4%, transparent))",
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
                {active && (
                  <div
                    className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-full"
                    style={{ background: "var(--color-primary)" }}
                  />
                )}
                <span
                  className="transition-transform duration-200 group-hover:scale-110"
                  style={{ fontFamily: "var(--font-mono)", fontSize: 14 }}
                >
                  {item.icon}
                </span>
                <span className="relative z-10">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Online indicator */}
        {user && (
          <div className="mx-3 px-3 py-2.5 rounded-lg mb-2 flex items-center gap-2" style={{ background: "var(--color-card)" }}>
            <span className="online-pulse shrink-0" />
            <span className="text-[10px] truncate" style={{ color: "var(--color-faint)" }}>
              {user.campus?.[0]?.name ?? "Unknown campus"}
            </span>
          </div>
        )}

        <div className="mx-4 h-px" style={{ background: "var(--color-border)" }} />

        {/* User section */}
        <div className="p-3">
          {user ? (
            <>
              <Link
                to="/profile/$login"
                params={{ login: user.login }}
                className="flex items-center gap-2.5 w-full p-2 rounded-lg mb-2 transition-all hover:bg-card-hi"
                style={{ color: "#e2e8f0" }}
              >
                <div className="relative">
                  <img
                    src={user.image?.versions?.small}
                    alt={user.login}
                    className="w-9 h-9 rounded-lg object-cover shrink-0"
                    style={{ border: "1.5px solid var(--color-border-hi)" }}
                  />
                  {user.location && (
                    <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 bg-green" style={{ borderColor: "var(--color-card)" }} />
                  )}
                </div>
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
              </Link>
              <button
                onClick={logout}
                className="w-full py-2 text-xs font-semibold rounded-lg border transition-all"
                style={{ color: "var(--color-purple)", borderColor: "var(--color-border)" }}
                onMouseEnter={e => {
                  (e.currentTarget as HTMLElement).style.background = "var(--color-purple)";
                  (e.currentTarget as HTMLElement).style.color = "#fff";
                  (e.currentTarget as HTMLElement).style.borderColor = "var(--color-purple)";
                }}
                onMouseLeave={e => {
                  (e.currentTarget as HTMLElement).style.background = "";
                  (e.currentTarget as HTMLElement).style.color = "var(--color-purple)";
                  (e.currentTarget as HTMLElement).style.borderColor = "var(--color-border)";
                }}
              >
                Logout
              </button>
            </>
          ) : (
            <button
              onClick={config?.clientId ? login : () => { closeSidebar(); }}
              className="w-full py-2.5 text-xs font-bold rounded-lg transition-all"
              style={{ background: "var(--color-primary)", color: "#000" }}
            >
              Login with 42
            </button>
          )}
        </div>
      </aside>

      {/* ── Main content ── */}
      <main className="flex-1 overflow-y-auto overflow-x-hidden pt-12 md:pt-0" style={{ background: "var(--color-bg)" }}>
        {children}
      </main>
    </div>
  );
}
