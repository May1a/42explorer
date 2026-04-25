import { useState } from "react";
import { use42API } from "../hooks/use42API";
import { useAuth } from "../context/AuthContext";
import { LevelBar, BigLevel } from "../components/LevelBar";
import { CoalitionBadge } from "../components/CoalitionBadge";
import { SkillsRadar } from "../components/SkillsRadar";
import { FullPageSpinner } from "../components/Loading";
import type { FortyTwoUser, ProjectUser, Achievement } from "../types";

type Tab = "projects" | "skills" | "achievements" | "evaluations";

const STATUS_STYLE: Record<string, { label: string; color: string }> = {
  finished:             { label: "Finished",    color: "var(--color-muted)" },
  in_progress:          { label: "In progress", color: "var(--color-yellow)" },
  searching_a_group:    { label: "Searching",   color: "var(--color-yellow)" },
  creating_group:       { label: "Grouping",    color: "var(--color-yellow)" },
  waiting_for_correction: { label: "Waiting",   color: "var(--color-primary)" },
  parent:               { label: "—",           color: "var(--color-faint)" },
};

const TIER_COLOR: Record<string, string> = {
  easy:      "var(--color-green)",
  medium:    "var(--color-primary)",
  hard:      "var(--color-purple)",
  challenge: "var(--color-yellow)",
  bonus:     "var(--color-faint)",
};

function ProjectsTab({ projects }: { projects: ProjectUser[] }) {
  const sorted = [...projects].sort((a, b) =>
    new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
  );

  return (
    <div className="overflow-x-auto rounded-xl border" style={{ borderColor: "var(--color-border)" }}>
      <table className="w-full">
        <thead style={{ background: "var(--color-surface)" }}>
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
            const status    = STATUS_STYLE[p.status] ?? { label: p.status, color: "var(--color-muted)" };
            return (
              <tr key={p.id} style={{ background: "var(--color-card)" }}>
                <td>
                  <div className="font-semibold text-xs text-[#e2e8f0]" style={{ fontFamily: "var(--font-mono)" }}>
                    {p.project.name}
                  </div>
                  {p.project.exam && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded" style={{ background: "var(--color-card-hi)", color: "var(--color-faint)" }}>
                      exam
                    </span>
                  )}
                </td>
                <td>
                  <span className="text-xs font-semibold" style={{ color: status.color }}>
                    {validated === true && "✓ "}
                    {validated === false && "✗ "}
                    {status.label}
                  </span>
                </td>
                <td>
                  {p.final_mark !== null ? (
                    <span
                      className="text-sm font-bold"
                      style={{
                        fontFamily: "var(--font-mono)",
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
                  <span className="text-xs" style={{ color: "var(--color-faint)" }}>
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

function AchievementsTab({ achievements }: { achievements: Achievement[] }) {
  const sorted = [...achievements].sort((a, b) => {
    const order = { challenge: 0, hard: 1, medium: 2, easy: 3, bonus: 4 };
    return (order[a.tier] ?? 5) - (order[b.tier] ?? 5);
  });

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
      {sorted.map(ach => (
        <div
          key={ach.id}
          className="flex flex-col items-center gap-2 p-4 rounded-xl border text-center transition-all"
          style={{ background: "var(--color-card)", borderColor: `${TIER_COLOR[ach.tier]}44` }}
          title={ach.description}
        >
          {ach.image ? (
            <img src={ach.image} alt={ach.name} className="w-12 h-12 object-contain" />
          ) : (
            <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl"
              style={{ background: "var(--color-card-hi)" }}>
              ◈
            </div>
          )}
          <div className="text-xs font-semibold text-[#e2e8f0] line-clamp-2">{ach.name}</div>
          <span
            className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full"
            style={{
              background: `${TIER_COLOR[ach.tier]}20`,
              color: TIER_COLOR[ach.tier],
            }}
          >
            {ach.tier}
          </span>
          {ach.nbr_of_success !== null && (
            <div className="text-[10px]" style={{ color: "var(--color-faint)" }}>
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
  if (!cursusUsers?.length) return <div className="text-center py-8 text-sm" style={{ color: "var(--color-faint)" }}>No skills data</div>;

  const cu = cursusUsers[selected]!;
  return (
    <div className="space-y-4">
      {cursusUsers.length > 1 && (
        <div className="flex gap-2 flex-wrap">
          {cursusUsers.map((c, i) => (
            <button
              key={c.id}
              onClick={() => setSelected(i)}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all"
              style={
                i === selected
                  ? { background: "var(--color-primary)", color: "#000", borderColor: "var(--color-primary)" }
                  : { borderColor: "var(--color-border)", color: "var(--color-muted)" }
              }
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

  const { data: user, loading, error } = use42API<FortyTwoUser>(
    targetLogin ? `/users/${targetLogin}` : null
  );

  if (!targetLogin) {
    return (
      <div className="flex flex-col items-center gap-4 p-12 text-center">
        <div className="text-4xl" style={{ color: "var(--color-faint)" }}>◈</div>
        <p className="text-sm" style={{ color: "var(--color-faint)" }}>No profile selected</p>
        <button
          onClick={() => onNavigate("students")}
          className="text-xs px-4 py-2 rounded-lg border transition-all"
          style={{ borderColor: "var(--color-border-hi)", color: "var(--color-muted)" }}
        >
          Browse students →
        </button>
      </div>
    );
  }

  if (loading) return <FullPageSpinner />;

  if (error || !user) {
    return (
      <div className="flex flex-col items-center gap-4 p-12 text-center">
        <div className="text-4xl" style={{ color: "var(--color-red)" }}>✕</div>
        <p className="text-sm" style={{ color: "var(--color-muted)" }}>{error ?? "Profile not found"}</p>
      </div>
    );
  }

  const coalition = user.coalitions_users?.[0]?.coalition;
  const mainCursus = user.cursus_users?.find(c => c.cursus_id === 21) ?? user.cursus_users?.[user.cursus_users?.length - 1];
  const selectedTitle = user.titles_users?.find(t => t.selected);
  const title = selectedTitle ? user.titles?.find(t => t.id === selectedTitle.title_id) : null;
  const primaryCampus = user.campus?.[0];
  const validatedCount = user.projects_users?.filter(p => p["validated?"] === true).length ?? 0;

  const TABS: { id: Tab; label: string; count?: number }[] = [
    { id: "projects",     label: "Projects",     count: user.projects_users?.length },
    { id: "skills",       label: "Skills" },
    { id: "achievements", label: "Achievements", count: user.achievements?.length },
  ];

  return (
    <div className="max-w-5xl mx-auto">
      {/* ── Header ── */}
      <div
        className="relative p-6"
        style={{
          background: coalition
            ? `linear-gradient(180deg, ${coalition.color}18 0%, var(--color-bg) 100%)`
            : "var(--color-bg)",
        }}
      >
        {coalition && (
          <div className="absolute inset-x-0 top-0 h-0.5" style={{ background: coalition.color }} />
        )}

        <div className="flex items-start gap-6 flex-wrap">
          {/* Avatar */}
          <div className="relative">
            <img
              src={user.image?.versions?.large}
              alt={user.login}
              className="w-24 h-24 rounded-2xl object-cover"
              style={{ border: `3px solid ${coalition?.color ?? "var(--color-border-hi)"}` }}
            />
            {user.location && (
              <span className="online-pulse absolute -bottom-1 -right-1 border-2" style={{ borderColor: "var(--color-bg)" }} />
            )}
          </div>

          {/* Identity */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div>
                <h1 className="text-2xl font-black text-[#e2e8f0]">{user.displayname}</h1>
                <div
                  className="font-semibold text-sm mt-0.5"
                  style={{ color: "var(--color-primary)", fontFamily: "var(--font-mono)" }}
                >
                  @{user.login}
                </div>
                {title && (
                  <div className="text-xs mt-1 italic px-2 py-1 rounded-lg inline-block border"
                    style={{ color: "var(--color-muted)", borderColor: "var(--color-border)" }}>
                    {title.name.replace("%login", user.login)}
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <CoalitionBadge coalition={coalition} size="lg" />
                {user.location ? (
                  <span
                    className="text-xs font-semibold px-3 py-1.5 rounded-xl"
                    style={{
                      background: "color-mix(in srgb, var(--color-green) 12%, transparent)",
                      color: "var(--color-green)",
                      fontFamily: "var(--font-mono)",
                    }}
                  >
                    ● {user.location}
                  </span>
                ) : (
                  <span className="text-xs px-3 py-1.5 rounded-xl" style={{ background: "var(--color-card-hi)", color: "var(--color-faint)" }}>
                    ○ offline
                  </span>
                )}
              </div>
            </div>

            <div className="mt-2 text-xs flex items-center gap-3 flex-wrap" style={{ color: "var(--color-faint)" }}>
              {primaryCampus && <span>{primaryCampus.name}</span>}
              {mainCursus && <span>{mainCursus.grade ?? mainCursus.cursus?.name}</span>}
              {user["staff?"] && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold"
                  style={{ background: "color-mix(in srgb, var(--color-yellow) 15%, transparent)", color: "var(--color-yellow)" }}>
                  STAFF
                </span>
              )}
              {user.alumni && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold"
                  style={{ background: "var(--color-card-hi)", color: "var(--color-faint)" }}>
                  ALUMNI
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── Stats row ── */}
      <div className="px-6 pb-4 grid grid-cols-2 sm:grid-cols-4 gap-3">
        {mainCursus && (
          <BigLevel level={mainCursus.level} />
        )}
        <div className="flex flex-col items-center gap-1 px-4 py-3 rounded-xl border"
          style={{ background: "var(--color-card-hi)", borderColor: "var(--color-border)" }}>
          <div className="text-2xl font-black" style={{ color: "var(--color-primary)", fontFamily: "var(--font-mono)" }}>
            {user.correction_point}
          </div>
          <div className="text-xs uppercase tracking-wider font-semibold" style={{ color: "var(--color-faint)" }}>Correction pts</div>
        </div>
        <div className="flex flex-col items-center gap-1 px-4 py-3 rounded-xl border"
          style={{ background: "var(--color-card-hi)", borderColor: "var(--color-border)" }}>
          <div className="text-2xl font-black" style={{ color: "var(--color-yellow)", fontFamily: "var(--font-mono)" }}>
            {user.wallet.toLocaleString()}
          </div>
          <div className="text-xs uppercase tracking-wider font-semibold" style={{ color: "var(--color-faint)" }}>Wallet</div>
        </div>
        <div className="flex flex-col items-center gap-1 px-4 py-3 rounded-xl border"
          style={{ background: "var(--color-card-hi)", borderColor: "var(--color-border)" }}>
          <div className="text-2xl font-black" style={{ color: "var(--color-purple)", fontFamily: "var(--font-mono)" }}>
            {user.achievements?.length ?? 0}
          </div>
          <div className="text-xs uppercase tracking-wider font-semibold" style={{ color: "var(--color-faint)" }}>Achievements</div>
        </div>
      </div>

      {/* ── Tabs ── */}
      <div className="px-6">
        <div className="flex gap-1 border-b" style={{ borderColor: "var(--color-border)" }}>
          {TABS.map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className="px-4 py-2.5 text-sm font-semibold transition-all relative"
              style={
                tab === t.id
                  ? { color: "var(--color-primary)" }
                  : { color: "var(--color-faint)" }
              }
            >
              {tab === t.id && (
                <div
                  className="absolute inset-x-0 bottom-0 h-0.5"
                  style={{ background: "var(--color-primary)" }}
                />
              )}
              {t.label}
              {t.count !== undefined && (
                <span
                  className="ml-1.5 text-[10px] px-1.5 py-0.5 rounded-full"
                  style={{ background: "var(--color-card-hi)", color: "var(--color-faint)" }}
                >
                  {t.count}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* ── Tab content ── */}
      <div className="p-6">
        {tab === "projects" && (
          <ProjectsTab projects={user.projects_users ?? []} />
        )}
        {tab === "skills" && (
          <SkillsTab cursusUsers={user.cursus_users ?? []} />
        )}
        {tab === "achievements" && (
          <AchievementsTab achievements={user.achievements ?? []} />
        )}
      </div>
    </div>
  );
}
