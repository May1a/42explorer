import { useState } from "react";
import { use42Query } from "../hooks/use42API";
import { useAuth } from "../context/AuthContext";
import { LevelBar } from "../components/LevelBar";
import { CoalitionBadge } from "../components/CoalitionBadge";
import { SkillsRadar } from "../components/SkillsRadar";
import { FullPageSpinner } from "../components/Loading";
import { useUserScaleTeams } from "../api/scale-teams";
import { InsufficientScopeCard } from "../components/errors/InsufficientScopeCard";
import type { FortyTwoUser, ProjectUser, Achievement } from "../types";

type Tab = "projects" | "timeline" | "skills" | "achievements" | "evaluations";
type ProjectView = "table" | "timeline";

const STATUS_STYLE: Record<string, { label: string; color: string }> = {
  finished:               { label: "Finished",    color: "var(--color-green)" },
  in_progress:            { label: "In progress", color: "var(--color-primary)" },
  searching_a_group:      { label: "Searching",   color: "var(--color-yellow)" },
  creating_group:         { label: "Grouping",    color: "var(--color-yellow)" },
  waiting_for_correction: { label: "Waiting",     color: "var(--color-purple)" },
  parent:                 { label: "—",           color: "var(--color-faint)" },
};

const TIER_COLOR: Record<string, string> = {
  easy:      "var(--color-green)",
  medium:    "var(--color-primary)",
  hard:      "var(--color-purple)",
  challenge: "var(--color-yellow)",
  bonus:     "var(--color-faint)",
};

function StatusBadge({ status, validated }: { status: string; validated?: boolean | null }) {
  const s = STATUS_STYLE[status] ?? { label: status, color: "var(--color-muted)" };
  return (
    <span className="badge" style={{ color: s.color }}>
      {validated === true && (
        <svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M1.5 5.5L3.5 7.5L8.5 2.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
      )}
      {validated === false && (
        <svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M2.5 2.5L7.5 7.5M7.5 2.5L2.5 7.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
      )}
      {s.label}
    </span>
  );
}

function ProjectsTab({ projects }: { projects: ProjectUser[] }) {
  const sorted = [...projects].sort((a, b) =>
    new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
  );

  return (
    <div className="overflow-x-auto animate-fade-in" style={{ borderTop: "1px solid var(--color-border)" }}>
      <table className="w-full text-xs md:text-sm">
        <thead>
          <tr>
            <th>Project</th>
            <th>Status</th>
            <th>Grade</th>
            <th>Date</th>
          </tr>
        </thead>
        <tbody>
          {sorted.map(p => {
            const validated = p["validated?"];
            return (
              <tr key={p.id} className="transition-colors">
                <td>
                  <div className="flex items-center gap-2">
                    <div
                      className="status-dot"
                      style={{
                        background: validated === true
                          ? "var(--color-green)"
                          : validated === false
                          ? "var(--color-red)"
                          : "var(--color-yellow)",
                      }}
                    />
                    <div className="data-mono font-medium" style={{ color: "var(--color-ink)" }}>
                      {p.project.name}
                    </div>
                  </div>
                  {p.project.exam && (
                    <span className="badge mt-1">exam</span>
                  )}
                </td>
                <td>
                  <StatusBadge status={p.status} validated={validated} />
                </td>
                <td>
                  {p.final_mark !== null ? (
                    <span
                      className="num text-[13px] font-medium"
                      style={{
                        color:
                          validated === true
                            ? "var(--color-green)"
                            : validated === false
                            ? "var(--color-red)"
                            : "var(--color-muted)",
                      }}
                    >
                      {p.final_mark}
                    </span>
                  ) : (
                    <span style={{ color: "var(--color-faint)" }}>—</span>
                  )}
                </td>
                <td>
                  <span className="data-mono text-[12px]" style={{ color: "var(--color-faint)" }}>
                    {p.marked_at ? new Date(p.marked_at).toLocaleDateString() : "—"}
                  </span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function ProjectTimeline({ projects }: { projects: ProjectUser[] }) {
  const sorted = [...projects]
    .filter(p => p.marked_at)
    .sort((a, b) => new Date(a.marked_at!).getTime() - new Date(b.marked_at!).getTime());

  if (sorted.length === 0) {
    return (
      <div className="text-center py-8 text-[13px]" style={{ color: "var(--color-faint)" }}>
        No marked projects yet
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      <div className="relative pl-6 ml-2">
        <div className="absolute left-0 top-0 bottom-0 w-px" style={{ background: "var(--color-border)" }} />
        {sorted.map(p => {
          const validated = p["validated?"];
          const date = new Date(p.marked_at!);
          return (
            <div key={p.id} className="relative pb-5 last:pb-0">
              <div
                className="absolute -left-[22px] top-1.5 w-[9px] h-[9px] rounded-full border-2"
                style={{
                  background: validated === true ? "var(--color-green)" : validated === false ? "var(--color-red)" : "var(--color-yellow)",
                  borderColor: "var(--color-bg)",
                }}
              />
              <div className="data-mono text-[11.5px] mb-1" style={{ color: "var(--color-faint)" }}>
                {date.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}
              </div>
              <div className="section-card p-3">
                <div className="flex items-center justify-between gap-3 flex-wrap">
                  <div className="flex-1 min-w-0">
                    <div className="text-[13.5px] font-medium" style={{ color: "var(--color-ink)" }}>
                      {p.project.name}
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <StatusBadge status={p.status} validated={validated} />
                      <span className="data-mono text-[11.5px]" style={{ color: "var(--color-faint)" }}>
                        attempt #{p.occurrence}
                      </span>
                    </div>
                  </div>
                  {p.final_mark != null && (
                    <div
                      className="num text-[16px] font-medium shrink-0"
                      style={{
                        color: validated === true ? "var(--color-green)" : validated === false ? "var(--color-red)" : "var(--color-muted)",
                      }}
                    >
                      {p.final_mark}
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function EvaluationsTab({ userId }: { userId: number }) {
  const { data, isLoading, error } = useUserScaleTeams(userId, { "page.size": 50, sort: "-begin_at" });
  const evaluations = data?.data ?? [];

  if (isLoading) return <div className="space-y-2">{[1,2,3].map(i => <div key={i} className="skeleton h-14 w-full" />)}</div>;
  if (error) return <InsufficientScopeCard error={error} />;
  if (!evaluations.length) return <div className="text-center py-8 text-[13px]" style={{ color: "var(--color-faint)" }}>No evaluations found</div>;

  return (
    <div style={{ borderTop: "1px solid var(--color-border)" }} className="animate-fade-in">
      {evaluations.map(ev => (
        <div
          key={ev.id}
          className="flex items-center justify-between gap-3 flex-wrap px-1 py-3"
          style={{ borderBottom: "1px solid var(--color-rule-soft)" }}
        >
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className={ev.filled_at ? "badge badge-ok" : "badge badge-warn"}>
                {ev.filled_at ? "Filled" : "Pending"}
              </span>
              <span className="text-[13px] font-medium" style={{ color: "var(--color-ink)" }}>
                {ev.scale?.name ?? `Scale #${ev.scale_id}`}
              </span>
            </div>
            <div className="data-mono text-[11.5px] mt-1" style={{ color: "var(--color-faint)" }}>
              {new Date(ev.begin_at).toLocaleDateString()}
            </div>
          </div>
          {ev.final_mark != null && (
            <div
              className="num text-[16px] font-medium shrink-0"
              style={{
                color: ev.final_mark >= 50 ? "var(--color-green)" : "var(--color-red)",
              }}
            >
              {ev.final_mark}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

function AchievementsGrid({ achievements, limit }: { achievements: Achievement[]; limit?: number }) {
  const sorted = [...achievements].sort((a, b) => {
    const order: Record<string, number> = { challenge: 0, hard: 1, medium: 2, easy: 3, bonus: 4 };
    return (order[a.tier] ?? 5) - (order[b.tier] ?? 5);
  }).slice(0, limit ?? achievements.length);

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-2 gap-3 animate-fade-in">
      {sorted.map(ach => (
        <div
          key={ach.id}
          className="flex flex-col items-center gap-2.5 p-4 section-card text-center"
          title={ach.description}
        >
          {ach.image ? (
            <img src={ach.image} alt={ach.name} className="w-12 h-12 object-contain" />
          ) : (
            <div
              className="w-12 h-12 rounded flex items-center justify-center text-[11px] font-medium data-mono"
              style={{ background: "var(--color-card-hi)", color: "var(--color-faint)" }}
            >
              42
            </div>
          )}
          <div className="text-[12.5px] font-medium line-clamp-2 leading-snug" style={{ color: "var(--color-ink)" }}>
            {ach.name}
          </div>
          <span className="badge" style={{ color: TIER_COLOR[ach.tier] }}>
            {ach.tier}
          </span>
          {ach.nbr_of_success !== null && (
            <div className="text-[11px] data-mono" style={{ color: "var(--color-faint)" }}>
              {ach.nbr_of_success.toLocaleString()} users
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

function SkillsTab({ cursusUsers }: { cursusUsers: FortyTwoUser["cursus_users"] }) {
  const [selected, setSelected] = useState(0);
  if (!cursusUsers?.length) return <div className="text-center py-8 text-[13px]" style={{ color: "var(--color-faint)" }}>No skills data</div>;

  const cu = cursusUsers[selected]!;
  return (
    <div className="space-y-4 animate-fade-in">
      {cursusUsers.length > 1 && (
        <div className="flex gap-2 flex-wrap">
          {cursusUsers.map((c, i) => (
            <button
              key={c.id}
              onClick={() => setSelected(i)}
              className={i === selected ? "btn-primary text-[12px] px-3 py-1.5" : "btn-secondary text-[12px] px-3 py-1.5"}
            >
              {c.cursus?.name ?? `Cursus ${c.cursus_id}`}
            </button>
          ))}
        </div>
      )}
      <SkillsRadar skills={cu.skills ?? []} />
    </div>
  );
}

function StatsCards({ user, mainCursus }: { user: FortyTwoUser; mainCursus?: any }) {
  return (
    <div>
      {mainCursus && (
        <div className="pb-4 mb-2" style={{ borderBottom: "1px solid var(--color-border)" }}>
          <LevelBar level={mainCursus.level} />
        </div>
      )}
      <div
        className="grid grid-cols-3"
        style={{ borderBottom: "1px solid var(--color-border)", padding: "8px 0" }}
      >
        <div className="py-3 pr-3">
          <div className="text-[20px] font-medium num leading-tight" style={{ color: "var(--color-primary)" }}>
            {user.correction_point}
          </div>
          <div className="text-[11.5px] mt-1 font-medium" style={{ color: "var(--color-faint)" }}>
            Correction pts
          </div>
        </div>
        <div className="py-3 px-3" style={{ borderLeft: "1px solid var(--color-rule-soft)" }}>
          <div className="text-[20px] font-medium num leading-tight" style={{ color: "var(--color-yellow)" }}>
            {user.wallet.toLocaleString()}
          </div>
          <div className="text-[11.5px] mt-1 font-medium" style={{ color: "var(--color-faint)" }}>
            Wallet
          </div>
        </div>
        <div className="py-3 pl-3" style={{ borderLeft: "1px solid var(--color-rule-soft)" }}>
          <div className="text-[20px] font-medium num leading-tight" style={{ color: "var(--color-purple)" }}>
            {user.achievements?.length ?? 0}
          </div>
          <div className="text-[11.5px] mt-1 font-medium" style={{ color: "var(--color-faint)" }}>
            Achievements
          </div>
        </div>
      </div>
    </div>
  );
}

function Sidebar({ user, mainCursus }: { user: FortyTwoUser; mainCursus?: any }) {
  const topCursus = mainCursus ? [mainCursus] : (user.cursus_users ?? []);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Stats */}
      <StatsCards user={user} mainCursus={mainCursus} />

      {/* Skills Radar */}
      {topCursus.length > 0 && (
        <div className="section-card p-5">
          <div className="text-[13px] font-semibold tracking-tight mb-4" style={{ color: "var(--color-ink)" }}>
            Skills
          </div>
          <SkillsRadar skills={topCursus[0]?.skills ?? []} size={240} />
        </div>
      )}

      {/* Top Achievements */}
      {(user.achievements?.length ?? 0) > 0 && (
        <div className="section-card p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="text-[13px] font-semibold tracking-tight" style={{ color: "var(--color-ink)" }}>
              Top Achievements
            </div>
            <span className="badge">{user.achievements?.length}</span>
          </div>
          <AchievementsGrid achievements={user.achievements ?? []} limit={6} />
        </div>
      )}
    </div>
  );
}

export function ProfilePage({
  login: loginProp,
  onNavigate,
}: {
  login?: string;
  onNavigate: (page: any, extra?: string) => void;
}) {
  const { user: me } = useAuth();
  const targetLogin = loginProp || me?.login;
  const [tab, setTab] = useState<Tab>("projects");
  const [projView, setProjView] = useState<ProjectView>("table");

  const { data: res, isLoading, error } = use42Query<FortyTwoUser>(
    targetLogin ? `/users/${targetLogin}` : null
  );

  const user = res?.data;

  if (!targetLogin) {
    return (
      <div className="flex flex-col items-center gap-4 p-12 text-center animate-fade-in">
        <p className="text-[13px]" style={{ color: "var(--color-faint)" }}>No profile selected</p>
        <button
          onClick={() => onNavigate("students")}
          className="btn-secondary"
        >
          Browse students →
        </button>
      </div>
    );
  }

  if (isLoading) return <FullPageSpinner />;

  if (error || !user) {
    return (
      <div className="flex flex-col items-center gap-4 p-12 text-center animate-fade-in">
        <div className="text-4xl" style={{ color: "var(--color-red)" }}>✕</div>
        <p className="text-[13px]" style={{ color: "var(--color-muted)" }}>{error?.message ?? "Profile not found"}</p>
      </div>
    );
  }

  const coalition = user.coalitions_users?.[0]?.coalition;
  const mainCursus = user.cursus_users?.find(c => c.cursus_id === 21) ?? user.cursus_users?.[user.cursus_users?.length - 1];
  const selectedTitle = user.titles_users?.find(t => t.selected);
  const title = selectedTitle ? user.titles?.find(t => t.id === selectedTitle.title_id) : null;
  const primaryCampus = user.campus?.[0];

  const TABS: { id: Tab; label: string; count?: number }[] = [
    { id: "projects",     label: "Projects",     count: user.projects_users?.length },
    { id: "skills",       label: "Skills" },
    { id: "achievements", label: "Achievements", count: user.achievements?.length },
    { id: "evaluations",  label: "Evaluations" },
  ];

  return (
    <div className="min-h-full p-5 md:p-8 max-w-5xl mx-auto animate-fade-in">
      {/* Thin coalition rail */}
      {coalition && (
        <div
          className="coalition-rail mb-5"
          style={{ height: 2, ["--coalition" as any]: coalition.color }}
        />
      )}

      {/* ── Quiet profile hero ── */}
      <div
        className="flex items-start gap-4 pb-5 mb-5"
        style={{ borderBottom: "1px solid var(--color-border)", ["--coalition" as any]: coalition?.color }}
      >
        <div className="relative shrink-0">
          <img
            src={user.image?.versions?.large}
            alt={user.login}
            className="w-14 h-14 rounded-full avatar-soft object-cover"
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
              <h1 className="text-[22px] font-semibold tracking-tight" style={{ color: "var(--color-ink)" }}>
                {user.displayname}
              </h1>
              <div className="text-[12.5px] data-mono mt-0.5 font-medium" style={{ color: "var(--color-primary)" }}>
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
              {user.location ? (
                <span
                  className="badge"
                  style={{
                    color: "var(--color-green)",
                    borderColor: "color-mix(in srgb, var(--color-green) 30%, var(--color-border))",
                  }}
                >
                  <span className="online-dot" />
                  {user.location}
                </span>
              ) : (
                <span className="badge">
                  <span className="status-dot" />
                  offline
                </span>
              )}
            </div>
          </div>

          {mainCursus && (
            <div className="mt-3 max-w-[260px]">
              <LevelBar level={mainCursus.level} />
            </div>
          )}

          <div className="mt-2 flex items-center gap-2 flex-wrap">
            {primaryCampus && (
              <span className="badge">{primaryCampus.name}</span>
            )}
            {mainCursus && (
              <span className="badge">{mainCursus.grade ?? mainCursus.cursus?.name}</span>
            )}
            {user["staff?"] && (
              <span className="badge badge-warn">STAFF</span>
            )}
            {user.alumni && (
              <span className="badge">ALUMNI</span>
            )}
          </div>
        </div>
      </div>

      {/* ── Two-column layout ── */}
      <div className="grid grid-cols-1 xl:grid-cols-[1fr_340px] gap-6 xl:gap-8">
        {/* LEFT: Main content */}
        <div className="space-y-5 min-w-0">
          {/* Mobile-only stats row */}
          <div className="xl:hidden">
            <StatsCards user={user} mainCursus={mainCursus} />
          </div>

          {/* Quiet segmented tabs */}
          <div className="overflow-x-auto">
            <div className="flex gap-1.5 min-w-max">
              {TABS.map(t => (
                <button
                  key={t.id}
                  onClick={() => setTab(t.id)}
                  className={
                    tab === t.id
                      ? "btn-primary text-[12.5px] px-3.5 py-1.5"
                      : "btn-secondary text-[12.5px] px-3.5 py-1.5"
                  }
                >
                  {t.label}
                  {t.count !== undefined && (
                    <span className="data-mono text-[11px] opacity-75">
                      {t.count}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Tab content */}
          <div>
            {tab === "projects" && (
              <div className="space-y-3">
                <div className="flex gap-1.5">
                  {(["table", "timeline"] as ProjectView[]).map(v => (
                    <button
                      key={v}
                      onClick={() => setProjView(v)}
                      className={
                        projView === v
                          ? "btn-primary text-[12px] px-3 py-1"
                          : "btn-secondary text-[12px] px-3 py-1"
                      }
                    >
                      {v}
                    </button>
                  ))}
                </div>
                {projView === "table" ? (
                  <ProjectsTab projects={user.projects_users ?? []} />
                ) : (
                  <ProjectTimeline projects={user.projects_users ?? []} />
                )}
              </div>
            )}
            {tab === "skills" && (
              <SkillsTab cursusUsers={user.cursus_users ?? []} />
            )}
            {tab === "achievements" && (
              <AchievementsGrid achievements={user.achievements ?? []} />
            )}
            {tab === "evaluations" && (
              <EvaluationsTab userId={user.id} />
            )}
          </div>
        </div>

        {/* RIGHT: Sidebar (xl+ only) */}
        <div className="hidden xl:block">
          <div className="sticky top-6">
            <Sidebar user={user} mainCursus={mainCursus} />
          </div>
        </div>
      </div>
    </div>
  );
}
