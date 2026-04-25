import { useAuth } from "../context/AuthContext";
import { use42Query } from "../hooks/use42API";
import { LevelBar } from "../components/LevelBar";
import { CoalitionBadge } from "../components/CoalitionBadge";
import type { FortyTwoUser, Location } from "../types";

interface StatTileProps { label: string; value: string | number; sub?: string; color?: string }
function StatTile({ label, value, sub, color }: StatTileProps) {
  return (
    <div
      className="flex flex-col gap-1 p-3 md:p-4 rounded-xl border"
      style={{ background: "var(--color-card-hi)", borderColor: "var(--color-border)" }}
    >
      <div
        className="text-xl md:text-2xl font-black"
        style={{ color: color ?? "var(--color-primary)", fontFamily: "var(--font-mono)" }}
      >
        {value}
      </div>
      <div className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--color-faint)" }}>
        {label}
      </div>
      {sub && <div className="text-xs" style={{ color: "var(--color-muted)" }}>{sub}</div>}
    </div>
  );
}

export function DashboardPage({ onNavigate }: { onNavigate: (page: any, extra?: string) => void }) {
  const { user, login, config } = useAuth();

  // Active locations at primary campus
  const campusId = user?.campus_users?.find(c => c.is_primary)?.campus_id;
  const { data: locRes, isLoading: locLoading } = use42Query<Location[]>(
    campusId ? `/campus/${campusId}/locations` : null,
    { "filter.active": true, "page.size": 100 }
  );

  // Upcoming events at campus
  const { data: eventsRes } = use42Query<any[]>(
    campusId ? `/campus/${campusId}/events` : null,
    { "page.size": 5, sort: "begin_at" }
  );

  const locations = locRes?.data;
  const events    = eventsRes?.data;

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-full p-8 text-center gap-6">
        <div className="text-6xl" style={{ color: "var(--color-primary)", fontFamily: "var(--font-mono)" }}>◈</div>
        <div>
          <h1 className="text-2xl font-bold text-[#e2e8f0] mb-2">42 Explorer</h1>
          <p className="text-sm max-w-sm" style={{ color: "var(--color-muted)" }}>
            Explore the 42 network. Find who's online, browse student profiles, filter by
            campus, level, cursus — the data is all yours.
          </p>
        </div>
        {config?.clientId ? (
          <button
            onClick={login}
            className="px-6 py-3 rounded-xl text-sm font-bold transition-all"
            style={{ background: "var(--color-primary)", color: "#000" }}
          >
            Login with 42 →
          </button>
        ) : (
          <p className="text-xs" style={{ color: "var(--color-faint)" }}>
            Set up your credentials first via the sidebar.
          </p>
        )}
      </div>
    );
  }

  const mainCursus =
    user.cursus_users?.find(c => c.cursus_id === 21) ??
    user.cursus_users?.[user.cursus_users.length - 1];
  const coalition = user.coalitions_users?.[0]?.coalition;
  const selectedTitle = user.titles_users?.find(t => t.selected);
  const title = selectedTitle ? user.titles?.find(t => t.id === selectedTitle.title_id) : null;
  const onlineCount = locations?.length ?? 0;
  const validatedProjects = user.projects_users?.filter(p => p["validated?"] === true).length ?? 0;
  const totalProjects = user.projects_users?.filter(p => p.status === "finished" || p.status === "in_progress").length ?? 0;

  return (
    <div className="p-4 md:p-6 max-w-5xl mx-auto space-y-4 md:space-y-6">
      {/* Page header */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <h1 className="text-base md:text-lg font-bold tracking-widest uppercase" style={{ fontFamily: "var(--font-mono)", color: "#e2e8f0" }}>
          &gt; DASHBOARD_
        </h1>
        <span className="text-xs" style={{ color: "var(--color-faint)", fontFamily: "var(--font-mono)" }}>
          {new Date().toLocaleTimeString()}
        </span>
      </div>

      {/* Profile card */}
      <div
        className="rounded-2xl border p-4 md:p-6 relative overflow-hidden"
        style={{ background: "var(--color-card)", borderColor: "var(--color-border)" }}
      >
        {/* Coalition gradient overlay */}
        {coalition && (
          <div
            className="absolute inset-x-0 top-0 h-1 rounded-t-2xl"
            style={{ background: coalition.color }}
          />
        )}

        <div className="flex items-start gap-5 flex-wrap">
          {/* Avatar */}
          <div className="relative">
            <img
              src={user.image?.versions?.medium}
              alt={user.login}
              className="w-20 h-20 rounded-xl object-cover"
              style={{ border: `2px solid ${coalition?.color ?? "var(--color-border)"}` }}
            />
            {user.location && (
              <span className="online-pulse absolute -bottom-1 -right-1 border-2" style={{ borderColor: "var(--color-card)" }} />
            )}
          </div>

          {/* Identity */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-3 flex-wrap">
              <div>
                <h2 className="text-xl font-bold text-[#e2e8f0]">{user.displayname}</h2>
                <div
                  className="text-sm font-mono"
                  style={{ color: "var(--color-primary)", fontFamily: "var(--font-mono)" }}
                >
                  @{user.login}
                </div>
                {title && (
                  <div className="text-xs mt-1 italic" style={{ color: "var(--color-muted)" }}>
                    {title.name.replace("%login", user.login)}
                  </div>
                )}
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <CoalitionBadge coalition={coalition} />
                {user.location && (
                  <span
                    className="text-xs font-semibold px-2 py-1 rounded-lg"
                    style={{
                      background: "color-mix(in srgb, var(--color-green) 15%, transparent)",
                      color: "var(--color-green)",
                      fontFamily: "var(--font-mono)",
                    }}
                  >
                    ● {user.location}
                  </span>
                )}
              </div>
            </div>

            {mainCursus && (
              <div className="mt-3 max-w-xs">
                <LevelBar level={mainCursus.level} />
              </div>
            )}

            <div className="mt-2 text-xs" style={{ color: "var(--color-faint)" }}>
              {user.campus?.[0]?.name} · {mainCursus?.grade ?? mainCursus?.cursus?.name}
            </div>
          </div>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatTile label="Correction pts" value={user.correction_point} sub="available" />
        <StatTile label="Wallet" value={`₿ ${user.wallet.toLocaleString()}`} sub="walletoons" color="var(--color-yellow)" />
        <StatTile label="Projects" value={`${validatedProjects}/${totalProjects}`} sub="validated" color="var(--color-green)" />
        <StatTile label="Achievements" value={user.achievements?.length ?? 0} sub="unlocked" color="var(--color-purple)" />
      </div>

      {/* Campus pulse + Events */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Campus online */}
        <div
          className="rounded-xl border p-4 md:p-5"
          style={{ background: "var(--color-card)", borderColor: "var(--color-border)" }}
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xs font-bold uppercase tracking-wider" style={{ color: "var(--color-muted)" }}>
              Campus Pulse
            </h3>
            <button
              onClick={() => onNavigate("locations")}
              className="text-xs font-semibold transition-colors"
              style={{ color: "var(--color-primary)" }}
            >
              PeerFinder →
            </button>
          </div>

          {locLoading ? (
            <div className="space-y-2">
              {[1,2,3].map(i => <div key={i} className="skeleton h-10 w-full" />)}
            </div>
          ) : (
            <>
              <div
                className="flex items-center gap-3 p-3 rounded-xl mb-3 border-l-4"
                style={{
                  background: "color-mix(in srgb, var(--color-green) 8%, transparent)",
                  borderLeftColor: "var(--color-green)",
                }}
              >
                <span className="online-pulse" />
                <div>
                  <div className="text-lg font-black" style={{ color: "var(--color-green)", fontFamily: "var(--font-mono)" }}>
                    {onlineCount}
                  </div>
                  <div className="text-xs" style={{ color: "var(--color-faint)" }}>
                    students online now at {user.campus?.[0]?.name}
                  </div>
                </div>
              </div>

              {/* Last 5 online */}
              <div className="space-y-1.5">
                {(locations ?? []).slice(0, 5).map(loc => (
                  <div
                    key={loc.id}
                    className="flex items-center justify-between px-3 py-1.5 rounded-lg cursor-pointer transition-all"
                    style={{ background: "var(--color-card-hi)" }}
                    onClick={() => onNavigate("profile", loc.user.login)}
                    onMouseEnter={e => (e.currentTarget.style.borderColor = "var(--color-primary)")}
                  >
                    <div className="flex items-center gap-2">
                      <img src={loc.user.image?.versions?.micro} alt="" className="w-5 h-5 rounded-full" />
                      <span className="text-xs font-mono font-semibold" style={{ fontFamily: "var(--font-mono)" }}>
                        {loc.user.login}
                      </span>
                    </div>
                    <span className="text-xs font-mono" style={{ color: "var(--color-primary)", fontFamily: "var(--font-mono)" }}>
                      {loc.host}
                    </span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Upcoming events */}
        <div
          className="rounded-xl border p-4 md:p-5"
          style={{ background: "var(--color-card)", borderColor: "var(--color-border)" }}
        >
          <h3 className="text-xs font-bold uppercase tracking-wider mb-4" style={{ color: "var(--color-muted)" }}>
            Upcoming Events
          </h3>
          {!events?.length ? (
            <p className="text-xs text-center py-6" style={{ color: "var(--color-faint)" }}>
              No upcoming events
            </p>
          ) : (
            <div className="space-y-2">
              {events.slice(0, 5).map(ev => (
                <div
                  key={ev.id}
                  className="flex items-start gap-3 p-3 rounded-lg border"
                  style={{ background: "var(--color-card-hi)", borderColor: "var(--color-border)" }}
                >
                  <div
                    className="shrink-0 text-center p-1 rounded-lg min-w-[40px]"
                    style={{ background: "color-mix(in srgb, var(--color-primary) 15%, transparent)" }}
                  >
                    <div className="text-[10px] font-bold uppercase" style={{ color: "var(--color-primary)" }}>
                      {new Date(ev.begin_at).toLocaleDateString(undefined, { month: "short" })}
                    </div>
                    <div className="text-lg font-black leading-none" style={{ color: "var(--color-primary)" }}>
                      {new Date(ev.begin_at).getDate()}
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-semibold text-[#e2e8f0] truncate">{ev.name}</div>
                    <div className="text-[10px] mt-0.5" style={{ color: "var(--color-faint)" }}>
                      {ev.location} · {ev.nbr_subscribers} subscribed
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
