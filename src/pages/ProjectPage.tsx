import { useState } from "react";
import { useParams, useNavigate } from "@tanstack/react-router";
import { useAuth } from "../context/AuthContext";
import { useProject, useProjectUsers, useSubmitProject } from "../api/projects";
import { useMyScaleTeams } from "../api/scale-teams";
import { InsufficientScopeCard, ScopePrompt } from "../components/errors/InsufficientScopeCard";
import { openOfficial } from "../lib/redirects";
import type { ProjectUser } from "../types";

/* ── Helpers ─────────────────────────────────────────────────────────────── */

function timeAgo(dateStr: string | null): string {
  if (!dateStr) return "";
  const diff = Date.now() - new Date(dateStr).getTime();
  const hours = Math.floor(diff / 3600000);
  if (hours < 1) return "just now";
  if (hours < 24) return `${hours} hour${hours > 1 ? "s" : ""} ago`;
  const days = Math.floor(hours / 24);
  return `${days} day${days > 1 ? "s" : ""} ago`;
}

function teamName(userLogin: string, projectName: string, occurrence: number, isExam: boolean): string {
  if (isExam) return `${userLogin}'s ${projectName}`;
  return `${userLogin}'s group${occurrence > 1 ? `-${occurrence}` : ""}`;
}

function statusColor(status: string): string {
  switch (status) {
    case "finished": return "var(--color-green)";
    case "in_progress": return "var(--color-primary)";
    case "waiting_for_correction": return "var(--color-purple)";
    case "searching_a_group":
    case "creating_group": return "var(--color-yellow)";
    default: return "var(--color-faint)";
  }
}

function statusLabel(status: string): string {
  switch (status) {
    case "finished": return "Finished";
    case "in_progress": return "In Progress";
    case "waiting_for_correction": return "Waiting Correction";
    case "searching_a_group": return "Searching Group";
    case "creating_group": return "Creating Group";
    default: return status;
  }
}

/* ── Score Badge ─────────────────────────────────────────────────────────── */

function ScoreBadge({ pu }: { pu: ProjectUser }) {
  const validated = pu["validated?"] === true;
  const failed = pu["validated?"] === false;
  const mark = pu.final_mark ?? 0;

  let bg = "var(--color-card-hi)";
  let border = "var(--color-border)";
  let label = "In Progress";
  let labelColor = "var(--color-faint)";

  if (validated) {
    bg = "color-mix(in srgb, var(--color-green) 8%, var(--color-card))";
    border = "color-mix(in srgb, var(--color-green) 25%, transparent)";
    label = "success";
    labelColor = "var(--color-green)";
  } else if (failed) {
    bg = "color-mix(in srgb, var(--color-red) 8%, var(--color-card))";
    border = "color-mix(in srgb, var(--color-red) 25%, transparent)";
    label = "fail";
    labelColor = "var(--color-red)";
  }

  return (
    <div
      className="flex flex-col items-center justify-center gap-3 p-6 rounded-lg border animate-fade-in-up stagger-1"
      style={{ background: bg, borderColor: border }}
    >
      <div className="flex items-center gap-1.5">
        {validated && <span className="text-lg">✓</span>}
        {failed && <span className="text-lg">×</span>}
        <span className="text-xs font-semibold uppercase tracking-widest" style={{ color: labelColor }}>
          {label}
        </span>
      </div>
      <div className="flex items-baseline gap-1">
        <span
          className="text-5xl font-black tracking-tighter"
          style={{
            fontFamily: "var(--font-mono)",
            color: validated ? "var(--color-green)" : failed ? "var(--color-red)" : "var(--color-muted)",
          }}
        >
          {mark}
        </span>
        <span className="text-sm font-medium" style={{ color: "var(--color-faint)" }}>
          /100
        </span>
      </div>
    </div>
  );
}

/* ── Team Card ───────────────────────────────────────────────────────────── */

function TeamCard({
  pu,
  userLogin,
  projectName,
  isExam,
  isCurrent,
  isSubmitting,
  onSubmit,
}: {
  pu: ProjectUser;
  userLogin: string;
  projectName: string;
  isExam: boolean;
  isCurrent: boolean;
  isSubmitting: boolean;
  onSubmit: () => void;
}) {
  const name = teamName(userLogin, projectName, pu.occurrence, isExam);
  const locked = pu.status === "waiting_for_correction" || pu.status === "finished";

  return (
    <div
      className={`rounded-lg border p-5 animate-fade-in-up ${isCurrent ? "section-card glow-primary" : "section-card"}`}
      style={{
        borderColor: isCurrent ? "color-mix(in srgb, var(--color-primary) 20%, var(--color-border))" : "var(--color-border)",
      }}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-4 mb-4">
        <div>
          <h3 className="text-base font-bold" style={{ fontFamily: "var(--font-display)", color: "var(--color-primary)" }}>
            {name}
          </h3>
          <p className="text-xs mt-1" style={{ color: "var(--color-faint)" }}>
            {locked
              ? `This team was locked ${timeAgo(pu.updated_at)}`
              : `Status: ${statusLabel(pu.status)}`}
          </p>
        </div>

        {/* Status dots */}
        <div className="flex items-center gap-1.5 shrink-0">
          <span
            className="w-2 h-2 rounded-full"
            style={{ background: isCurrent ? "var(--color-green)" : "var(--color-faint)" }}
          />
          <span
            className="w-2 h-2 rounded-full"
            style={{ background: pu.occurrence > 1 ? (isCurrent ? "var(--color-faint)" : "var(--color-green)") : "var(--color-faint)" }}
          />
          <span className="w-2 h-2 rounded-full" style={{ background: "var(--color-faint)" }} />
        </div>
      </div>

      {/* Meta row */}
      <div className="flex items-center gap-3 mb-4 flex-wrap">
        <span
          className="badge"
          style={{
            background: `color-mix(in srgb, ${statusColor(pu.status)} 10%, transparent)`,
            color: statusColor(pu.status),
          }}
        >
          {statusLabel(pu.status)}
        </span>
        {pu.final_mark != null && (
          <span className="data-mono text-xs" style={{ color: pu["validated?"] ? "var(--color-green)" : "var(--color-red)" }}>
            {pu.final_mark}%
          </span>
        )}
      </div>

      {/* Evaluations mini */}
      {isCurrent && (
        <div className="mb-4 p-3 rounded-md" style={{ background: "var(--color-card-hi)" }}>
          <div className="flex items-center gap-2 mb-2">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" style={{ color: "var(--color-faint)" }}>
              <path d="M9 11l3 3L22 4" />
              <path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11" />
            </svg>
            <span className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: "var(--color-faint)" }}>
              Evaluations
            </span>
          </div>
          <p className="text-xs" style={{ color: "var(--color-muted)" }}>
            Evaluations will appear here once scheduled.
          </p>
        </div>
      )}

      {/* Actions */}
      {isCurrent && (
        <button
          onClick={onSubmit}
          disabled={isSubmitting || pu.status === "finished" || pu.status === "parent"}
          className="w-full py-2.5 text-sm font-bold rounded-md transition-all disabled:opacity-30 disabled:cursor-default hover:brightness-110 active:scale-[0.98]"
          style={{
            background: pu.status === "waiting_for_correction" ? "var(--color-purple)" : "var(--color-green)",
            color: "#000",
          }}
        >
          {isSubmitting ? "..." : pu.status === "waiting_for_correction" ? "Waiting for evaluation" : "Set the project as finished"}
        </button>
      )}
    </div>
  );
}

/* ── Old Team Row ────────────────────────────────────────────────────────── */

function OldTeamRow({
  pu,
  userLogin,
  projectName,
  isExam,
}: {
  pu: ProjectUser;
  userLogin: string;
  projectName: string;
  isExam: boolean;
}) {
  const name = teamName(userLogin, projectName, pu.occurrence, isExam);
  const mark = pu.final_mark ?? 0;

  return (
    <div
      className="flex items-center justify-between gap-3 px-4 py-3 rounded-md transition-colors cursor-default"
      style={{ background: "var(--color-card-hi)" }}
    >
      <span className="text-sm font-medium" style={{ color: "var(--color-primary)" }}>
        {name}
      </span>
      <span
        className="data-mono text-sm font-bold"
        style={{ color: pu["validated?"] ? "var(--color-green)" : mark > 0 ? "var(--color-yellow)" : "var(--color-red)" }}
      >
        {mark}%
      </span>
    </div>
  );
}

/* ── Main Page ───────────────────────────────────────────────────────────── */

export function ProjectPage() {
  const { id } = useParams({ from: "/project/$id" });
  const projectId = Number(id);
  const navigate = useNavigate();
  const { user, login, currentScope, hasScope } = useAuth();

  const { data: projectData, isLoading: projectLoading, error: projectError } = useProject(projectId);
  const { data: attemptsData, isLoading: attemptsLoading, error: attemptsError } = useProjectUsers(user?.id, {
    "filter[project_id]": projectId,
    "page.size": 50,
    sort: "-occurrence",
  });
  const { data: correctedData, error: correctedError } = useMyScaleTeams("as_corrected", undefined, { enabled: hasScope("projects") });
  const { data: correctorData, error: correctorError } = useMyScaleTeams("as_corrector", undefined, { enabled: hasScope("projects") });

  const submitProject = useSubmitProject();

  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  const project = projectData?.data;
  const attempts = (attemptsData?.data ?? []).sort((a, b) => b.occurrence - a.occurrence);
  const currentAttempt = attempts.find(
    (a) => a.status !== "finished" && a.status !== "parent"
  ) ?? attempts[0];
  const oldAttempts = attempts.filter((a) => a.id !== currentAttempt?.id);

  const retries = Math.max(0, attempts.length - 1);

  const projectEvals = [
    ...(correctedData?.data ?? []),
    ...(correctorData?.data ?? []),
  ].filter((e) => e.team?.project_id === projectId);

  function flash(msg: string) {
    setActionSuccess(msg);
    setTimeout(() => setActionSuccess(null), 3000);
  }

  function handleSubmit(pu: ProjectUser) {
    setActionError(null);
    submitProject.mutate(
      { projectUserId: pu.id },
      {
        onSuccess: () => flash(`Submitted ${project?.name ?? "project"}`),
        onError: (err) => {
          if (err.isInsufficientScope) {
            setActionError(
              `Submitting requires the projects scope. Your current scope is "${currentScope}".`,
            );
          } else {
            setActionError(err.message);
          }
        },
      },
    );
  }

  const isLoading = projectLoading || attemptsLoading;

  if (isLoading) {
    return (
      <div className="p-6 md:p-10 max-w-5xl mx-auto space-y-4">
        <div className="skeleton h-8 w-64" />
        <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-6">
          <div className="space-y-4">
            <div className="skeleton h-40 w-full" />
            <div className="skeleton h-24 w-full" />
          </div>
          <div className="space-y-4">
            <div className="skeleton h-56 w-full" />
            <div className="skeleton h-32 w-full" />
          </div>
        </div>
      </div>
    );
  }

  if (projectError) {
    return (
      <div className="p-6 md:p-10 max-w-5xl mx-auto space-y-4">
        <div className="flex items-center justify-center min-h-[60vh]">
          <InsufficientScopeCard error={projectError} />
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <p className="text-sm" style={{ color: "var(--color-faint)" }}>Project not found</p>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto animate-fade-in">
      {/* Header */}
      <div className="mb-8 animate-fade-in-up stagger-1">
        <button
          onClick={() => navigate({ to: "/" })}
          className="text-xs font-medium mb-3 transition-colors hover:text-[#e2e8f0]"
          style={{ color: "var(--color-faint)", fontFamily: "var(--font-mono)" }}
        >
          ← back
        </button>
        <h1
          className="text-2xl md:text-3xl font-bold tracking-tight"
          style={{ fontFamily: "var(--font-display)" }}
        >
          {user?.login ? `${user.login}'s ` : ""}
          <span style={{ color: "var(--color-primary)" }}>{project.name}</span>
          {retries > 0 && (
            <span className="text-lg font-medium ml-2" style={{ color: "var(--color-muted)" }}>
              ({retries} {retries === 1 ? "retry" : "retries"})
            </span>
          )}
        </h1>
      </div>

      {/* Notifications */}
      {actionSuccess && (
        <div
          className="flex items-center justify-between gap-3 rounded-md border px-4 py-2.5 text-xs mb-6 animate-fade-in-up"
          style={{
            background: "color-mix(in srgb, var(--color-green) 8%, var(--color-card))",
            borderColor: "color-mix(in srgb, var(--color-green) 25%, transparent)",
            color: "var(--color-green)",
          }}
        >
          <span>✓ {actionSuccess}</span>
          <button onClick={() => setActionSuccess(null)} className="opacity-60 hover:opacity-100 font-bold">×</button>
        </div>
      )}
      {actionError && (
        <div
          className="flex items-start justify-between gap-3 rounded-md border px-4 py-2.5 text-xs mb-6 animate-fade-in-up"
          style={{
            background: "color-mix(in srgb, var(--color-red) 8%, var(--color-card))",
            borderColor: "color-mix(in srgb, var(--color-red) 25%, transparent)",
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

      <div className="grid grid-cols-1 lg:grid-cols-[240px_1fr] gap-6 md:gap-8">
        {/* ── Left sidebar ── */}
        <div className="space-y-5">
          {/* Score */}
          {currentAttempt && <ScoreBadge pu={currentAttempt} />}

          {/* Meta */}
          <div className="section-card p-5 animate-fade-in-up stagger-2">
            <div className="space-y-3">
              <MetaRow label="Type" value={project.exam ? "Solo" : "Group"} />
              <MetaRow label="Slug" value={project.slug} mono />
              <MetaRow label="Attempts" value={String(attempts.length)} />
              {currentAttempt && (
                <MetaRow
                  label="Status"
                  value={statusLabel(currentAttempt.status)}
                  color={statusColor(currentAttempt.status)}
                />
              )}
            </div>

            <div className="h-px my-4" style={{ background: "var(--color-border)" }} />

            <button
              onClick={() => openOfficial("unverified_workflow", `https://projects.intra.42.fr/projects/${project.slug}`)}
              className="flex items-center gap-2 text-xs font-medium transition-colors group"
              style={{ color: "var(--color-primary)" }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
                <polyline points="14 2 14 8 20 8" />
              </svg>
              <span className="group-hover:underline">View on 42 intra ↗</span>
            </button>
          </div>
        </div>

        {/* ── Main content ── */}
        <div className="space-y-5">
          {/* Current team */}
          {attemptsError ? (
            <InsufficientScopeCard error={attemptsError} />
          ) : currentAttempt ? (
            <TeamCard
              pu={currentAttempt}
              userLogin={user?.login ?? "user"}
              projectName={project.name}
              isExam={project.exam}
              isCurrent={true}
              isSubmitting={submitProject.isPending}
              onSubmit={() => handleSubmit(currentAttempt)}
            />
          ) : null}

          {/* Evaluations */}
          {correctedError && !correctorError ? (
            <InsufficientScopeCard error={correctedError} />
          ) : correctorError && !correctedError ? (
            <InsufficientScopeCard error={correctorError} />
          ) : correctedError && correctorError ? (
            <InsufficientScopeCard error={correctedError} />
          ) : projectEvals.length > 0 ? (
            <div className="section-card p-5 animate-fade-in-up stagger-3">
              <h2
                className="text-[11px] font-semibold uppercase tracking-widest mb-4 accent-line"
                style={{ color: "var(--color-faint)", fontFamily: "var(--font-mono)" }}
              >
                Evaluations
              </h2>
              <div className="space-y-2">
                {projectEvals.map((ev) => (
                  <div
                    key={ev.id}
                    className="flex items-center justify-between gap-3 px-3 py-2 rounded-md"
                    style={{ background: "var(--color-card-hi)" }}
                  >
                    <div className="min-w-0">
                      <div className="text-xs font-medium text-[#e2e8f0] truncate">
                        {ev.scale?.name ?? `Scale #${ev.scale_id}`}
                      </div>
                      <div className="text-[10px] mt-0.5" style={{ color: "var(--color-faint)" }}>
                        {new Date(ev.begin_at).toLocaleDateString()} · {ev.team?.name ?? "Team"}
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      {ev.final_mark != null && (
                        <span
                          className="data-mono text-sm font-bold"
                          style={{ color: ev.final_mark >= 50 ? "var(--color-green)" : "var(--color-red)" }}
                        >
                          {ev.final_mark}
                        </span>
                      )}
                      <div
                        className="text-[9px] mt-0.5"
                        style={{ color: ev.filled_at ? "var(--color-green)" : "var(--color-yellow)" }}
                      >
                        {ev.filled_at ? "Done" : "Pending"}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : null}

          {!hasScope("projects") && !correctedError && !correctorError && projectEvals.length === 0 && (
            <div className="section-card p-5 animate-fade-in-up stagger-3">
              <h2
                className="text-[11px] font-semibold uppercase tracking-widest mb-4 accent-line"
                style={{ color: "var(--color-faint)", fontFamily: "var(--font-mono)" }}
              >
                Evaluations
              </h2>
              <ScopePrompt
                title="Projects Scope Needed"
                message="Evaluations require the projects scope."
              />
            </div>
          )}

          {/* Old teams */}
          {oldAttempts.length > 0 && (
            <div className="animate-fade-in-up stagger-4">
              <h2
                className="text-[11px] font-semibold uppercase tracking-widest mb-3 text-center"
                style={{ color: "var(--color-faint)", fontFamily: "var(--font-mono)" }}
              >
                Old Teams
              </h2>
              <div className="space-y-1.5">
                {oldAttempts.map((pu) => (
                  <OldTeamRow
                    key={pu.id}
                    pu={pu}
                    userLogin={user?.login ?? "user"}
                    projectName={project.name}
                    isExam={project.exam}
                  />
                ))}
              </div>
            </div>
          )}

          {/* No attempts yet */}
          {!attemptsError && attempts.length === 0 && (
            <div
              className="section-card p-8 text-center animate-fade-in-up stagger-3"
            >
              <p className="text-sm mb-4" style={{ color: "var(--color-muted)" }}>
                You haven&apos;t started this project yet.
              </p>
              <button
                onClick={() => navigate({ to: "/" })}
                className="btn-primary text-xs"
              >
                Go to My 42 to start
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ── Meta Row ────────────────────────────────────────────────────────────── */

function MetaRow({
  label,
  value,
  mono,
  color,
}: {
  label: string;
  value: string;
  mono?: boolean;
  color?: string;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: "var(--color-faint)" }}>
        {label}
      </span>
      <span
        className={`text-xs font-medium ${mono ? "data-mono" : ""}`}
        style={{ color: color ?? "#e2e8f0" }}
      >
        {value}
      </span>
    </div>
  );
}
