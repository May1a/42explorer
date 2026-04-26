import { useState, useMemo, useRef, useEffect } from "react";
import { useMySlots, useCreateSlot, useDeleteSlot } from "../api/slots";
import { InsufficientScopeCard } from "../components/errors/InsufficientScopeCard";

const HOUR_HEIGHT = 48;
const HOURS = Array.from({ length: 24 }, (_, i) => i);

function clampDate(d: Date, ref: Date): Date {
  if (d < ref) {
    const c = new Date(ref);
    c.setHours(0, 0, 0, 0);
    return c;
  }
  return d;
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
  return {
    top: Math.round((startMin / 60) * HOUR_HEIGHT),
    height: Math.max(Math.round((durationMin / 60) * HOUR_HEIGHT), 22),
  };
}

export function SlotsPage() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [activeDate, setActiveDate] = useState(today);
  const [showForm, setShowForm] = useState(false);
  const [formStart, setFormStart] = useState("09:00");
  const [formEnd, setFormEnd] = useState("10:00");
  const [formError, setFormError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const { data, isLoading, error } = useMySlots({ "page.size": 200 });
  const create = useCreateSlot();
  const del = useDeleteSlot();

  const slots = data?.data ?? [];

  // --- Upcoming day strip: today + 29 future days ---
  const upcomingDays = useMemo(() => {
    const days: Date[] = [];
    for (let i = 0; i < 30; i++) {
      const d = new Date(today);
      d.setDate(d.getDate() + i);
      days.push(d);
    }
    return days;
  }, []);

  const stripWindow = useMemo(() => {
    const idx = upcomingDays.findIndex((d) => sameDay(d, activeDate));
    const start = Math.max(0, Math.min(idx - 3, upcomingDays.length - 7));
    return upcomingDays.slice(start, start + 7);
  }, [upcomingDays, activeDate]);

  const activeSlots = useMemo(
    () => slots.filter((s) => sameDay(new Date(s.begin_at), activeDate)),
    [slots, activeDate],
  );

  // --- Auto-scroll to ~current time on today's view ---
  useEffect(() => {
    if (sameDay(activeDate, today) && scrollRef.current) {
      const top = new Date().getHours() * HOUR_HEIGHT - 120;
      scrollRef.current.scrollTop = Math.max(0, top);
    }
  }, [activeDate]);

  // --- Navigation ---
  const isToday = sameDay(activeDate, today);

  function prevDay() {
    const d = new Date(activeDate);
    d.setDate(d.getDate() - 1);
    setActiveDate(clampDate(d, today));
  }

  function nextDay() {
    const d = new Date(activeDate);
    d.setDate(d.getDate() + 1);
    setActiveDate(d);
  }

  // --- Open form via grid click ---
  function handleGridClick(hour: number) {
    const h = Math.min(hour, 22);
    setFormStart(`${String(h).padStart(2, "0")}:00`);
    setFormEnd(`${String(h + 1).padStart(2, "0")}:00`);
    setShowForm(true);
  }

  // --- Form presets ---
  function applyPreset(duration: number) {
    const [sH, sM] = formStart.split(":").map(Number);
    const totalMin = sH * 60 + sM + duration * 60;
    const eH = Math.floor(totalMin / 60) % 24;
    const eM = totalMin % 60;
    if (totalMin > 24 * 60) {
      setFormEnd("23:59");
    } else {
      setFormEnd(`${String(eH).padStart(2, "0")}:${String(eM).padStart(2, "0")}`);
    }
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);
    const begin = formatISO(activeDate, formStart);
    const end = formatISO(activeDate, formEnd);
    try {
      await create.mutateAsync({ begin_at: begin, end_at: end });
      setShowForm(false);
    } catch (err: any) {
      setFormError(err instanceof Error ? err.message : "Failed to create slot");
    }
  }

  // --- Labels ---
  const dateLabel = activeDate.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="p-4 md:p-6 max-w-3xl mx-auto space-y-4">
      {/* === Header === */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3">
          <h1
            className="text-base md:text-lg font-bold tracking-widest uppercase"
            style={{ fontFamily: "var(--font-mono)", color: "#e2e8f0" }}
          >
            &gt; SLOTS_
          </h1>
          <span
            className="text-[10px] font-semibold px-2 py-0.5 rounded-full border"
            style={{
              color: "var(--color-muted)",
              borderColor: "var(--color-border)",
              fontFamily: "var(--font-mono)",
            }}
          >
            {activeSlots.length} {activeSlots.length === 1 ? "slot" : "slots"}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowForm((s) => !s)}
            className="text-xs font-bold px-3.5 py-1.5 rounded-lg uppercase tracking-wider transition-all hover:brightness-110 active:scale-95"
            style={{ background: "var(--color-primary)", color: "#000" }}
          >
            {showForm ? "× Cancel" : "+ New Slot"}
          </button>
          <a
            href="https://profile.intra.42.fr/slots"
            target="_blank"
            rel="noreferrer"
            className="text-[10px] font-semibold px-2.5 py-1.5 rounded-lg border transition-all hover:border-muted"
            style={{ color: "var(--color-muted)", borderColor: "var(--color-border)" }}
          >
            Open on 42 ↗
          </a>
        </div>
      </div>

      {/* === Create form === */}
      {showForm && (
        <div
          className="rounded-xl border p-4 space-y-3 animate-fade-in-up"
          style={{
            background: "var(--color-card)",
            borderColor: "color-mix(in srgb, var(--color-primary) 40%, var(--color-border))",
            boxShadow: "0 0 24px -6px color-mix(in srgb, var(--color-primary) 15%, transparent)",
          }}
        >
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex flex-col gap-0.5">
              <span
                className="text-xs font-bold uppercase tracking-wider"
                style={{ color: "var(--color-muted)" }}
              >
                New Slot
              </span>
              <span
                className="text-[11px]"
                style={{ color: "var(--color-primary)", fontFamily: "var(--font-mono)" }}
              >
                {dateLabel}
              </span>
            </div>
            <div className="flex items-center gap-1">
              {[1, 2, 3, 4].map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => applyPreset(n)}
                  className="text-[10px] font-semibold px-2 py-0.5 rounded border transition-all hover:border-muted active:scale-95"
                  style={{ borderColor: "var(--color-border)", color: "var(--color-faint)" }}
                >
                  {n}h
                </button>
              ))}
            </div>
          </div>

          <form onSubmit={handleCreate}>
            <div className="flex flex-wrap items-end gap-3">
              <label className="flex flex-col gap-1">
                <span
                  className="text-[10px] uppercase font-semibold tracking-wider"
                  style={{ color: "var(--color-faint)" }}
                >
                  Start
                </span>
                <input
                  type="time"
                  value={formStart}
                  onChange={(e) => setFormStart(e.target.value)}
                  className="bg-transparent border rounded-lg px-2.5 py-1.5 text-xs"
                  style={{ borderColor: "var(--color-border)", color: "#e2e8f0", fontFamily: "var(--font-mono)" }}
                  required
                />
              </label>
              <span
                className="pb-1.5 text-xs"
                style={{ color: "var(--color-faint)" }}
              >
                to
              </span>
              <label className="flex flex-col gap-1">
                <span
                  className="text-[10px] uppercase font-semibold tracking-wider"
                  style={{ color: "var(--color-faint)" }}
                >
                  End
                </span>
                <input
                  type="time"
                  value={formEnd}
                  onChange={(e) => setFormEnd(e.target.value)}
                  className="bg-transparent border rounded-lg px-2.5 py-1.5 text-xs"
                  style={{ borderColor: "var(--color-border)", color: "#e2e8f0", fontFamily: "var(--font-mono)" }}
                  required
                />
              </label>
              <button
                type="submit"
                disabled={create.isPending}
                className="text-xs font-bold px-4 py-1.5 rounded-lg uppercase tracking-wider transition-all disabled:opacity-50 hover:brightness-110 active:scale-95"
                style={{ background: "var(--color-green)", color: "#000" }}
              >
                {create.isPending ? "Creating…" : "Create"}
              </button>
            </div>
          </form>
          {formError && (
            <div className="text-xs" style={{ color: "var(--color-red)" }}>
              {formError}
            </div>
          )}
          {create.error && <InsufficientScopeCard error={create.error} />}
        </div>
      )}

      {/* === Loading === */}
      {isLoading && (
        <div className="space-y-3">
          <div className="skeleton h-8 w-56 rounded-lg" />
          <div className="skeleton h-[500px] w-full rounded-xl" />
        </div>
      )}

      {/* === Error === */}
      {error && <InsufficientScopeCard error={error} />}

      {/* === Content === */}
      {!isLoading && !error && (
        <>
          {/* Day navigation */}
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <button
                onClick={prevDay}
                disabled={isToday}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold transition-all disabled:opacity-20 disabled:cursor-default hover:bg-card-hi active:scale-90"
                style={{ color: "var(--color-muted)" }}
                aria-label="Previous day"
              >
                ←
              </button>
              <div className="flex items-baseline gap-2">
                <h2
                  className="text-sm md:text-base font-bold"
                  style={{ fontFamily: "var(--font-mono)", color: "#e2e8f0" }}
                >
                  {dateLabel}
                </h2>
                {isToday && (
                  <span
                    className="text-[10px] font-extrabold uppercase px-1.5 py-0.5 rounded tracking-wider"
                    style={{ background: "var(--color-primary)", color: "#000", fontFamily: "var(--font-mono)" }}
                  >
                    Today
                  </span>
                )}
              </div>
              <button
                onClick={nextDay}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold transition-all hover:bg-card-hi active:scale-90"
                style={{ color: "var(--color-muted)" }}
                aria-label="Next day"
              >
                →
              </button>
            </div>
            <span
              className="hidden sm:inline text-[10px] tracking-wider"
              style={{ color: "var(--color-faint)", fontFamily: "var(--font-mono)" }}
            >
              {activeSlots.length} of {slots.length} total
            </span>
          </div>

          {/* Day strip */}
          <div
            className="flex gap-1 overflow-x-auto pb-1"
            style={{ scrollbarWidth: "thin" }}
          >
            {stripWindow.map((d) => {
              const active = sameDay(d, activeDate);
              const past = d < today;
              return (
                <button
                  key={d.toISOString()}
                  onClick={() => !past && setActiveDate(d)}
                  disabled={past}
                  className="shrink-0 flex flex-col items-center px-3 py-1.5 rounded-lg transition-all disabled:opacity-15 disabled:cursor-default hover:bg-card-hi active:scale-95"
                  style={{
                    background: active ? "var(--color-primary)" : "transparent",
                    border: active
                      ? "1px solid var(--color-primary)"
                      : "1px solid transparent",
                    color: active ? "#000" : "var(--color-muted)",
                    minWidth: "3rem",
                  }}
                >
                  <span className="text-[10px] font-bold uppercase tracking-wider leading-none">
                    {d.toLocaleDateString("en-US", { weekday: "short" })}
                  </span>
                  <span className="text-sm font-extrabold mt-0.5 leading-none">
                    {d.getDate()}
                  </span>
                  {d.getMonth() !== today.getMonth() && (
                    <span className="text-[9px] leading-none mt-px" style={{ opacity: 0.7 }}>
                      {d.toLocaleDateString("en-US", { month: "short" })}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Calendar grid */}
          <div
            className="rounded-xl border overflow-hidden"
            style={{ background: "var(--color-card)", borderColor: "var(--color-border)" }}
          >
            {/* Column header */}
            <div
              className="flex items-center border-b px-4 py-2.5"
              style={{ borderColor: "var(--color-border)" }}
            >
              <span
                className="text-[11px] font-extrabold uppercase tracking-widest"
                style={{ color: "var(--color-primary)", fontFamily: "var(--font-mono)" }}
              >
                {activeDate.toLocaleDateString("en-US", { weekday: "long" })}
              </span>
              <span
                className="ml-auto text-[10px] font-semibold"
                style={{ color: "var(--color-faint)", fontFamily: "var(--font-mono)" }}
              >
                {activeSlots.length} slot{activeSlots.length !== 1 ? "s" : ""}
              </span>
            </div>

            {/* Time grid */}
            <div
              ref={scrollRef}
              className="overflow-y-auto"
              style={{ maxHeight: "520px" }}
            >
              <div className="flex">
                {/* Time labels */}
                <div
                  className="w-12 md:w-14 shrink-0"
                  style={{ height: `${24 * HOUR_HEIGHT}px` }}
                >
                  {HOURS.map((h) => (
                    <div
                      key={h}
                      className="text-[10px] text-right pr-1.5"
                      style={{
                        height: `${HOUR_HEIGHT}px`,
                        color: "var(--color-faint)",
                        fontFamily: "var(--font-mono)",
                        paddingTop: "1px",
                        lineHeight: 1,
                      }}
                    >
                      {h === 0 ? "12AM" : h < 12 ? `${h}AM` : h === 12 ? "12PM" : `${h - 12}PM`}
                    </div>
                  ))}
                </div>

                {/* Day column */}
                <div
                  className="flex-1 relative border-l"
                  style={{
                    height: `${24 * HOUR_HEIGHT}px`,
                    borderColor: "var(--color-border)",
                  }}
                >
                  {/* Hour rows */}
                  {HOURS.map((h) => (
                    <div
                      key={h}
                      className="relative cursor-pointer group"
                      style={{ height: `${HOUR_HEIGHT}px` }}
                      onClick={() => handleGridClick(h)}
                    >
                      <div
                        className="absolute inset-0 border-b"
                        style={{
                          borderColor: "var(--color-border)",
                          opacity: h % 3 === 0 ? 0.5 : 0.25,
                        }}
                      />
                      {/* Hover highlight */}
                      <div
                        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"
                        style={{
                          background:
                            "color-mix(in srgb, var(--color-primary) 6%, transparent)",
                        }}
                      />
                      {/* Half-hour tick */}
                      <div
                        className="absolute left-0 right-0 border-b pointer-events-none"
                        style={{
                          borderColor: "var(--color-border)",
                          top: "50%",
                          opacity: 0.15,
                          borderStyle: "dotted",
                        }}
                      />
                    </div>
                  ))}

                  {/* Current time indicator */}
                  {isToday && (
                    <div
                      className="absolute left-0 right-0 z-10 pointer-events-none flex items-center"
                      style={{
                        top: `${Math.round(
                          ((new Date().getHours() * 60 + new Date().getMinutes()) / 60) *
                            HOUR_HEIGHT,
                        )}px`,
                      }}
                    >
                      <div
                        className="w-2.5 h-2.5 rounded-full -ml-[5px]"
                        style={{
                          background: "var(--color-purple)",
                          boxShadow:
                            "0 0 6px 2px color-mix(in srgb, var(--color-purple) 40%, transparent)",
                        }}
                      />
                      <div
                        className="flex-1"
                        style={{
                          height: "1px",
                          background:
                            "linear-gradient(to right, var(--color-purple), color-mix(in srgb, var(--color-purple) 0%, transparent))",
                        }}
                      />
                    </div>
                  )}

                  {/* Slot blocks */}
                  {activeSlots.map((slot) => {
                    const begin = new Date(slot.begin_at);
                    const end = new Date(slot.end_at);
                    const style = slotStyle(begin, end);
                    const scaleName = slot.scale_team?.scale?.name;
                    return (
                      <div
                        key={slot.id}
                        className="absolute left-1 right-1 rounded-lg border px-2 py-1.5 text-[11px] flex flex-col gap-0.5 overflow-hidden group/slot transition-shadow hover:z-10"
                        style={{
                          ...style,
                          background:
                            "color-mix(in srgb, var(--color-primary) 10%, var(--color-card))",
                          borderColor:
                            "color-mix(in srgb, var(--color-primary) 35%, transparent)",
                          color: "#e2e8f0",
                        }}
                        title={`${begin.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} – ${end.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}${scaleName ? "\n" + scaleName : ""}`}
                      >
                        <div className="flex items-center justify-between gap-1">
                          <span
                            className="font-bold truncate leading-tight"
                            style={{ fontFamily: "var(--font-mono)" }}
                          >
                            {begin.toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                            <span style={{ opacity: 0.5, fontWeight: 400, margin: "0 2px" }}>
                              –
                            </span>
                            {end.toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              if (confirm("Delete this slot?")) del.mutate(slot.id);
                            }}
                            disabled={del.isPending}
                            className="shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold opacity-0 group-hover/slot:opacity-100 transition-all hover:bg-red-500/25"
                            style={{ color: "var(--color-red)" }}
                            title="Delete slot"
                          >
                            ×
                          </button>
                        </div>
                        <span className="truncate text-[10px] leading-tight" style={{ color: "var(--color-muted)" }}>
                          {scaleName ?? "Available"}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* Empty state (when there are some slots overall but none on this day) */}
          {activeSlots.length === 0 && slots.length > 0 && (
            <div className="text-center py-8 space-y-2">
              <p
                className="text-xs"
                style={{ color: "var(--color-faint)", fontFamily: "var(--font-mono)" }}
              >
                Nothing scheduled for {dateLabel.toLowerCase()}.
              </p>
              <button
                onClick={() => setShowForm(true)}
                className="text-xs font-bold px-3 py-1.5 rounded-lg uppercase tracking-wider transition-all hover:brightness-110 active:scale-95"
                style={{ background: "var(--color-primary)", color: "#000" }}
              >
                + Create one
              </button>
            </div>
          )}

          {/* Empty state (no slots at all) */}
          {slots.length === 0 && (
            <div className="text-center py-10 space-y-3">
              <div
                className="text-4xl"
                style={{ fontFamily: "var(--font-mono)" }}
              >
                ◈
              </div>
              <p
                className="text-xs"
                style={{ color: "var(--color-faint)", fontFamily: "var(--font-mono)" }}
              >
                No availability slots yet.
              </p>
              <button
                onClick={() => setShowForm(true)}
                className="text-xs font-bold px-3.5 py-1.5 rounded-lg uppercase tracking-wider transition-all hover:brightness-110 active:scale-95"
                style={{ background: "var(--color-primary)", color: "#000" }}
              >
                + New Slot
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
