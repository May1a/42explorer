import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useAuth } from "../context/AuthContext";
import { useProjectUsers, useCursusProjects, useStartProject, useSubmitProject } from "../api/projects";
import { useMyScaleTeams } from "../api/scale-teams";
import { useMySlots, useCreateSlot } from "../api/slots";
import { LevelBar } from "../components/LevelBar";
import { InsufficientScopeCard, ScopePrompt } from "../components/errors/InsufficientScopeCard";
import type { ProjectUser, Project, ScaleTeam, Slot } from "../types";
import { openOfficial } from "../lib/redirects";
import { useQueryClient } from "@tanstack/react-query";

/* ── Constants ───────────────────────────────────────────────────────────── */

const STATUS_META: Record<string, { label: string; color: string }> = {
  finished:               { label: "Finished",           color: "var(--color-green)" },
  in_progress:            { label: "In progress",        color: "var(--color-primary)" },
  searching_a_group:      { label: "Searching group",    color: "var(--color-yellow)" },
  creating_group:         { label: "Creating group",     color: "var(--color-yellow)" },
  waiting_for_correction: { label: "Waiting correction", color: "var(--color-purple)" },
  parent:                 { label: "Parent",             color: "var(--color-faint)" },
};

/* ── Small Components ────────────────────────────────────────────────────── */

function StatusBadge({ status }: { status: string }) {
  const s = STATUS_META[status] ?? { label: status, color: "var(--color-faint)" };
  return (
    <span
      className="badge"
      style={{
        color: s.color,
        borderColor: `color-mix(in srgb, ${s.color} 30%, var(--color-border))`,
      }}
    >
      {s.label}
    </span>
  );
}

function SectionHeader({ title, count }: { title: string; count?: number }) {
  return (
    <div className="flex items-center justify-between mb-2 pb-2" style={{ borderBottom: "1px solid var(--color-border)" }}>
      <h2 className="text-[13px] font-semibold tracking-tight" style={{ color: "var(--color-ink)" }}>
        {title}
      </h2>
      {count != null && (
        <span className="text-[11.5px] num" style={{ color: "var(--color-faint)" }}>
          {count}
        </span>
      )}
    </div>
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    <p className="text-[13px] py-4 text-center" style={{ color: "var(--color-faint)" }}>
      {text}
    </p>
  );
}

/* ── Main Page ───────────────────────────────────────────────────────────── */

export function My42Page() {
  const { user, login, currentScope, hasScope } = useAuth();
  const qc = useQueryClient();
  const navigate = useNavigate();

  const { data: myProjectsData, isLoading: mpLoading, error: mpError } = useProjectUsers(user?.id);
  const { data: cursusProjectsData, isLoading: cpLoading, error: cpError } = useCursusProjects(21, undefined, { enabled: hasScope("projects") });
  const { data: correctedData, isLoading: cByLoading, error: cByError } = useMyScaleTeams("as_corrected");
  const { data: correctorData, isLoading: cForLoading, error: cForError } = useMyScaleTeams("as_corrector");
  const { data: slotsData, isLoading: slotsLoading, error: slotsError } = useMySlots({
    "page.size": 100,
    sort: "begin_at",
  }, { enabled: hasScope("projects") });

  const startProject = useStartProject();
  const submitProject = useSubmitProject();
  const createSlot = useCreateSlot();

  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  const myProjects = myProjectsData?.data ?? [];
  const startedIds = new Set(myProjects.map((p) => p.project.id));

  const currentProjects = myProjects.filter(
    (p) =>
      p.status === "in_progress" ||
      p.status === "searching_a_group" ||
      p.status === "creating_group" ||
      p.status === "waiting_for_correction",
  );

  const availableProjects = (cursusProjectsData?.data ?? []).filter((p) => !startedIds.has(p.id));

  const myEvals = [
    ...(correctedData?.data ?? []).map((e) => ({ ...e, _kind: "as_corrected" as const })),
    ...(correctorData?.data ?? []).map((e) => ({ ...e, _kind: "as_corrector" as const })),
  ].sort((a, b) => new Date(b.begin_at).getTime() - new Date(a.begin_at).getTime());

  const allSlots = (slotsData?.data ?? []).sort(
    (a, b) => new Date(a.begin_at).getTime() - new Date(b.begin_at).getTime(),
  );
  const upcomingSlots = allSlots.filter((s) => new Date(s.end_at) > new Date()).slice(0, 5);

  const mainCursus =
    user?.cursus_users?.find((c) => c.cursus_id === 21) ?? user?.cursus_users?.[0];
  const validatedProjects = myProjects.filter((p) => p["validated?"] === true).length;
  const totalFinished = myProjects.filter((p) => p.status === "finished").length;

  function flash(msg: string) {
    setActionSuccess(msg);
    setTimeout(() => setActionSuccess(null), 3000);
  }

  function handleStart(projectId: number, projectName: string) {
    setActionError(null);
    startProject.mutate(
      { projectId },
      {
        onSuccess: () => {
          flash(`Started ${projectName}`);
          qc.invalidateQueries({ queryKey: ["42", "/me/projects_users"] });
        },
        onError: (err) => {
          if (err.isInsufficientScope) {
            setActionError(`"${projectName}" requires the projects scope.`);
          } else {
            setActionError(err.message);
          }
        },
      },
    );
  }

  function handleSubmit(pu: ProjectUser) {
    setActionError(null);
    submitProject.mutate(
      { projectUserId: pu.id },
      {
        onSuccess: () => {
          flash(`Submitted ${pu.project.name}`);
          qc.invalidateQueries({ queryKey: ["42", "/me/projects_users"] });
        },
        onError: (err) => {
          if (err.isInsufficientScope) {
            setActionError(`Submitting requires the projects scope.`);
          } else {
            setActionError(err.message);
          }
        },
      },
    );
  }

  function handleQuickSlot() {
    const now = new Date();
    now.setMinutes(Math.ceil(now.getMinutes() / 15) * 15, 0, 0);
    const end = new Date(now.getTime() + 60 * 60 * 1000);
    setActionError(null);
    createSlot.mutate(
      { begin_at: now.toISOString(), end_at: end.toISOString() },
      {
        onSuccess: () => flash("Slot created"),
        onError: (err) => {
          if (err.isInsufficientScope) {
            setActionError(`Creating slots requires the projects scope.`);
          } else {
            setActionError(err.message);
          }
        },
      },
    );
  }

  const isLoading = mpLoading || cpLoading || cByLoading || cForLoading || slotsLoading;

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] p-8 text-center gap-6 animate-fade-in">
        <div
          className="w-12 h-12 rounded-md flex items-center justify-center"
          style={{ background: "var(--color-ink)", color: "var(--color-bg)" }}
        >
          <span className="text-sm font-semibold num">42</span>
        </div>
        <div>
          <h1 className="text-[24px] font-semibold tracking-tight mb-2" style={{ color: "var(--color-ink)" }}>My 42</h1>
          <p className="text-sm max-w-xs" style={{ color: "var(--color-muted)" }}>
            Log in with your 42 account to see your projects, evaluations, and availability slots.
          </p>
        </div>
        <button onClick={() => login()} className="btn-primary px-6 py-3">
          Login with 42
        </button>
      </div>
    );
  }

  return (
    <div className="p-5 md:p-8 max-w-4xl mx-auto animate-fade-in">
      {/* Header */}
      <div className="flex items-baseline justify-between gap-3 flex-wrap mb-1">
        <h1 className="text-[24px] font-semibold tracking-tight" style={{ color: "var(--color-ink)" }}>
          My 42
        </h1>
        <div className="flex items-center gap-3 min-w-[180px] max-w-[240px]">
          {mainCursus && <LevelBar level={mainCursus.level} />}
        </div>
      </div>
      <p className="text-[13.5px] mb-5" style={{ color: "var(--color-muted)" }}>
        Projects, evaluations, and availability.
      </p>

      {/* Quick stats — columns on a rule */}
      <div
        className="flex flex-wrap items-center gap-5 md:gap-8 py-4 mb-4"
        style={{ borderBottom: "1px solid var(--color-border)" }}
      >
        <StatItem label="Level" value={mainCursus?.level?.toFixed(2) ?? "?"} />
        <StatItem label="Correction" value={String(user.correction_point)} />
        <StatItem label="Wallet" value={`₿ ${user.wallet.toLocaleString()}`} color="var(--color-yellow)" />
        <StatItem
          label="Projects"
          value={`${validatedProjects}/${totalFinished || myProjects.length}`}
          color="var(--color-green)"
        />
        <StatItem label="Scope" value={currentScope} color="var(--color-muted)" />
      </div>

      {/* Notifications */}
      {actionSuccess && (
        <div
          className="flex items-center justify-between gap-3 rounded-md border px-4 py-2.5 text-[12.5px] animate-fade-in-up"
          style={{
            background: "color-mix(in srgb, var(--color-green) 8%, var(--color-surface))",
            borderColor: "color-mix(in srgb, var(--color-green) 30%, var(--color-border))",
            color: "var(--color-green)",
          }}
        >
          <span>{actionSuccess}</span>
          <button onClick={() => setActionSuccess(null)} className="opacity-60 hover:opacity-100 font-medium">×</button>
        </div>
      )}
      {actionError && (
        <div
          className="flex items-start justify-between gap-3 rounded-md border px-4 py-2.5 text-[12.5px] animate-fade-in-up"
          style={{
            background: "color-mix(in srgb, var(--color-red) 8%, var(--color-surface))",
            borderColor: "color-mix(in srgb, var(--color-red) 30%, var(--color-border))",
            color: "var(--color-red)",
          }}
        >
          <div className="flex-1 min-w-0">
            <span>{actionError}</span>
            {actionError.includes("projects scope") && (
              <button
                onClick={() => login(["projects"])}
                className="ml-2 font-bold underline"
                style={{ color: "var(--color-primary)" }}
              >
                Re-authorize with projects scope →
              </button>
            )}
          </div>
          <button onClick={() => setActionError(null)} className="shrink-0 opacity-60 hover:opacity-100 font-bold">×</button>
        </div>
      )}

      {isLoading && (
        <div className="space-y-4 animate-fade-in">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="skeleton h-28 w-full rounded-lg" />
          ))}
        </div>
      )}

      {!isLoading && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 md:gap-6">
          {/* ── Left column ── */}
          <div className="space-y-5">
            {/* Current Projects */}
            <section className="section-card p-5">
              <SectionHeader title={`Current Project${currentProjects.length !== 1 ? "s" : ""}`} count={currentProjects.length} />

              {mpError ? (
                <InsufficientScopeCard error={mpError} />
              ) : currentProjects.length === 0 ? (
                <EmptyState text="No active projects. Start one below." />
              ) : (
                <div className="space-y-2">
                  {currentProjects.map((pu) => (
                    <CurrentProjectCard
                      key={pu.id}
                      pu={pu}
                      isSubmitting={submitProject.isPending}
                      onSubmit={() => handleSubmit(pu)}
                      onNavigate={() => navigate({ to: "/project/$id", params: { id: String(pu.project.id) } })}
                    />
                  ))}
                </div>
              )}
            </section>

            {/* Available Projects */}
            <section className="section-card p-5">
              <SectionHeader title="Available Projects" count={hasScope("projects") ? availableProjects.length : undefined} />

              {!hasScope("projects") ? (
                <ScopePrompt
                  title="Projects Scope Needed"
                  message="Available projects require the projects scope."
                />
              ) : cpError ? (
                <InsufficientScopeCard error={cpError} />
              ) : availableProjects.length === 0 ? (
                <EmptyState text="No available projects found for your cursus." />
              ) : (
                <div className="space-y-1 max-h-[480px] overflow-y-auto pr-1">
                  {availableProjects.slice(0, 40).map((proj) => (
                    <AvailableProjectRow
                      key={proj.id}
                      project={proj}
                      isStarting={startProject.isPending}
                      onStart={() => handleStart(proj.id, proj.name)}
                    />
                  ))}
                  {availableProjects.length > 40 && (
                    <p className="text-xs text-center py-2" style={{ color: "var(--color-faint)" }}>
                      + {availableProjects.length - 40} more
                    </p>
                  )}
                </div>
              )}
            </section>
          </div>

          {/* ── Right column ── */}
          <div className="space-y-5">
            {/* Evaluations */}
            <section className="section-card p-5">
              <SectionHeader title="Evaluations" count={myEvals.length} />

              {cByError && !cForError ? (
                <InsufficientScopeCard error={cByError} />
              ) : cForError && !cByError ? (
                <InsufficientScopeCard error={cForError} />
              ) : cByError && cForError ? (
                <InsufficientScopeCard error={cByError} />
              ) : myEvals.length === 0 ? (
                <EmptyState text="No evaluations yet." />
              ) : (
                <div className="space-y-2 max-h-[380px] overflow-y-auto pr-1">
                  {myEvals.slice(0, 10).map((ev) => (
                    <EvalMiniCard key={ev.id} eval={ev} />
                  ))}
                  {myEvals.length > 10 && (
                    <p className="text-xs text-center py-2" style={{ color: "var(--color-faint)" }}>
                      + {myEvals.length - 10} more
                    </p>
                  )}
                </div>
              )}
            </section>

            {/* Slots */}
            <section className="section-card p-5">
              <div className="flex items-center justify-between mb-2 pb-2" style={{ borderBottom: "1px solid var(--color-border)" }}>
                <h2 className="text-[13px] font-semibold tracking-tight" style={{ color: "var(--color-ink)" }}>
                  My Slots
                </h2>
                {hasScope("projects") && (
                  <button
                    onClick={handleQuickSlot}
                    disabled={createSlot.isPending}
                    className="text-[12px] font-medium px-2.5 py-1 rounded-md disabled:opacity-50"
                    style={{ background: "var(--color-primary)", color: "#FBF8F3" }}
                  >
                    {createSlot.isPending ? "…" : "+1h"}
                  </button>
                )}
              </div>

              {!hasScope("projects") ? (
                <ScopePrompt
                  title="Projects Scope Needed"
                  message="Slots require the projects scope."
                />
              ) : slotsError ? (
                <InsufficientScopeCard error={slotsError} />
              ) : upcomingSlots.length === 0 ? (
                <EmptyState text="No upcoming slots. Click +1h to open a slot." />
              ) : (
                <div className="space-y-1.5">
                  {upcomingSlots.map((slot) => (
                    <SlotMiniRow key={slot.id} slot={slot} />
                  ))}
                </div>
              )}

              <a
                href="/slots"
                className="inline-block mt-4 text-[11.5px] font-medium data-mono"
                style={{ color: "var(--color-primary)" }}
                onClick={(e) => {
                  e.preventDefault();
                  window.location.href = "/slots";
                }}
              >
                full calendar →
              </a>
            </section>
          </div>
        </div>
      )}
    </div>
  );
}

/* ── Sub-components ──────────────────────────────────────────────────────── */

function StatItem({ label, value, color }: { label: string; value: string | number; color?: string }) {
  return (
    <div className="flex flex-col">
      <span
        className="text-[16px] md:text-[18px] font-medium num"
        style={{ color: color ?? "var(--color-ink)" }}
      >
        {value}
      </span>
      <span className="text-[11.5px] font-medium mt-0.5" style={{ color: "var(--color-faint)" }}>
        {label}
      </span>
    </div>
  );
}

function CurrentProjectCard({
  pu,
  isSubmitting,
  onSubmit,
  onNavigate,
}: {
  pu: ProjectUser;
  isSubmitting: boolean;
  onSubmit: () => void;
  onNavigate: () => void;
}) {
  return (
    <div
      className="border p-3.5 card-hover cursor-pointer group"
      style={{ background: "var(--color-surface)", borderColor: "var(--color-border)", borderRadius: 4 }}
      onClick={onNavigate}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1.5">
            <StatusBadge status={pu.status} />
            {pu.final_mark != null && (
              <span
                className="data-mono text-[12.5px] font-medium"
                style={{
                  color: pu["validated?"] ? "var(--color-green)" : "var(--color-red)",
                }}
              >
                {pu.final_mark}%
              </span>
            )}
          </div>
          <div className="text-[14px] font-medium truncate" style={{ color: "var(--color-ink)" }}>
            {pu.project.name}
          </div>
          <div className="text-[11.5px] mt-1 data-mono" style={{ color: "var(--color-faint)" }}>
            {pu.project.slug} · attempt #{pu.occurrence}
            {pu.current_team_id ? ` · team #${pu.current_team_id}` : ""}
          </div>
        </div>

        <button
          onClick={(e) => {
            e.stopPropagation();
            onSubmit();
          }}
          disabled={isSubmitting || pu.status === "finished" || pu.status === "parent"}
          className="shrink-0 text-[12px] font-medium px-3 py-1.5 rounded-md disabled:opacity-30 disabled:cursor-default"
          style={
            pu.status === "waiting_for_correction"
              ? {
                  background: "var(--color-surface)",
                  color: "var(--color-purple)",
                  border: "1px solid color-mix(in srgb, var(--color-purple) 35%, var(--color-border))",
                }
              : {
                  background: "var(--color-primary)",
                  color: "#FBF8F3",
                }
          }
        >
          {isSubmitting ? "…" : pu.status === "waiting_for_correction" ? "View" : "Submit"}
        </button>
      </div>
    </div>
  );
}

function AvailableProjectRow({
  project,
  isStarting,
  onStart,
}: {
  project: Project;
  isStarting: boolean;
  onStart: () => void;
}) {
  return (
    <div
      className="flex items-center justify-between gap-2 px-2 py-2 rounded-md"
      style={{ borderBottom: "1px solid var(--color-rule-soft)" }}
    >
      <div className="flex-1 min-w-0">
        <div className="text-[13px] font-medium truncate" style={{ color: "var(--color-ink)" }}>{project.name}</div>
        <div className="text-[11.5px] data-mono" style={{ color: "var(--color-faint)" }}>
          {project.slug}
        </div>
      </div>
      <button
        onClick={onStart}
        disabled={isStarting}
        className="shrink-0 text-[12px] font-medium px-2.5 py-1 rounded-md disabled:opacity-50"
        style={{ background: "var(--color-primary)", color: "#FBF8F3" }}
      >
        {isStarting ? "…" : "Start"}
      </button>
    </div>
  );
}

function EvalMiniCard({ eval: ev }: { eval: ScaleTeam & { _kind: "as_corrected" | "as_corrector" } }) {
  const filled = ev.filled_at != null;
  const mark = ev.final_mark;

  return (
    <div
      className="border p-2.5 card-hover"
      style={{ background: "var(--color-surface)", borderColor: "var(--color-border)", borderRadius: 4 }}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap mb-1">
            <span
              className="badge"
              style={{
                color: filled ? "var(--color-green)" : "var(--color-yellow)",
                borderColor: `color-mix(in srgb, ${filled ? "var(--color-green)" : "var(--color-yellow)"} 30%, var(--color-border))`,
              }}
            >
              {filled ? "Done" : "Pending"}
            </span>
            <span className="badge">
              {ev._kind === "as_corrected" ? "My eval" : "I evaluate"}
            </span>
          </div>
          <div className="text-[13px] font-medium truncate" style={{ color: "var(--color-ink)" }}>
            {ev.scale?.name ?? `Scale #${ev.scale_id}`}
          </div>
          <div className="text-[11.5px] mt-0.5" style={{ color: "var(--color-faint)" }}>
            {new Date(ev.begin_at).toLocaleDateString()} · {ev.team?.name ?? `Team #${ev.team?.id}`}
          </div>
        </div>
        <div className="text-right shrink-0">
          {mark != null && (
            <div
              className="data-mono text-[15px] font-medium"
              style={{
                color: mark >= 50 ? "var(--color-green)" : "var(--color-red)",
              }}
            >
              {mark}
            </div>
          )}
          <button
            onClick={() => openOfficial("unverified_workflow", "https://profile.42.fr/")}
            className="text-[11px] font-medium mt-1"
            style={{ color: "var(--color-muted)" }}
          >
            Open 42 ↗
          </button>
        </div>
      </div>
    </div>
  );
}

function SlotMiniRow({ slot }: { slot: Slot }) {
  const begin = new Date(slot.begin_at);
  const end = new Date(slot.end_at);
  const scaleName = slot.scale_team?.scale?.name;

  return (
    <div
      className="flex items-center justify-between gap-2 px-2 py-2"
      style={{ borderBottom: "1px solid var(--color-rule-soft)" }}
    >
      <div className="flex items-center gap-2 min-w-0">
        <span
          className="online-dot"
          style={{ background: scaleName ? "var(--color-purple)" : "var(--color-green)" }}
        />
        <span className="text-[12.5px] truncate data-mono" style={{ color: "var(--color-ink)" }}>
          {begin.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}
        </span>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <span className="text-[11.5px] data-mono" style={{ color: "var(--color-faint)" }}>
          {begin.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}–
          {end.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
        </span>
        {scaleName && (
          <span className="text-[11px] truncate max-w-[80px]" style={{ color: "var(--color-purple)" }}>
            {scaleName}
          </span>
        )}
      </div>
    </div>
  );
}
