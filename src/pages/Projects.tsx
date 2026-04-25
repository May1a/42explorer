import { useAuth } from "../context/AuthContext";
import { useProjectUsers } from "../api/projects";
import type { ProjectUser } from "../types";
import { InsufficientScopeCard } from "../components/errors/InsufficientScopeCard";

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  finished:             { label: "Finished",             color: "var(--color-green)" },
  in_progress:          { label: "In Progress",          color: "var(--color-primary)" },
  searching_a_group:    { label: "Searching Group",      color: "var(--color-yellow)" },
  creating_group:       { label: "Creating Group",       color: "var(--color-yellow)" },
  waiting_for_correction:{ label: "Waiting Correction",  color: "var(--color-purple)" },
  parent:               { label: "Parent Project",       color: "var(--color-muted)" },
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

export function ProjectsPage() {
  const { user } = useAuth();
  const { data, isLoading, error } = useProjectUsers(user?.id);

  const projects = data?.data ?? [];

  return (
    <div className="p-4 md:p-6 max-w-5xl mx-auto space-y-4 md:space-y-6">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <h1 className="text-base md:text-lg font-bold tracking-widest uppercase" style={{ fontFamily: "var(--font-mono)", color: "#e2e8f0" }}>
          &gt; PROJECTS_
        </h1>
        <span className="text-xs" style={{ color: "var(--color-faint)", fontFamily: "var(--font-mono)" }}>
          {projects.length} projects
        </span>
      </div>

      {isLoading && (
        <div className="space-y-2">
          {[1,2,3,4].map(i => <div key={i} className="skeleton h-16 w-full rounded-xl" />)}
        </div>
      )}

      {error && <InsufficientScopeCard error={error} />}

      {!isLoading && !error && projects.length === 0 && (
        <p className="text-xs text-center py-12" style={{ color: "var(--color-faint)" }}>
          No projects found
        </p>
      )}

      <div className="space-y-2">
        {projects.map(pu => (
          <ProjectRow key={pu.id} item={pu} />
        ))}
      </div>
    </div>
  );
}

function ProjectRow({ item: pu }: { item: ProjectUser }) {
  const status = STATUS_LABELS[pu.status] ?? { label: pu.status, color: "var(--color-faint)" };

  return (
    <div
      className="rounded-xl border p-3 md:p-4 flex items-center gap-3 md:gap-4"
      style={{ background: "var(--color-card)", borderColor: "var(--color-border)" }}
    >
      <StatusBadge status={pu.status} />
      <div className="flex-1 min-w-0">
        <div className="text-sm font-semibold text-[#e2e8f0] truncate">
          {pu.project.name}
        </div>
        <div className="text-[10px] mt-0.5" style={{ color: "var(--color-faint)", fontFamily: "var(--font-mono)" }}>
          {pu.project.slug}
        </div>
      </div>
      <div className="flex items-center gap-3 text-right shrink-0">
        {pu.final_mark != null && (
          <div className="text-right">
            <div
              className="text-sm font-black"
              style={{
                fontFamily: "var(--font-mono)",
                color: pu["validated?"] ? "var(--color-green)" : "var(--color-red)",
              }}
            >
              {pu.final_mark}
            </div>
            <div className="text-[10px]" style={{ color: "var(--color-faint)" }}>mark</div>
          </div>
        )}
        <div className="text-right">
          <div className="text-sm font-mono" style={{ color: "var(--color-primary)", fontFamily: "var(--font-mono)" }}>
            #{pu.occurrence}
          </div>
          <div className="text-[10px]" style={{ color: "var(--color-faint)" }}>attempt</div>
        </div>
      </div>
    </div>
  );
}
