import { useState } from "react";
import { use42Query } from "../hooks/use42API";
import { useAuth } from "../context/AuthContext";
import { BigLevel } from "../components/LevelBar";
import { CoalitionBadge } from "../components/CoalitionBadge";
import { SkillsRadar } from "../components/SkillsRadar";
import { FullPageSpinner } from "../components/Loading";
import type { FortyTwoUser, ProjectUser, Achievement } from "../types";

type Tab = "projects" | "skills" | "achievements";

const STATUS_STYLE: Record<string, { label: string; color: string; bg: string }> = {
  finished:             { label: "Finished",    color: "var(--color-green)",  bg: "color-mix(in srgb, var(--color-green) 12%, transparent)" },
  in_progress:          { label: "In progress", color: "var(--color-yellow)", bg: "color-mix(in srgb, var(--color-yellow) 12%, transparent)" },
  searching_a_group:    { label: "Searching",   color: "var(--color-yellow)", bg: "color-mix(in srgb, var(--color-yellow) 12%, transparent)" },
  creating_group:       { label: "Grouping",    color: "var(--color-yellow)", bg: "color-mix(in srgb, var(--color-yellow) 12%, transparent)" },
  waiting_for_correction: { label: "Waiting",   color: "var(--color-primary)", bg: "color-mix(in srgb, var(--color-primary) 12%, transparent)" },
  parent:               { label: "—",           color: "var(--color-faint)",  bg: "var(--color-card-hi)" },
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
    <div className="overflow-x-auto rounded-2xl border animate-fade-in" style={{ borderColor: "var(--color-border)", background: "var(--color-card)" }}>
      <table className="w-full text-xs md:text-sm">
        <thead>
          <tr style={{ background: "var(--color-surface)" }}>
            <th className="text-left p-3 md:p-4 font-semibold rounded-tl-2xl">Project</th>
            <th className="text-left p-3 md:p-4 font-semibold">Status</th>
            <th className="text-left p-3 md:p-4 font-semibold">Grade</th>
            <th className="text-left p-3 md:p-4 font-semibold rounded-tr-2xl">Date</th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((p, i) => {
            const validated = p["validated?"];
            const status    = STATUS_STYLE[p.status] ?? { label: p.status, color: "var(--color-muted)", bg: "var(--color-card-hi)" };
            return (
              <tr
                key={p.id}
                className="group transition-colors"
                style={{ background: i % 2 === 0 ? "var(--color-card)" : "color-mix(in srgb, var(--color-card-hi) 30%, var(--color-card))" }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "var(--color-card-hi)"; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = i % 2 === 0 ? "var(--color-card)" : "color-mix(in srgb, var(--color-card-hi) 30%, var(--color-card))"; }}
              >
                <td className="p-3 md:p-4">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-1.5 h-1.5 rounded-full shrink-0"
                      style={{
                        background: validated === true
                          ? "var(--color-green)"
                          : validated === false
                          ? "var(--color-red)"
                          : "var(--color-yellow)",
                      }}
                    />
                    <div className="font-semibold text-xs" style={{ fontFamily: "var(--font-mono)", color: "#e2e8f0" }}>
                      {p.project.name}
                    </div>
                  </div>
                  {p.project.exam && (
                    <span
                      className="text-[10px] px-1.5 py-0.5 rounded mt-1 inline-block"
                      style={{ background: "var(--color-card-hi)", color: "var(--color-faint)" }}
                    >
                      exam
                    </span>
                  )}
                </td>
                <td className="p-3 md:p-4">
                  <span
                    className="inline-flex items-center gap-1 text-[10px] md:text-xs font-semibold px-2.5 py-1 rounded-full"
                    style={{ color: status.color, background: status.bg }}
                  >
                    {validated === true && (
                      <svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M1.5 5.5L3.5 7.5L8.5 2.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                    )}
                    {validated === false && (
                      <svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M2.5 2.5L7.5 7.5M7.5 2.5L2.5 7.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
                    )}
                    {status.label}
                  </span>
                </td>
                <td className="p-3 md:p-4">
                  {p.final_mark !== null ? (
                    <span
                      className="text-xs md:text-sm font-bold"
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
                <td className="p-3 md:p-4">
                  <span className="text-xs" style={{ color: "var(--color-faint)", fontFamily: "var(--font-mono)" }}>
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

function AchievementsGrid({ achievements, limit }: { achievements: Achievement[]; limit?: number }) {
  const sorted = [...achievements].sort((a, b) => {
    const order: Record<string, number> = { challenge: 0, hard: 1, medium: 2, easy: 3, bonus: 4 };
    return (order[a.tier] ?? 5) - (order[b.tier] ?? 5);
  }).slice(0, limit ?? achievements.length);

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-2 gap-3 animate-fade-in">
      {sorted.map((ach, i) => (
        <div
          key={ach.id}
          className="flex flex-col items-center gap-2.5 p-4 rounded-2xl border text-center transition-all duration-300 hover:-translate-y-0.5"
          style={{
            background: "var(--color-card)",
            borderColor: `${TIER_COLOR[ach.tier]}30`,
            animationDelay: `${i * 0.03}s`,
          }}
          title={ach.description}
        >
          {ach.image ? (
            <img src={ach.image} alt={ach.name} className="w-12 h-12 object-contain" />
          ) : (
            <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl" style={{ background: "var(--color-card-hi)" }}>
              ◈
            </div>
          )}
          <div className="text-xs font-semibold line-clamp-2 leading-snug" style={{ color: "#e2e8f0" }}>
            {ach.name}
          </div>
          <span
            className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full"
            style={{
              background: `${TIER_COLOR[ach.tier]}15`,
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
    <div className="space-y-4 animate-fade-in">
      {cursusUsers.length > 1 && (
        <div className="flex gap-2 flex-wrap">
          {cursusUsers.map((c, i) => (
            <button
              key={c.id}
              onClick={() => setSelected(i)}
              className="px-3.5 py-1.5 rounded-lg text-xs font-semibold border transition-all"
              style={
                i === selected
                  ? { background: "var(--color-primary)", color: "#000", borderColor: "var(--color-primary)" }
                  : { borderColor: "var(--color-border)", color: "var(--color-muted)" }
              }
              onMouseEnter={e => {
                if (i !== selected) {
                  (e.currentTarget as HTMLElement).style.borderColor = "var(--color-border-hi)";
                  (e.currentTarget as HTMLElement).style.color = "#e2e8f0";
                }
              }}
              onMouseLeave={e => {
                if (i !== selected) {
                  (e.currentTarget as HTMLElement).style.borderColor = "var(--color-border)";
                  (e.currentTarget as HTMLElement).style.color = "var(--color-muted)";
                }
              }}
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
    <div className="grid grid-cols-2 gap-3">
      {mainCursus && (
        <div className="animate-fade-in-up stagger-1">
          <BigLevel level={mainCursus.level} />
        </div>
      )}
      {[
        { value: user.correction_point, label: "Correction pts", color: "var(--color-primary)", glow: "glow-primary" },
        { value: user.wallet.toLocaleString(), label: "Wallet", color: "var(--color-yellow)", glow: "glow-yellow" },
        { value: user.achievements?.length ?? 0, label: "Achievements", color: "var(--color-purple)", glow: "glow-purple" },
      ].map((stat, i) => (
        <div
          key={stat.label}
          className={`flex flex-col items-center justify-center gap-1.5 px-4 py-4 rounded-2xl border transition-all duration-300 hover:-translate-y-0.5 ${stat.glow} animate-fade-in-up`}
          style={{
            background: "linear-gradient(180deg, var(--color-card-hi), var(--color-card))",
            borderColor: "var(--color-border)",
            animationDelay: `${(i + 2) * 0.08}s`,
          }}
        >
          <div className="text-2xl md:text-3xl font-black leading-none" style={{ color: stat.color, fontFamily: "var(--font-mono)" }}>
            {stat.value}
          </div>
          <div className="text-[10px] uppercase tracking-[0.15em] font-semibold" style={{ color: "var(--color-faint)" }}>
            {stat.label}
          </div>
        </div>
      ))}
    </div>
  );
}

function Sidebar({ user, mainCursus }: { user: FortyTwoUser; mainCursus?: any }) {
  const topCursus = mainCursus ? [mainCursus] : (user.cursus_users ?? []);

  return (
    <div className="space-y-5 animate-fade-in-up stagger-2">
      {/* Stats */}
      <StatsCards user={user} mainCursus={mainCursus} />

      {/* Skills Radar */}
      {topCursus.length > 0 && (
        <div
          className="rounded-2xl border p-5"
          style={{ background: "var(--color-card)", borderColor: "var(--color-border)" }}
        >
          <div className="text-xs font-bold uppercase tracking-wider mb-4" style={{ color: "var(--color-muted)" }}>
            Skills
          </div>
          <SkillsRadar skills={topCursus[0]?.skills ?? []} size={240} />
        </div>
      )}

      {/* Top Achievements */}
      {(user.achievements?.length ?? 0) > 0 && (
        <div
          className="rounded-2xl border p-5"
          style={{ background: "var(--color-card)", borderColor: "var(--color-border)" }}
        >
          <div className="flex items-center justify-between mb-4">
            <div className="text-xs font-bold uppercase tracking-wider" style={{ color: "var(--color-muted)" }}>
              Top Achievements
            </div>
            <span className="text-[10px] px-1.5 py-0.5 rounded-md font-bold" style={{ background: "var(--color-card-hi)", color: "var(--color-faint)" }}>
              {user.achievements?.length}
            </span>
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

  const { data: res, isLoading, error } = use42Query<FortyTwoUser>(
    targetLogin ? `/users/${targetLogin}` : null
  );

  const user = res?.data;

  if (!targetLogin) {
    return (
      <div className="flex flex-col items-center gap-4 p-12 text-center animate-fade-in-up">
        <div className="text-4xl" style={{ color: "var(--color-faint)" }}>◈</div>
        <p className="text-sm" style={{ color: "var(--color-faint)" }}>No profile selected</p>
        <button
          onClick={() => onNavigate("students")}
          className="text-xs px-4 py-2 rounded-xl border transition-all hover:bg-card-hi"
          style={{ borderColor: "var(--color-border-hi)", color: "var(--color-muted)" }}
        >
          Browse students →
        </button>
      </div>
    );
  }

  if (isLoading) return <FullPageSpinner />;

  if (error || !user) {
    return (
      <div className="flex flex-col items-center gap-4 p-12 text-center animate-fade-in-up">
        <div className="text-4xl" style={{ color: "var(--color-red)" }}>✕</div>
        <p className="text-sm" style={{ color: "var(--color-muted)" }}>{error?.message ?? "Profile not found"}</p>
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
  ];

  return (
    <div className="min-h-full">
      {/* ── Ambient header glow ── */}
      {coalition && (
        <div
          className="h-px w-full"
          style={{
            background: `linear-gradient(90deg, transparent, ${coalition.color}, transparent)`,
            boxShadow: `0 0 60px 8px ${coalition.color}30`,
          }}
        />
      )}

      {/* ── Header ── */}
      <div
        className="relative px-5 md:px-8 pt-6 md:pt-8 pb-6 animate-fade-in-up"
        style={{
          background: coalition
            ? `linear-gradient(180deg, ${coalition.color}10 0%, var(--color-bg) 100%)`
            : "var(--color-bg)",
        }}
      >
        <div className="flex items-start gap-5 md:gap-6 flex-wrap">
          {/* Avatar */}
          <div className="relative shrink-0 animate-scale-in">
            <div
              className="w-20 h-20 md:w-24 md:h-24 rounded-2xl p-[2px]"
              style={{
                background: `linear-gradient(135deg, ${coalition?.color ?? "var(--color-border-hi)"}, ${coalition?.color ? coalition.color + "80" : "var(--color-border)"})`,
              }}
            >
              <img
                src={user.image?.versions?.large}
                alt={user.login}
                className="w-full h-full rounded-[14px] object-cover"
                style={{ background: "var(--color-card)" }}
              />
            </div>
            {user.location && (
              <span className="online-pulse absolute -bottom-1 -right-1 border-[2.5px]" style={{ borderColor: "var(--color-bg)" }} />
            )}
          </div>

          {/* Identity */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div className="animate-fade-in-up stagger-1">
                <h1 className="text-xl md:text-2xl font-bold tracking-tight" style={{ color: "#e2e8f0", fontFamily: "var(--font-sans)" }}>
                  {user.displayname}
                </h1>
                <div className="font-semibold text-sm mt-0.5" style={{ color: "var(--color-primary)", fontFamily: "var(--font-mono)" }}>
                  @{user.login}
                </div>
                {title && (
                  <div
                    className="text-[11px] mt-2 italic px-2.5 py-1 rounded-lg inline-flex items-center gap-1.5 border"
                    style={{ color: "var(--color-muted)", borderColor: "var(--color-border)", background: "var(--color-card)" }}
                  >
                    <span>✦</span>
                    {title.name.replace("%login", user.login)}
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2 flex-wrap animate-fade-in-up stagger-2">
                <CoalitionBadge coalition={coalition} size="lg" />
                {user.location ? (
                  <span
                    className="text-[11px] font-semibold px-3 py-1.5 rounded-full flex items-center gap-1.5"
                    style={{
                      background: "color-mix(in srgb, var(--color-green) 10%, transparent)",
                      color: "var(--color-green)",
                      fontFamily: "var(--font-mono)",
                      border: "1px solid color-mix(in srgb, var(--color-green) 20%, transparent)",
                    }}
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-green" />
                    {user.location}
                  </span>
                ) : (
                  <span
                    className="text-[11px] px-3 py-1.5 rounded-full flex items-center gap-1.5"
                    style={{
                      background: "var(--color-card)",
                      color: "var(--color-faint)",
                      border: "1px solid var(--color-border)",
                      fontFamily: "var(--font-mono)",
                    }}
                  >
                    <span className="w-1.5 h-1.5 rounded-full" style={{ background: "var(--color-faint)" }} />
                    offline
                  </span>
                )}
              </div>
            </div>

            <div className="mt-3 flex items-center gap-2 flex-wrap animate-fade-in-up stagger-3">
              {primaryCampus && (
                <span className="text-[11px] px-2 py-1 rounded-md" style={{ background: "var(--color-card)", color: "var(--color-muted)" }}>
                  {primaryCampus.name}
                </span>
              )}
              {mainCursus && (
                <span className="text-[11px] px-2 py-1 rounded-md" style={{ background: "var(--color-card)", color: "var(--color-muted)" }}>
                  {mainCursus.grade ?? mainCursus.cursus?.name}
                </span>
              )}
              {user["staff?"] && (
                <span className="text-[10px] font-bold px-2 py-1 rounded-md" style={{ background: "color-mix(in srgb, var(--color-yellow) 12%, transparent)", color: "var(--color-yellow)" }}>
                  STAFF
                </span>
              )}
              {user.alumni && (
                <span className="text-[10px] font-bold px-2 py-1 rounded-md" style={{ background: "var(--color-card-hi)", color: "var(--color-faint)" }}>
                  ALUMNI
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── Two-column layout ── */}
      <div className="px-5 md:px-8 pb-8 grid grid-cols-1 xl:grid-cols-[1fr_340px] gap-6 xl:gap-8">
        {/* LEFT: Main content */}
        <div className="space-y-5 min-w-0">
          {/* Mobile-only stats row */}
          <div className="xl:hidden">
            <StatsCards user={user} mainCursus={mainCursus} />
          </div>

          {/* Tabs */}
          <div className="overflow-x-auto animate-fade-in-up stagger-3">
            <div className="flex gap-1 min-w-max">
              {TABS.map(t => (
                <button
                  key={t.id}
                  onClick={() => setTab(t.id)}
                  className="relative px-4 py-2.5 text-[13px] font-semibold transition-all rounded-lg"
                  style={
                    tab === t.id
                      ? { background: "var(--color-card-hi)", color: "#e2e8f0" }
                      : { color: "var(--color-faint)" }
                  }
                  onMouseEnter={e => {
                    if (tab !== t.id) (e.currentTarget as HTMLElement).style.color = "var(--color-muted)";
                  }}
                  onMouseLeave={e => {
                    if (tab !== t.id) (e.currentTarget as HTMLElement).style.color = "var(--color-faint)";
                  }}
                >
                  {tab === t.id && (
                    <div className="absolute inset-x-2 bottom-1 h-[2px] rounded-full" style={{ background: "var(--color-primary)" }} />
                  )}
                  <span className="relative z-10">{t.label}</span>
                  {t.count !== undefined && (
                    <span
                      className="ml-1.5 text-[10px] px-1.5 py-0.5 rounded-md font-bold"
                      style={{
                        background: tab === t.id ? "var(--color-card)" : "var(--color-card-hi)",
                        color: "var(--color-faint)",
                      }}
                    >
                      {t.count}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>

          <div className="h-px" style={{ background: "var(--color-border)" }} />

          {/* Tab content */}
          <div>
            {tab === "projects" && (
              <ProjectsTab projects={user.projects_users ?? []} />
            )}
            {tab === "skills" && (
              <SkillsTab cursusUsers={user.cursus_users ?? []} />
            )}
            {tab === "achievements" && (
              <AchievementsGrid achievements={user.achievements ?? []} />
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
