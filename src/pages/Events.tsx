import { useMemo } from "react";
import { useCampusEvents } from "../api/campus";
import { useAuth } from "../context/AuthContext";
import type { Event } from "../types";
import { InsufficientScopeCard } from "../components/errors/InsufficientScopeCard";

export function EventsPage() {
  const { user } = useAuth();
  const campusId =
    user?.campus_users?.find(c => c.is_primary)?.campus_id ??
    user?.campus?.[0]?.id;
  const nowIso = useMemo(() => new Date().toISOString(), []);
  const { data, isLoading, error } = useCampusEvents(campusId, {
    "page.size": 100,
    sort: "begin_at",
    "range.begin_at": `${nowIso},`,
  });

  const events = data?.data ?? [];
  const now = new Date();
  const upcoming = events.filter(e =>
    new Date(e.begin_at) > now &&
    Boolean(campusId && e.campus_ids?.includes(campusId))
  );

  return (
    <div className="p-5 md:p-8 max-w-4xl mx-auto animate-fade-in">
      <div className="flex items-baseline justify-between gap-3 flex-wrap mb-1">
        <h1 className="text-[24px] font-semibold tracking-tight" style={{ color: "var(--color-ink)" }}>
          Events
        </h1>
        <span className="text-[12px] num" style={{ color: "var(--color-faint)" }}>
          {upcoming.length} upcoming
        </span>
      </div>
      <p className="text-[13.5px] mb-6" style={{ color: "var(--color-muted)" }}>
        Upcoming campus events and workshops.
      </p>

      {isLoading && (
        <div className="space-y-2">
          {[1,2,3,4].map(i => <div key={i} className="skeleton h-16 w-full" />)}
        </div>
      )}

      {error && <InsufficientScopeCard error={error} />}

      {!isLoading && !error && !campusId && (
        <p className="text-[13px] text-center py-12" style={{ color: "var(--color-faint)" }}>
          No primary campus found
        </p>
      )}

      {!isLoading && !error && campusId && !upcoming.length && (
        <p className="text-[13px] text-center py-12" style={{ color: "var(--color-faint)" }}>
          No upcoming events found for your campus
        </p>
      )}

      {upcoming.length > 0 && (
        <div style={{ borderTop: "1px solid var(--color-border)" }}>
          {upcoming.map(ev => <EventCard key={ev.id} event={ev} />)}
        </div>
      )}
    </div>
  );
}

function EventCard({ event: ev }: { event: Event }) {
  const date = new Date(ev.begin_at);
  const endDate = new Date(ev.end_at);

  return (
    <div
      className="flex items-start gap-3 md:gap-4 px-1 py-3"
      style={{ borderBottom: "1px solid var(--color-rule-soft)" }}
    >
      <div
        className="shrink-0 text-center px-1.5 py-1 rounded min-w-[42px]"
        style={{ background: "var(--color-card-hi)" }}
      >
        <div className="text-[9.5px] font-medium uppercase" style={{ color: "var(--color-faint)" }}>
          {date.toLocaleDateString(undefined, { month: "short" })}
        </div>
        <div className="text-[15px] font-medium leading-none num" style={{ color: "var(--color-ink)" }}>
          {date.getDate()}
        </div>
      </div>

      <div className="flex-1 min-w-0">
        <div className="text-[13.5px] font-medium truncate" style={{ color: "var(--color-ink)" }}>
          {ev.name}
        </div>
        {ev.description && (
          <div className="text-[12.5px] mt-0.5" style={{ color: "var(--color-muted)" }}>
            {ev.description.length > 120 ? ev.description.slice(0, 120) + "…" : ev.description}
          </div>
        )}
        <div className="flex items-center gap-2 mt-1.5 flex-wrap">
          {ev.location && (
            <span className="text-[11.5px]" style={{ color: "var(--color-faint)" }}>{ev.location}</span>
          )}
          <span className="text-[11.5px] data-mono" style={{ color: "var(--color-faint)" }}>
            {date.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" })}
            {" – "}
            {endDate.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" })}
          </span>
          <span className="text-[11.5px] data-mono" style={{ color: "var(--color-primary)" }}>
            {ev.nbr_subscribers} subscribed
          </span>
          {ev.kind && (
            <span className="badge">{ev.kind}</span>
          )}
        </div>
      </div>
    </div>
  );
}
