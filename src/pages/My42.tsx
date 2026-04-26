import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useProjectUsers, useCursusProjects, useStartProject, useSubmitProject } from "../api/projects";
import { useMyScaleTeams } from "../api/scale-teams";
import { useMySlots, useCreateSlot } from "../api/slots";
import { LevelBar } from "../components/LevelBar";
import type { ProjectUser, Project, ScaleTeam, Slot } from "../types";
import { openOfficial } from "../lib/redirects";
import { useQueryClient } from "@tanstack/react-query";

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  finished:              { label: "Finished",              color: "var(--color-green)" },
  in_progress:           { label: "In Progress",           color: "var(--color-primary)" },
  searching_a_group:     { label: "Searching Group",       color: "var(--color-yellow)" },
  creating_group:        { label: "Creating Group",        color: "var(--color-yellow)" },
  waiting_for_correction:{ label: "Waiting Correction",    color: "var(--color-purple)" },
  parent:                { label: "Parent Project",        color: "var(--color-muted)" },
};

function StatusBadge({ status }: { status: string }) {
  const s = STATUS_LABELS[status] ?? { label: status, color: "var(--color-faint)" };
  return (
    <span
      className="text-[10px] font-bold uppercase px-1.5 py-0.5 rounded"
      style={{ color: s.color, background: `color-mix(in srgb, ${s.color} 12%, transparent)` }}
    >
      {s.label}
    </span>
  );
}

function StatPill({ label, value, color }: { label: string; value: string | number; color?: string }) {
  return (
    <div className="flex items-center gap-2">
      <span
        className="text-sm md:text-base font-black"
        style={{ color: color ?? "var(--color-primary)", fontFamily: "var(--font-mono)" }}
      >
        {value}
      </span>
      <span className="text-[10px] uppercase tracking-wider" style={{ color: "var(--color-faint)" }}>
        {label}
      </span>
    </div>
  );
}

export function My42Page() {
  const { user, login, currentScope } = useAuth();
  const qc = useQueryClient();

  const { data: myProjectsData, isLoading: mpLoading } = useProjectUsers(user?.id);
  const { data: cursusProjectsData, isLoading: cpLoading } = useCursusProjects(21);
  const { data: correctedData, isLoading: cByLoading } = useMyScaleTeams("as_corrected");
  const { data: correctorData, isLoading: cForLoading } = useMyScaleTeams("as_corrector");
  const { data: slotsData, isLoading: slotsLoading } = useMySlots({ "page.size": 100, sort: "begin_at" });

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

  const availableProjects = (cursusProjectsData?.data ?? []).filter(
    (p) => !startedIds.has(p.id),
  );

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
            setActionError(
              `"${projectName}" requires the projects scope. Your current scope is "${currentScope}".`,
            );
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
            setActionError(
              `Submitting "${pu.project.name}" requires the projects scope. Your current scope is "${currentScope}".`,
            );
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
            setActionError(
              `Creating slots requires the projects scope. Your current scope is "${currentScope}".`,
            );
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
      <div className="flex items-center justify-center min-h-[60vh]">
        <p className="text-sm" style={{ color: "var(--color-faint)" }}>Loading profile...</p>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 max-w-5xl mx-auto space-y-4 md:space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <h1
          className="text-base md:text-lg font-bold tracking-widest uppercase"
          style={{ fontFamily: "var(--font-mono)", color: "#e2e8f0" }}
        >
          &gt; MY_42_
        </h1>
        <div className="flex items-center gap-3">
          {mainCursus && <LevelBar level={mainCursus.level} />}
        </div>
      </div>

      {/* Quick Stats */}
      <div
        className="rounded-xl border p-3 md:p-4 flex flex-wrap items-center gap-4 md:gap-6"
        style={{ background: "var(--color-card)", borderColor: "var(--color-border)" }}
      >
        <StatPill label="Level" value={mainCursus?.level?.toFixed(2) ?? "?"} />
        <StatPill label="Correction pts" value={user.correction_point} />
        <StatPill label="Wallet" value={`₿ ${user.wallet.toLocaleString()}`} color="var(--color-yellow)" />
        <StatPill
          label="Projects"
          value={`${validatedProjects}/${totalFinished || myProjects.length}`}
          color="var(--color-green)"
        />
        <StatPill label="Scope" value={currentScope} color="var(--color-muted)" />
      </div>

      {/* Success/Error banners */}
      {actionSuccess && (
        <div
          className="flex items-center justify-between gap-3 rounded-lg border px-3 py-2 text-xs"
          style={{
            background: "color-mix(in srgb, var(--color-green) 10%, var(--color-card))",
            borderColor: "color-mix(in srgb, var(--color-green) 40%, transparent)",
            color: "var(--color-green)",
          }}
        >
          <span>✓ {actionSuccess}</span>
          <button onClick={() => setActionSuccess(null)} className="opacity-60 hover:opacity-100 font-bold">×</button>
        </div>
      )}
      {actionError && (
        <div
          className="flex items-start justify-between gap-3 rounded-lg border px-3 py-2 text-xs"
          style={{
            background: "color-mix(in srgb, var(--color-red) 10%, var(--color-card))",
            borderColor: "color-mix(in srgb, var(--color-red) 40%, transparent)",
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
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="skeleton h-24 w-full rounded-xl" />
          ))}
        </div>
      )}

      {!isLoading && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-5">
          {/* ── Left column ── */}
          <div className="space-y-4 md:space-y-5">
            {/* Current Projects */}
            <section
              className="rounded-xl border p-4 md:p-5"
              style={{ background: "var(--color-card)", borderColor: "var(--color-border)" }}
            >
              <h2
                className="text-[11px] font-extrabold uppercase tracking-widest mb-4"
                style={{ color: "var(--color-primary)", fontFamily: "var(--font-mono)" }}
              >
                Current Project{currentProjects.length !== 1 ? "s" : ""}
              </h2>

              {currentProjects.length === 0 ? (
                <p className="text-xs py-3" style={{ color: "var(--color-faint)" }}>
                  No active projects. Start one below.
                </p>
              ) : (
                <div className="space-y-2">
                  {currentProjects.map((pu) => (
                    <CurrentProjectCard
                      key={pu.id}
                      pu={pu}
                      isSubmitting={submitProject.isPending}
                      onSubmit={() => handleSubmit(pu)}
                    />
                  ))}
                </div>
              )}
            </section>

            {/* Available Projects */}
            <section
              className="rounded-xl border p-4 md:p-5"
              style={{ background: "var(--color-card)", borderColor: "var(--color-border)" }}
            >
              <div className="flex items-center justify-between mb-4">
                <h2
                  className="text-[11px] font-extrabold uppercase tracking-widest"
                  style={{ color: "var(--color-primary)", fontFamily: "var(--font-mono)" }}
                >
                  Available Projects
                </h2>
                <span className="text-[10px]" style={{ color: "var(--color-faint)", fontFamily: "var(--font-mono)" }}>
                  {availableProjects.length} available
                </span>
              </div>

              {availableProjects.length === 0 ? (
                <p className="text-xs py-3" style={{ color: "var(--color-faint)" }}>
                  No available projects found for your cursus.
                </p>
              ) : (
                <div className="space-y-1.5 max-h-[500px] overflow-y-auto">
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
                      + {availableProjects.length - 40} more projects
                    </p>
                  )}
                </div>
              )}
            </section>
          </div>

          {/* ── Right column ── */}
          <div className="space-y-4 md:space-y-5">
            {/* Evaluations */}
            <section
              className="rounded-xl border p-4 md:p-5"
              style={{ background: "var(--color-card)", borderColor: "var(--color-border)" }}
            >
              <div className="flex items-center justify-between mb-4">
                <h2
                  className="text-[11px] font-extrabold uppercase tracking-widest"
                  style={{ color: "var(--color-primary)", fontFamily: "var(--font-mono)" }}
                >
                  Evaluations
                </h2>
                <span className="text-[10px]" style={{ color: "var(--color-faint)", fontFamily: "var(--font-mono)" }}>
                  {myEvals.length} total
                </span>
              </div>

              {myEvals.length === 0 ? (
                <p className="text-xs py-3" style={{ color: "var(--color-faint)" }}>
                  No evaluations yet.
                </p>
              ) : (
                <div className="space-y-2 max-h-[400px] overflow-y-auto">
                  {myEvals.slice(0, 10).map((ev) => (
                    <EvalMiniCard key={ev.id} eval={ev} />
                  ))}
                  {myEvals.length > 10 && (
                    <p className="text-xs text-center py-2" style={{ color: "var(--color-faint)" }}>
                      + {myEvals.length - 10} more evaluations
                    </p>
                  )}
                </div>
              )}
            </section>

            {/* Slots */}
            <section
              className="rounded-xl border p-4 md:p-5"
              style={{ background: "var(--color-card)", borderColor: "var(--color-border)" }}
            >
              <div className="flex items-center justify-between mb-4">
                <h2
                  className="text-[11px] font-extrabold uppercase tracking-widest"
                  style={{ color: "var(--color-primary)", fontFamily: "var(--font-mono)" }}
                >
                  My Slots
                </h2>
                <button
                  onClick={handleQuickSlot}
                  disabled={createSlot.isPending}
                  className="text-[10px] font-bold px-2 py-1 rounded-lg transition-all"
                  style={{
                    background: "var(--color-primary)",
                    color: "#000",
                    opacity: createSlot.isPending ? 0.6 : 1,
                  }}
                >
                  {createSlot.isPending ? "..." : "+1h Now"}
                </button>
              </div>

              {upcomingSlots.length === 0 ? (
                <p className="text-xs py-3" style={{ color: "var(--color-faint)" }}>
                  No upcoming slots. Click "+1h Now" to open a slot.
                </p>
              ) : (
                <div className="space-y-1.5">
                  {upcomingSlots.map((slot) => (
                    <SlotMiniRow key={slot.id} slot={slot} />
                  ))}
                </div>
              )}

              <a
                href="/slots"
                className="inline-block mt-3 text-[10px] font-semibold transition-colors"
                style={{ color: "var(--color-muted)" }}
                onClick={(e) => {
                  e.preventDefault();
                  window.location.href = "/slots";
                }}
              >
                Full calendar →
              </a>
            </section>
          </div>
        </div>
      )}
    </div>
  );
}

/* ── Sub-components ───────────────────────────────────────────────────── */

function CurrentProjectCard({
  pu,
  isSubmitting,
  onSubmit,
}: {
  pu: ProjectUser;
  isSubmitting: boolean;
  onSubmit: () => void;
}) {
  return (
    <div
      className="rounded-lg border p-3"
      style={{ background: "var(--color-card-hi)", borderColor: "var(--color-border)" }}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <StatusBadge status={pu.status} />
            {pu.final_mark != null && (
              <span
                className="text-xs font-black"
                style={{
                  fontFamily: "var(--font-mono)",
                  color: pu["validated?"] ? "var(--color-green)" : "var(--color-red)",
                }}
              >
                {pu.final_mark}%
              </span>
            )}
          </div>
          <div className="text-sm font-semibold text-[#e2e8f0] truncate">{pu.project.name}</div>
          <div className="text-[10px] mt-0.5" style={{ color: "var(--color-faint)", fontFamily: "var(--font-mono)" }}>
            slug: {pu.project.slug} · attempt #{pu.occurrence}
            {pu.current_team_id ? ` · team #${pu.current_team_id}` : ""}
          </div>
        </div>

        <button
          onClick={onSubmit}
          disabled={isSubmitting || pu.status === "finished" || pu.status === "parent"}
          className="shrink-0 text-[10px] font-bold px-2.5 py-1.5 rounded-lg transition-all disabled:opacity-30 disabled:cursor-default hover:brightness-110 active:scale-95"
          style={{
            background: pu.status === "waiting_for_correction"
              ? "var(--color-purple)"
              : "var(--color-primary)",
            color: "#000",
          }}
        >
          {isSubmitting ? "..." : pu.status === "waiting_for_correction" ? "View" : "Submit"}
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
      className="flex items-center justify-between gap-2 px-3 py-2 rounded-lg group transition-colors"
      style={{ background: "var(--color-card-hi)" }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLElement).style.background = "color-mix(in srgb, var(--color-primary) 6%, var(--color-card-hi))";
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLElement).style.background = "var(--color-card-hi)";
      }}
    >
      <div className="flex-1 min-w-0">
        <div className="text-xs font-semibold text-[#e2e8f0] truncate">{project.name}</div>
        <div className="text-[10px]" style={{ color: "var(--color-faint)", fontFamily: "var(--font-mono)" }}>
          {project.slug}
        </div>
      </div>
      <button
        onClick={onStart}
        disabled={isStarting}
        className="shrink-0 text-[10px] font-bold px-2.5 py-1 rounded-lg transition-all disabled:opacity-50 hover:brightness-110 active:scale-95"
        style={{ background: "var(--color-primary)", color: "#000" }}
      >
        {isStarting ? "..." : "Start"}
      </button>
    </div>
  );
}

function EvalMiniCard({ eval: ev }: { eval: ScaleTeam & { _kind: "as_corrected" | "as_corrector" } }) {
  const filled = ev.filled_at != null;
  const mark = ev.final_mark;

  return (
    <div
      className="rounded-lg border p-2.5"
      style={{ background: "var(--color-card-hi)", borderColor: "var(--color-border)" }}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap mb-0.5">
            <span
              className="text-[9px] font-bold uppercase px-1 py-0.5 rounded"
              style={{
                color: filled ? "var(--color-green)" : "var(--color-yellow)",
                background: `color-mix(in srgb, ${filled ? "var(--color-green)" : "var(--color-yellow)"} 12%, transparent)`,
              }}
            >
              {filled ? "Done" : "Pending"}
            </span>
            <span
              className="text-[9px] font-bold uppercase px-1 py-0.5 rounded"
              style={{ color: "var(--color-faint)", background: "var(--color-card)" }}
            >
              {ev._kind === "as_corrected" ? "My eval" : "I evaluate"}
            </span>
          </div>
          <div className="text-xs font-semibold text-[#e2e8f0] truncate">
            {ev.scale?.name ?? `Scale #${ev.scale_id}`}
          </div>
          <div className="text-[10px] mt-0.5" style={{ color: "var(--color-faint)" }}>
            {new Date(ev.begin_at).toLocaleDateString()} · {ev.team?.name ?? `Team #${ev.team?.id}`}
          </div>
        </div>
        <div className="text-right shrink-0">
          {mark != null && (
            <div
              className="text-sm font-black"
              style={{
                fontFamily: "var(--font-mono)",
                color: mark >= 50 ? "var(--color-green)" : "var(--color-red)",
              }}
            >
              {mark}
            </div>
          )}
          <button
            onClick={() => openOfficial("unverified_workflow", "https://profile.42.fr/")}
            className="text-[9px] font-semibold mt-1 transition-colors"
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
      className="flex items-center justify-between gap-2 px-3 py-1.5 rounded-lg"
      style={{ background: "var(--color-card-hi)" }}
    >
      <div className="flex items-center gap-2 min-w-0">
        <span
          className="w-1.5 h-1.5 rounded-full shrink-0"
          style={{ background: scaleName ? "var(--color-purple)" : "var(--color-green)" }}
        />
        <span className="text-xs font-mono truncate" style={{ fontFamily: "var(--font-mono)", color: "#e2e8f0" }}>
          {begin.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}
        </span>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <span className="text-[10px]" style={{ color: "var(--color-faint)", fontFamily: "var(--font-mono)" }}>
          {begin.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}–
          {end.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
        </span>
        {scaleName && (
          <span className="text-[9px] truncate max-w-[80px]" style={{ color: "var(--color-purple)" }}>
            {scaleName}
          </span>
        )}
      </div>
    </div>
  );
}
