import { useMemo } from "react";
import { useAuth } from "../context/AuthContext";
import { use42Query } from "../hooks/use42API";
import { LevelBar } from "../components/LevelBar";
import { CoalitionBadge } from "../components/CoalitionBadge";
import type { FortyTwoUser, Location } from "../types";

interface StatTileProps { label: string; value: string | number; sub?: string; color?: string }
function StatTile({ label, value, sub, color }: StatTileProps) {
  return (
    <div className="py-3 pr-3">
      <div
        className="text-[20px] font-medium num leading-tight"
        style={{ color: color ?? "var(--color-ink)" }}
      >
        {value}
      </div>
      <div className="text-[11.5px] mt-1 font-medium" style={{ color: "var(--color-faint)" }}>
        {label}
      </div>
      {sub && <div className="text-[11px] mt-0.5" style={{ color: "var(--color-faint)" }}>{sub}</div>}
    </div>
  );
}

export function DashboardPage({ onNavigate }: { onNavigate: (page: any, extra?: string) => void }) {
  const { user, login } = useAuth();

  const campusId = user?.campus_users?.find(c => c.is_primary)?.campus_id;
  const nowIso = useMemo(() => new Date().toISOString(), []);

  const { data: locRes, isLoading: locLoading } = use42Query<Location[]>(
    campusId ? `/campus/${campusId}/locations` : null,
    { "filter.active": true, "page.size": 100 }
  );

  const { data: eventsRes } = use42Query<any[]>(
    campusId ? `/campus/${campusId}/events` : null,
    { "page.size": 5, sort: "begin_at", "range.begin_at": `${nowIso},` }
  );

  const locations = locRes?.data;
  const now = new Date();
  const rawEvents = eventsRes?.data ?? [];
  const events = rawEvents.filter(e =>
    new Date(e.begin_at) > now &&
    Boolean(campusId && e.campus_ids?.includes(campusId))
  );

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-full p-8 text-center gap-6 animate-fade-in">
        <div
          className="w-12 h-12 rounded-md flex items-center justify-center"
          style={{ background: "var(--color-ink)", color: "var(--color-bg)" }}
        >
          <span className="text-sm font-semibold num">42</span>
        </div>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight mb-2" style={{ color: "var(--color-ink)" }}>
            42 Explorer
          </h1>
          <p className="text-sm max-w-sm" style={{ color: "var(--color-muted)" }}>
            Explore the 42 network. Find who's online, browse student profiles, filter by
            campus, level, cursus — the data is all yours.
          </p>
        </div>
        <button onClick={() => login()} className="btn-primary px-6 py-3">
          Login with 42
        </button>
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
    <div className="p-5 md:p-8 max-w-4xl mx-auto animate-fade-in">
      <div className="flex items-baseline justify-between gap-3 flex-wrap mb-1">
        <h1 className="text-[24px] font-semibold tracking-tight" style={{ color: "var(--color-ink)" }}>
          Dashboard
        </h1>
        <span className="text-[11.5px] num" style={{ color: "var(--color-faint)" }}>
          {new Date().toLocaleTimeString()}
        </span>
      </div>
      <p className="text-[13.5px] mb-6" style={{ color: "var(--color-muted)" }}>
        Your campus at a glance — level, work, and who’s on the floor.
      </p>

      {/* Profile */}
      <div
        className="flex items-start gap-4 pb-5 mb-0"
        style={{ borderBottom: "1px solid var(--color-border)", ["--coalition" as any]: coalition?.color }}
      >
        <div className="relative">
          <img
            src={user.image?.versions?.medium}
            alt={user.login}
            className="w-14 h-14 rounded-full object-cover"
            style={{ background: "#E4D9C8", boxShadow: "inset 0 0 0 1px rgba(42,36,32,0.06)" }}
          />
          {user.location && (
            <span
              className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full"
              style={{ background: "var(--color-green)", border: "2px solid var(--color-bg)" }}
            />
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-3 flex-wrap">
            <div className="min-w-0">
              <h2 className="text-[18px] font-semibold tracking-tight" style={{ color: "var(--color-ink)" }}>
                {user.displayname}
              </h2>
              <div className="text-[12.5px] data-mono mt-0.5" style={{ color: "var(--color-primary)" }}>
                @{user.login}
              </div>
              {title && (
                <div className="text-[13px] mt-1 italic" style={{ color: "var(--color-muted)" }}>
                  {title.name.replace("%login", user.login)}
                </div>
              )}
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <CoalitionBadge coalition={coalition} />
              {user.location && (
                <span
                  className="text-[11px] font-medium px-2 py-1 rounded data-mono inline-flex items-center gap-1.5"
                  style={{
                    border: "1px solid color-mix(in srgb, var(--color-green) 30%, var(--color-border))",
                    color: "var(--color-green)",
                    background: "var(--color-surface)",
                  }}
                >
                  <span className="online-dot" />
                  {user.location}
                </span>
              )}
            </div>
          </div>

          {mainCursus && (
            <div className="mt-3 max-w-[260px]">
              <LevelBar level={mainCursus.level} />
            </div>
          )}

          <div className="mt-2 text-[12px]" style={{ color: "var(--color-faint)" }}>
            {user.campus?.[0]?.name} · {mainCursus?.grade ?? mainCursus?.cursus?.name}
          </div>
        </div>
      </div>

      {/* Stats — columns on a rule */}
      <div
        className="grid grid-cols-2 sm:grid-cols-4 mb-2"
        style={{ borderBottom: "1px solid var(--color-border)", padding: "8px 0" }}
      >
        <StatTile label="Correction points" value={user.correction_point} sub="available" />
        <StatTile label="Wallet" value={`₿ ${user.wallet.toLocaleString()}`} sub="walletoons" color="var(--color-yellow)" />
        <StatTile label="Projects" value={`${validatedProjects}/${totalProjects}`} sub="validated" color="var(--color-green)" />
        <StatTile label="Achievements" value={user.achievements?.length ?? 0} sub="unlocked" />
      </div>

      {/* Campus pulse + Events */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-8">
        <section>
          <div className="flex items-center justify-between mb-2 pb-2" style={{ borderBottom: "1px solid var(--color-border)" }}>
            <h3 className="text-[13px] font-semibold tracking-tight" style={{ color: "var(--color-ink)" }}>
              Who’s around
            </h3>
            <button
              onClick={() => onNavigate("locations")}
              className="text-[11.5px] font-medium data-mono"
              style={{ color: "var(--color-primary)" }}
            >
              peerfinder →
            </button>
          </div>

          {locLoading ? (
            <div className="space-y-2 pt-2">
              {[1,2,3].map(i => <div key={i} className="skeleton h-8 w-full" />)}
            </div>
          ) : (
            <>
              <div className="flex items-baseline gap-2.5 py-3">
                <span className="text-[22px] font-medium num" style={{ color: "var(--color-green)" }}>
                  {onlineCount}
                </span>
                <span className="text-[13px]" style={{ color: "var(--color-muted)" }}>
                  online at {user.campus?.[0]?.name}
                </span>
              </div>

              <div style={{ borderTop: "1px solid var(--color-border)" }}>
                {(locations ?? []).slice(0, 5).map(loc => (
                  <div
                    key={loc.id}
                    className="flex items-center justify-between px-1 py-2.5 cursor-pointer transition-colors"
                    style={{ borderBottom: "1px solid var(--color-rule-soft)" }}
                    onClick={() => onNavigate("profile", loc.user.login)}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <img
                        src={loc.user.image?.versions?.micro}
                        alt=""
                        className="w-6 h-6 rounded-full avatar-soft"
                      />
                      <span className="text-[12.5px] data-mono font-medium truncate">{loc.user.login}</span>
                    </div>
                    <span className="text-[11.5px] data-mono shrink-0" style={{ color: "var(--color-primary)" }}>
                      {loc.host}
                    </span>
                  </div>
                ))}
              </div>
            </>
          )}
        </section>

        <section>
          <div className="flex items-center justify-between mb-2 pb-2" style={{ borderBottom: "1px solid var(--color-border)" }}>
            <h3 className="text-[13px] font-semibold tracking-tight" style={{ color: "var(--color-ink)" }}>
              Upcoming events
            </h3>
          </div>
          {!events?.length ? (
            <p className="text-[13px] py-6" style={{ color: "var(--color-faint)" }}>
              No upcoming events
            </p>
          ) : (
            <div style={{ borderTop: "1px solid var(--color-border)" }}>
              {events.slice(0, 5).map(ev => (
                <div
                  key={ev.id}
                  className="flex items-start gap-3 py-2.5"
                  style={{ borderBottom: "1px solid var(--color-rule-soft)" }}
                >
                  <div
                    className="shrink-0 text-center px-1.5 py-1 rounded min-w-[42px]"
                    style={{ background: "var(--color-card-hi)" }}
                  >
                    <div className="text-[9.5px] font-medium uppercase" style={{ color: "var(--color-faint)" }}>
                      {new Date(ev.begin_at).toLocaleDateString(undefined, { month: "short" })}
                    </div>
                    <div className="text-[15px] font-medium leading-none num" style={{ color: "var(--color-ink)" }}>
                      {new Date(ev.begin_at).getDate()}
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[13px] font-medium truncate" style={{ color: "var(--color-ink)" }}>{ev.name}</div>
                    <div className="text-[11.5px] mt-0.5" style={{ color: "var(--color-faint)" }}>
                      {ev.location} · {ev.nbr_subscribers} subscribed
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
