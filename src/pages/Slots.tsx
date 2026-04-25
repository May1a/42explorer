import { useState, useMemo } from "react";
import { useMySlots, useCreateSlot, useDeleteSlot } from "../api/slots";
import { InsufficientScopeCard } from "../components/errors/InsufficientScopeCard";
import type { Slot } from "../types";

const HOUR_HEIGHT = 44; // px per hour row
const HOURS = Array.from({ length: 24 }, (_, i) => i);

/** Monday = 0 … Sunday = 6 */
function weekStart(d: Date): Date {
  const date = new Date(d);
  const day = (date.getDay() + 6) % 7; // Mon-based
  date.setDate(date.getDate() - day);
  date.setHours(0, 0, 0, 0);
  return date;
}

function addDays(d: Date, n: number): Date {
  const date = new Date(d);
  date.setDate(date.getDate() + n);
  return date;
}

function sameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

function formatISO(date: Date, time: string): string {
  const [h, m] = time.split(":").map(Number);
  const d = new Date(date);
  d.setHours(h, m, 0, 0);
  return d.toISOString();
}

function slotStyle(begin: Date, end: Date): React.CSSProperties {
  const startMin = begin.getHours() * 60 + begin.getMinutes();
  const durationMin = (end.getTime() - begin.getTime()) / 60000;
  const top = (startMin / 60) * HOUR_HEIGHT;
  const height = (durationMin / 60) * HOUR_HEIGHT;
  return { top, height: Math.max(height, 20) };
}

export function SlotsPage() {
  const today = new Date();
  const [week, setWeek] = useState(() => weekStart(today));
  const [showForm, setShowForm] = useState(false);
  const [formDate, setFormDate] = useState(() => {
    const d = new Date();
    d.setMinutes(0, 0, 0);
    d.setHours(d.getHours() + 1);
    return d.toISOString().slice(0, 10);
  });
  const [formStart, setFormStart] = useState("09:00");
  const [formEnd, setFormEnd] = useState("10:00");
  const [formError, setFormError] = useState<string | null>(null);

  const { data, isLoading, error } = useMySlots({ "page.size": 200 });
  const create = useCreateSlot();
  const del = useDeleteSlot();

  const slots = data?.data ?? [];

  const weekEnd = addDays(week, 6);
  const weekLabel = `${week.toLocaleDateString("en-US", { month: "short", day: "numeric" })} – ${weekEnd.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`;

  const days = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => {
      const date = addDays(week, i);
      const daySlots = slots.filter((s) => sameDay(new Date(s.begin_at), date));
      return { date, daySlots };
    });
  }, [week, slots]);

  function prevWeek() {
    setWeek(addDays(week, -7));
    setShowForm(false);
  }
  function nextWeek() {
    setWeek(addDays(week, 7));
    setShowForm(false);
  }
  function goToday() {
    setWeek(weekStart(today));
    setShowForm(false);
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);
    const dateObj = new Date(formDate + "T00:00:00");
    const begin = formatISO(dateObj, formStart);
    const end = formatISO(dateObj, formEnd);
    try {
      await create.mutateAsync({ begin_at: begin, end_at: end });
      setShowForm(false);
    } catch (err: any) {
      setFormError(err instanceof Error ? err.message : "Failed to create slot");
    }
  }

  return (
    <div className="p-4 md:p-6 max-w-6xl mx-auto space-y-4 md:space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <h1 className="text-base md:text-lg font-bold tracking-widest uppercase" style={{ fontFamily: "var(--font-mono)", color: "#e2e8f0" }}>
          &gt; SLOTS_
        </h1>
        <div className="flex items-center gap-2">
          <span className="text-xs" style={{ color: "var(--color-faint)", fontFamily: "var(--font-mono)" }}>
            {slots.length} slots
          </span>
          <button
            onClick={() => setShowForm((s) => !s)}
            className="text-xs font-bold px-3 py-1.5 rounded-lg uppercase tracking-wider transition-all"
            style={{ background: "var(--color-primary)", color: "#000" }}
          >
            {showForm ? "Cancel" : "+ New Slot"}
          </button>
          <button
            onClick={() => window.open("https://profile.intra.42.fr/slots", "_blank")}
            className="text-[10px] font-semibold px-2.5 py-1.5 rounded-lg border transition-all"
            style={{ color: "var(--color-muted)", borderColor: "var(--color-border)" }}
          >
            Open on 42 →
          </button>
        </div>
      </div>

      {/* Create form */}
      {showForm && (
        <form
          onSubmit={handleCreate}
          className="rounded-xl border p-4 space-y-3 animate-fade-in-up"
          style={{ background: "var(--color-card)", borderColor: "var(--color-border)" }}
        >
          <div className="text-xs font-bold uppercase tracking-wider" style={{ color: "var(--color-muted)" }}>
            New Availability Slot
          </div>
          <div className="flex flex-wrap items-end gap-3">
            <label className="flex flex-col gap-1">
              <span className="text-[10px] uppercase font-semibold" style={{ color: "var(--color-faint)" }}>Date</span>
              <input
                type="date"
                value={formDate}
                onChange={(e) => setFormDate(e.target.value)}
                className="bg-transparent border rounded-lg px-2.5 py-1.5 text-xs"
                style={{ borderColor: "var(--color-border)", color: "#e2e8f0" }}
                required
              />
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-[10px] uppercase font-semibold" style={{ color: "var(--color-faint)" }}>Start</span>
              <input
                type="time"
                value={formStart}
                onChange={(e) => setFormStart(e.target.value)}
                className="bg-transparent border rounded-lg px-2.5 py-1.5 text-xs"
                style={{ borderColor: "var(--color-border)", color: "#e2e8f0" }}
                required
              />
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-[10px] uppercase font-semibold" style={{ color: "var(--color-faint)" }}>End</span>
              <input
                type="time"
                value={formEnd}
                onChange={(e) => setFormEnd(e.target.value)}
                className="bg-transparent border rounded-lg px-2.5 py-1.5 text-xs"
                style={{ borderColor: "var(--color-border)", color: "#e2e8f0" }}
                required
              />
            </label>
            <button
              type="submit"
              disabled={create.isPending}
              className="text-xs font-bold px-4 py-1.5 rounded-lg uppercase tracking-wider transition-all disabled:opacity-50"
              style={{ background: "var(--color-green)", color: "#000" }}
            >
              {create.isPending ? "Creating…" : "Create Slot"}
            </button>
          </div>
          {formError && (
            <div className="text-xs" style={{ color: "var(--color-red)" }}>{formError}</div>
          )}
          {create.error && <InsufficientScopeCard error={create.error} />}
        </form>
      )}

      {/* Loading */}
      {isLoading && (
        <div className="space-y-3">
          <div className="skeleton h-8 w-56 rounded-lg" />
          <div className="skeleton h-[500px] w-full rounded-xl" />
        </div>
      )}

      {/* Error */}
      {error && <InsufficientScopeCard error={error} />}

      {/* Content */}
      {!isLoading && !error && (
        <>
          {/* Week navigation */}
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <button
                onClick={prevWeek}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold transition-all hover:bg-card-hi"
                style={{ color: "var(--color-muted)" }}
                aria-label="Previous week"
              >
                ←
              </button>
              <h2 className="text-sm md:text-base font-bold tracking-wide" style={{ fontFamily: "var(--font-mono)", color: "#e2e8f0" }}>
                {weekLabel}
              </h2>
              <button
                onClick={nextWeek}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold transition-all hover:bg-card-hi"
                style={{ color: "var(--color-muted)" }}
                aria-label="Next week"
              >
                →
              </button>
            </div>
            <button
              onClick={goToday}
              className="text-xs font-semibold px-3 py-1.5 rounded-lg border transition-all"
              style={{ color: "var(--color-primary)", borderColor: "var(--color-border)", fontFamily: "var(--font-mono)" }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.background = "var(--color-primary)";
                (e.currentTarget as HTMLElement).style.color = "#000";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.background = "";
                (e.currentTarget as HTMLElement).style.color = "var(--color-primary)";
              }}
            >
              TODAY
            </button>
          </div>

          {/* Calendar grid */}
          <div
            className="rounded-xl border overflow-hidden"
            style={{ background: "var(--color-card)", borderColor: "var(--color-border)" }}
          >
            {/* Day headers */}
            <div className="flex border-b" style={{ borderColor: "var(--color-border)" }}>
              <div className="w-14 shrink-0" />
              {days.map(({ date }) => {
                const isToday = sameDay(date, today);
                return (
                  <div
                    key={date.toISOString()}
                    className="flex-1 py-2.5 text-center border-l"
                    style={{ borderColor: "var(--color-border)" }}
                  >
                    <div
                      className="text-[10px] font-bold uppercase tracking-wider"
                      style={{ color: isToday ? "var(--color-primary)" : "var(--color-faint)" }}
                    >
                      {date.toLocaleDateString("en-US", { weekday: "short" })}
                    </div>
                    <div
                      className={`text-xs font-bold mt-0.5 ${isToday ? "w-6 h-6 rounded-full flex items-center justify-center mx-auto" : ""}`}
                      style={{
                        color: isToday ? "#000" : "var(--color-muted)",
                        background: isToday ? "var(--color-primary)" : "",
                      }}
                    >
                      {date.getDate()}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Scrollable time grid */}
            <div className="overflow-y-auto" style={{ maxHeight: "520px" }}>
              <div className="flex">
                {/* Time labels */}
                <div className="w-14 shrink-0" style={{ height: `${24 * HOUR_HEIGHT}px` }}>
                  {HOURS.map((h) => (
                    <div
                      key={h}
                      className="text-[10px] font-mono text-right pr-2 pt-0.5"
                      style={{ height: `${HOUR_HEIGHT}px`, color: "var(--color-faint)" }}
                    >
                      {h === 0 ? "12 am" : h < 12 ? `${h} am` : h === 12 ? "12 pm" : `${h - 12} pm`}
                    </div>
                  ))}
                </div>

                {/* Day columns */}
                {days.map(({ date, daySlots }) => (
                  <div
                    key={date.toISOString()}
                    className="flex-1 relative border-l"
                    style={{ height: `${24 * HOUR_HEIGHT}px`, borderColor: "var(--color-border)" }}
                  >
                    {/* Hour grid lines */}
                    {HOURS.map((h) => (
                      <div
                        key={h}
                        className="border-b"
                        style={{ height: `${HOUR_HEIGHT}px`, borderColor: "var(--color-border)", opacity: h % 6 === 0 ? 1 : 0.4 }}
                      />
                    ))}

                    {/* Slot blocks */}
                    {daySlots.map((slot) => {
                      const begin = new Date(slot.begin_at);
                      const end = new Date(slot.end_at);
                      const style = slotStyle(begin, end);
                      const scaleName = slot.scale_team?.scale?.name;
                      return (
                        <div
                          key={slot.id}
                          className="absolute left-0.5 right-0.5 rounded-md border px-1.5 py-1 text-[10px] flex flex-col justify-between overflow-hidden"
                          style={{
                            ...style,
                            background: "color-mix(in srgb, var(--color-primary) 15%, var(--color-card))",
                            borderColor: "var(--color-primary)",
                            color: "#e2e8f0",
                          }}
                          title={`${begin.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} – ${end.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}${scaleName ? "\n" + scaleName : ""}`}
                        >
                          <div className="flex items-center justify-between gap-1">
                            <span className="font-semibold truncate" style={{ fontFamily: "var(--font-mono)" }}>
                              {begin.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                              {" – "}
                              {end.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                            </span>
                            <button
                              onClick={() => {
                                if (confirm("Delete this slot?")) del.mutate(slot.id);
                              }}
                              disabled={del.isPending}
                              className="shrink-0 w-4 h-4 rounded flex items-center justify-center text-[10px] font-bold transition-all hover:bg-red-500/20"
                              style={{ color: "var(--color-red)" }}
                              title="Delete slot"
                            >
                              ×
                            </button>
                          </div>
                          <span className="truncate" style={{ color: "var(--color-muted)" }}>
                            {scaleName ?? "Available"}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Empty state */}
          {!isLoading && slots.length === 0 && (
            <p className="text-xs text-center py-8" style={{ color: "var(--color-faint)" }}>
              No slots this week. Click "+ New Slot" to create one.
            </p>
          )}
        </>
      )}
    </div>
  );
}
