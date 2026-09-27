import { useAuth } from "../context/AuthContext";
import { useProjectUsers } from "../api/projects";
import type { ProjectUser } from "../types";
import { InsufficientScopeCard } from "../components/errors/InsufficientScopeCard";

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  finished:             { label: "Finished",             color: "var(--color-green)" },
  in_progress:          { label: "In progress",          color: "var(--color-primary)" },
  searching_a_group:    { label: "Searching group",      color: "var(--color-yellow)" },
  creating_group:       { label: "Creating group",       color: "var(--color-yellow)" },
  waiting_for_correction:{ label: "Waiting correction",  color: "var(--color-purple)" },
  parent:               { label: "Parent project",       color: "var(--color-muted)" },
};

function StatusBadge({ status }: { status: string }) {
  const s = STATUS_LABELS[status] ?? { label: status, color: "var(--color-faint)" };
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

export function ProjectsPage() {
  const { user } = useAuth();
  const { data, isLoading, error } = useProjectUsers(user?.id);

  const projects = data?.data ?? [];

  return (
    <div className="p-5 md:p-8 max-w-4xl mx-auto">
      <div className="flex items-baseline justify-between gap-3 flex-wrap mb-1">
        <h1 className="text-[24px] font-semibold tracking-tight" style={{ color: "var(--color-ink)" }}>
          Projects
        </h1>
        <span className="text-[12px] num" style={{ color: "var(--color-faint)" }}>
          {projects.length} projects
        </span>
      </div>
      <p className="text-[13.5px] mb-6" style={{ color: "var(--color-muted)" }}>
        Your project history and marks.
      </p>

      {isLoading && (
        <div className="space-y-2">
          {[1,2,3,4].map(i => <div key={i} className="skeleton h-14 w-full" />)}
        </div>
      )}

      {error && <InsufficientScopeCard error={error} />}

      {!isLoading && !error && projects.length === 0 && (
        <p className="text-[13px] text-center py-12" style={{ color: "var(--color-faint)" }}>
          No projects found
        </p>
      )}

      <div style={{ borderTop: "1px solid var(--color-border)" }}>
        {projects.map(pu => (
          <ProjectRow key={pu.id} item={pu} />
        ))}
      </div>
    </div>
  );
}

function ProjectRow({ item: pu }: { item: ProjectUser }) {
  return (
    <div
      className="flex items-center gap-3 md:gap-4 px-1 py-3"
      style={{ borderBottom: "1px solid var(--color-rule-soft)" }}
    >
      <StatusBadge status={pu.status} />
      <div className="flex-1 min-w-0">
        <div className="text-[14px] font-medium truncate" style={{ color: "var(--color-ink)" }}>
          {pu.project.name}
        </div>
        <div className="text-[11.5px] mt-0.5 data-mono" style={{ color: "var(--color-faint)" }}>
          {pu.project.slug}
        </div>
      </div>
      <div className="flex items-center gap-4 text-right shrink-0">
        {pu.final_mark != null && (
          <div className="text-right">
            <div
              className="text-[14px] font-medium num"
              style={{
                color: pu["validated?"] ? "var(--color-green)" : "var(--color-red)",
              }}
            >
              {pu.final_mark}
            </div>
            <div className="text-[11px]" style={{ color: "var(--color-faint)" }}>mark</div>
          </div>
        )}
        <div className="text-right">
          <div className="text-[13px] num" style={{ color: "var(--color-primary)" }}>
            #{pu.occurrence}
          </div>
          <div className="text-[11px]" style={{ color: "var(--color-faint)" }}>attempt</div>
        </div>
      </div>
    </div>
  );
}
