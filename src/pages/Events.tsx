import { useEvents } from "../api/events";
import type { Event } from "../types";

export function EventsPage() {
  const { data, isLoading, error } = useEvents({ "page.size": 100, sort: "begin_at" });

  const events = data?.data ?? [];

  const upcoming = events.filter(e => new Date(e.begin_at) > new Date());
  const past = events.filter(e => new Date(e.begin_at) <= new Date());

  return (
    <div className="p-4 md:p-6 max-w-5xl mx-auto space-y-4 md:space-y-6">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <h1 className="text-base md:text-lg font-bold tracking-widest uppercase" style={{ fontFamily: "var(--font-mono)", color: "#e2e8f0" }}>
          &gt; EVENTS_
        </h1>
        <span className="text-xs" style={{ color: "var(--color-faint)", fontFamily: "var(--font-mono)" }}>
          {upcoming.length} upcoming · {past.length} past
        </span>
      </div>

      {isLoading && (
        <div className="space-y-2">
          {[1,2,3,4].map(i => <div key={i} className="skeleton h-20 w-full rounded-xl" />)}
        </div>
      )}

      {error && (
        <div
          className="rounded-xl border p-4"
          style={{ background: "var(--color-card)", borderColor: "var(--color-red)" }}
        >
          <div className="text-sm font-bold" style={{ color: "var(--color-red)" }}>Error</div>
          <div className="text-xs mt-1" style={{ color: "var(--color-muted)" }}>{(error as Error).message}</div>
        </div>
      )}

      {!isLoading && !error && !upcoming.length && !past.length && (
        <p className="text-xs text-center py-12" style={{ color: "var(--color-faint)" }}>
          No events found
        </p>
      )}

      {upcoming.length > 0 && (
        <>
          <h2 className="text-xs font-bold uppercase tracking-wider pt-2" style={{ color: "var(--color-muted)" }}>
            Upcoming
          </h2>
          <div className="space-y-2">
            {upcoming.map(ev => <EventCard key={ev.id} event={ev} />)}
          </div>
        </>
      )}

      {past.length > 0 && (
        <>
          <h2 className="text-xs font-bold uppercase tracking-wider pt-2" style={{ color: "var(--color-faint)" }}>
            Past
          </h2>
          <div className="space-y-2 opacity-60">
            {past.slice(0, 20).map(ev => <EventCard key={ev.id} event={ev} />)}
          </div>
        </>
      )}
    </div>
  );
}

function EventCard({ event: ev }: { event: Event }) {
  const date = new Date(ev.begin_at);
  const endDate = new Date(ev.end_at);
  const isUpcoming = date > new Date();

  return (
    <div
      className="rounded-xl border p-3 md:p-4 flex items-start gap-3 md:gap-4"
      style={{ background: "var(--color-card)", borderColor: "var(--color-border)" }}
    >
      <div
        className="shrink-0 text-center p-2 rounded-lg min-w-[44px]"
        style={{ background: `color-mix(in srgb, ${isUpcoming ? "var(--color-primary)" : "var(--color-faint)"} 12%, transparent)` }}
      >
        <div
          className="text-[10px] font-bold uppercase"
          style={{ color: isUpcoming ? "var(--color-primary)" : "var(--color-faint)" }}
        >
          {date.toLocaleDateString(undefined, { month: "short" })}
        </div>
        <div
          className="text-lg font-black leading-none"
          style={{ color: isUpcoming ? "var(--color-primary)" : "var(--color-faint)" }}
        >
          {date.getDate()}
        </div>
      </div>

      <div className="flex-1 min-w-0">
        <div className="text-sm font-semibold text-[#e2e8f0]">{ev.name}</div>
        <div className="text-xs mt-0.5" style={{ color: "var(--color-muted)" }}>
          {ev.description?.length > 120 ? ev.description.slice(0, 120) + "…" : ev.description}
        </div>
        <div className="flex items-center gap-2 mt-1.5 flex-wrap">
          {ev.location && (
            <span className="text-[10px]" style={{ color: "var(--color-faint)" }}>{ev.location}</span>
          )}
          <span className="text-[10px]" style={{ color: "var(--color-faint)" }}>
            {date.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" })}
            {" – "}
            {endDate.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" })}
          </span>
          <span className="text-[10px] font-semibold" style={{ color: "var(--color-primary)" }}>
            {ev.nbr_subscribers} subscribed
          </span>
          {ev.kind && (
            <span className="text-[10px] px-1 py-0.5 rounded" style={{ background: "var(--color-card-hi)", color: "var(--color-faint)" }}>
              {ev.kind}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
