import { type ReactNode, useState, useEffect } from "react";
import { Link, useLocation } from "@tanstack/react-router";
import { useAuth } from "../context/AuthContext";
import {
  IconDashboard,
  IconUsers,
  IconFolder,
  IconCheck,
  IconCalendar,
  IconClock,
  IconPin,
  IconSettings,
  IconMenu,
  IconX,
  IconHome,
} from "./icons";

interface Props {
  children: ReactNode;
}

const NAV = [
  { to: "/" as const,            label: "My 42",       Icon: IconHome },
  { to: "/dashboard" as const,   label: "Dashboard",   Icon: IconDashboard },
  { to: "/students" as const,    label: "Students",    Icon: IconUsers },
  { to: "/projects" as const,    label: "Projects",    Icon: IconFolder },
  { to: "/evaluations" as const, label: "Evaluations", Icon: IconCheck },
  { to: "/events" as const,      label: "Events",      Icon: IconCalendar },
  { to: "/slots" as const,       label: "Slots",       Icon: IconClock },
  { to: "/locations" as const,   label: "PeerFinder",  Icon: IconPin },
  { to: "/settings" as const,    label: "Settings",    Icon: IconSettings },
];

function formatLevel(cursusUsers: any[]): string {
  if (!cursusUsers?.length) return "";
  const cu = cursusUsers.find((c: any) => c.cursus_id === 21) ?? cursusUsers[cursusUsers.length - 1];
  return `Lv ${cu?.level?.toFixed(2) ?? "?"}`;
}

export function Layout({ children }: Props) {
  const { user, login, logout } = useAuth();
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
      <button
        onClick={() => setSidebarOpen(true)}
        className="md:hidden fixed top-3 left-3 z-30 flex items-center justify-center w-9 h-9 rounded-md"
        style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)", color: "var(--color-muted)" }}
        aria-label="Open navigation"
      >
        <IconMenu size={16} />
      </button>

      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 md:hidden"
          style={{ background: "rgba(42, 36, 32, 0.28)" }}
          onClick={closeSidebar}
        />
      )}

      <aside
        className={
          `w-[220px] shrink-0 flex flex-col overflow-hidden
           md:relative md:translate-x-0
           max-md:fixed max-md:left-0 max-md:top-0 max-md:bottom-0 max-md:z-50 max-md:will-change-transform
           max-md:transition-transform max-md:duration-200 max-md:ease-out
           ${sidebarOpen ? "max-md:translate-x-0" : "max-md:-translate-x-full"}`
        }
        style={{ background: "var(--color-surface)", borderRight: "1px solid var(--color-border)" }}
      >
        <div className="px-[18px] pt-5 pb-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5" onClick={closeSidebar}>
            <div
              className="w-7 h-7 rounded-md flex items-center justify-center"
              style={{ background: "var(--color-ink)", color: "var(--color-bg)" }}
            >
              <span className="text-[10px] font-semibold" style={{ fontFamily: "var(--font-mono)" }}>42</span>
            </div>
            <div>
              <div className="text-[14px] font-semibold tracking-tight" style={{ color: "var(--color-ink)" }}>
                Explorer
              </div>
              <div className="text-[10px]" style={{ fontFamily: "var(--font-mono)", color: "var(--color-faint)" }}>
                {user?.campus?.[0]?.name?.toLowerCase() ?? "heilbronn"}
              </div>
            </div>
          </Link>
          <button
            onClick={closeSidebar}
            className="md:hidden p-1.5 rounded-md flex items-center justify-center"
            style={{ color: "var(--color-muted)" }}
            aria-label="Close navigation"
          >
            <IconX size={14} />
          </button>
        </div>

        <nav className="flex-1 flex flex-col gap-0.5 overflow-y-auto px-3 py-1">
          {NAV.map((item) => {
            const active = isActive(item.to);
            const { Icon } = item;
            return (
              <Link
                key={item.to}
                to={item.to}
                onClick={closeSidebar}
                className="flex items-center gap-2.5 px-2.5 py-2 rounded-md text-[13.5px] font-medium text-left"
                style={
                  active
                    ? { background: "var(--color-primary-glow)", color: "var(--color-primary)", fontWeight: 650 }
                    : { color: "var(--color-muted)" }
                }
              >
                <Icon size={15} style={{ opacity: active ? 1 : 0.75 }} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="px-3 pb-3" style={{ borderTop: "1px solid var(--color-border)", paddingTop: 12 }}>
          {user ? (
            <>
              <Link
                to="/profile/$login"
                params={{ login: user.login }}
                className="flex items-center gap-2.5 w-full p-2 rounded-md mb-2"
                style={{ color: "var(--color-ink)" }}
              >
                <div className="relative">
                  <img
                    src={user.image?.versions?.small}
                    alt={user.login}
                    className="w-8 h-8 rounded-full object-cover shrink-0"
                    style={{ background: "#E4D9C8", boxShadow: "inset 0 0 0 1px rgba(42,36,32,0.06)" }}
                  />
                  {user.location && (
                    <span
                      className="absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full"
                      style={{ background: "var(--color-green)", border: "2px solid var(--color-surface)" }}
                    />
                  )}
                </div>
                <div className="flex-1 min-w-0 text-left">
                  <div className="text-[12.5px] font-medium truncate data-mono">{user.login}</div>
                  <div className="text-[11px]" style={{ color: "var(--color-faint)" }}>
                    {formatLevel(user.cursus_users)}
                  </div>
                </div>
              </Link>
              <button
                onClick={logout}
                className="w-full py-1.5 text-[12.5px] font-medium rounded-md"
                style={{
                  color: "var(--color-muted)",
                  border: "1px solid var(--color-border)",
                  background: "transparent",
                }}
              >
                Log out
              </button>
            </>
          ) : (
            <button onClick={() => login()} className="w-full btn-primary py-2 text-[13px]">
              Login with 42
            </button>
          )}
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto overflow-x-hidden pt-12 md:pt-0" style={{ background: "var(--color-bg)" }}>
        {children}
      </main>
    </div>
  );
}
