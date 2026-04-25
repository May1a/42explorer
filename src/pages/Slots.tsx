import { useState, useMemo } from "react";
import { useMySlots } from "../api/slots";
import { InsufficientScopeCard } from "../components/errors/InsufficientScopeCard";
import type { Slot } from "../types";

const DAY_HEADERS = ["M", "T", "W", "T", "F", "S", "S"] as const;

function openSlot(slotId: number) {
  window.open(`https://profile.intra.42.fr/slots/${slotId}`, "_blank");
}

function dateKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function sameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

export function SlotsPage() {
  const { data, isLoading, error } = useMySlots({ "page.size": 100 });

  const today = new Date();
  const [currentMonth, setCurrentMonth] = useState(() => new Date(today.getFullYear(), today.getMonth(), 1));
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const slots = (data?.data ?? []) as Slot[];

  const slotsByDate = useMemo(() => {
    const map = new Map<string, Slot[]>();
    for (const slot of slots) {
      const key = dateKey(new Date(slot.begin_at));
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(slot);
    }
    return map;
  }, [slots]);

  const selectedSlots = selectedDate ? (slotsByDate.get(selectedDate) ?? []) : [];

  // ── Calendar grid math ──
  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const daysInMonth = lastDay.getDate();
  // Monday = 0, Sunday = 6
  const startOffset = (firstDay.getDay() + 6) % 7;

  const monthLabel = firstDay.toLocaleDateString("en-US", { month: "long", year: "numeric" });

  function prevMonth() {
    setCurrentMonth(new Date(year, month - 1, 1));
    setSelectedDate(null);
  }
  function nextMonth() {
    setCurrentMonth(new Date(year, month + 1, 1));
    setSelectedDate(null);
  }
  function goToday() {
    setCurrentMonth(new Date(today.getFullYear(), today.getMonth(), 1));
    setSelectedDate(null);
  }

  // Build 42-cell grid
  const cells: Array<{ date: Date | null; key: string; isOutside: boolean }> = [];
  // Previous month fill
  for (let i = startOffset - 1; i >= 0; i--) {
    const d = new Date(year, month, -i);
    cells.push({ date: d, key: dateKey(d), isOutside: true });
  }
  // Current month
  for (let day = 1; day <= daysInMonth; day++) {
    const d = new Date(year, month, day);
    cells.push({ date: d, key: dateKey(d), isOutside: false });
  }
  // Next month fill to complete 42 cells
  const remaining = 42 - cells.length;
  for (let day = 1; day <= remaining; day++) {
    const d = new Date(year, month + 1, day);
    cells.push({ date: d, key: dateKey(d), isOutside: true });
  }

  // ── Render ──
  return (
    <div className="p-4 md:p-6 max-w-5xl mx-auto space-y-4 md:space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <h1
          className="text-base md:text-lg font-bold tracking-widest uppercase"
          style={{ fontFamily: "var(--font-mono)", color: "#e2e8f0" }}
        >
          &gt; SLOTS_
        </h1>
        <span
          className="text-xs"
          style={{ color: "var(--color-faint)", fontFamily: "var(--font-mono)" }}
        >
          {slots.length} slots
        </span>
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="space-y-3">
          <div className="skeleton h-10 w-48 rounded-lg" />
          <div className="skeleton h-[420px] w-full rounded-xl" />
        </div>
      )}

      {/* Error */}
      {error && <InsufficientScopeCard error={error} />}

      {/* Content */}
      {!isLoading && !error && (
        <>
          {/* Month navigation */}
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <button
                onClick={prevMonth}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold transition-all hover:bg-card-hi"
                style={{ color: "var(--color-muted)" }}
                aria-label="Previous month"
              >
                ←
              </button>
              <h2
                className="text-sm md:text-base font-bold tracking-wide capitalize"
                style={{ fontFamily: "var(--font-mono)", color: "#e2e8f0" }}
              >
                {monthLabel}
              </h2>
              <button
                onClick={nextMonth}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold transition-all hover:bg-card-hi"
                style={{ color: "var(--color-muted)" }}
                aria-label="Next month"
              >
                →
              </button>
            </div>
            <button
              onClick={goToday}
              className="text-xs font-semibold px-3 py-1.5 rounded-lg border transition-all"
              style={{
                color: "var(--color-primary)",
                borderColor: "var(--color-border)",
                fontFamily: "var(--font-mono)",
              }}
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
            <div
              className="grid grid-cols-7 border-b"
              style={{ borderColor: "var(--color-border)" }}
            >
              {DAY_HEADERS.map((h) => (
                <div
                  key={h}
                  className="py-2.5 text-center text-[10px] font-bold tracking-wider uppercase"
                  style={{ color: "var(--color-faint)" }}
                >
                  {h}
                </div>
              ))}
            </div>

            {/* Day cells */}
            <div className="grid grid-cols-7">
              {cells.map((cell, idx) => {
                const key = cell.key;
                const hasSlots = slotsByDate.has(key);
                const count = slotsByDate.get(key)?.length ?? 0;
                const isToday = cell.date ? sameDay(cell.date, today) : false;
                const isSelected = selectedDate === key;
                const isOutside = cell.isOutside || !cell.date;
                const dayNum = cell.date?.getDate();

                return (
                  <button
                    key={`${year}-${month}-${idx}`}
                    onClick={() => {
                      if (cell.date && !isOutside) {
                        setSelectedDate(isSelected ? null : key);
                      }
                    }}
                    className={`
                      relative flex flex-col items-center pt-1.5 pb-2 md:pt-2 md:pb-2.5 cursor-pointer
                      transition-all border-r border-b
                      min-h-[52px] md:min-h-[64px]
                      ${(idx + 1) % 7 === 0 ? "border-r-0" : ""}
                      ${idx >= 35 ? "border-b-0" : ""}
                    `}
                    style={{
                      borderColor: "var(--color-border)",
                      background: isSelected
                        ? "var(--color-card-hi)"
                        : isToday
                          ? "color-mix(in srgb, var(--color-primary) 6%, transparent)"
                          : "",
                    }}
                    onMouseEnter={(e) => {
                      if (!isSelected) {
                        (e.currentTarget as HTMLElement).style.background = "var(--color-card-hi)";
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isSelected) {
                        (e.currentTarget as HTMLElement).style.background = isToday
                          ? "color-mix(in srgb, var(--color-primary) 6%, transparent)"
                          : "";
                      }
                    }}
                  >
                    {/* Day number */}
                    <span
                      className={`
                        text-xs font-bold w-6 h-6 md:w-7 md:h-7 rounded-full flex items-center justify-center
                        ${isToday ? "text-[#000]" : ""}
                      `}
                      style={{
                        color: isOutside ? "var(--color-border-hi)" : isToday ? "" : "var(--color-muted)",
                        background: isToday ? "var(--color-primary)" : "",
                      }}
                    >
                      {dayNum}
                    </span>

                    {/* Slot dots */}
                    {hasSlots && !isOutside && (
                      <div className="flex items-center gap-0.5 mt-0.5">
                        {count <= 3 ? (
                          Array.from({ length: count }).map((_, i) => (
                            <span
                              key={i}
                              className="block w-1 h-1 rounded-full"
                              style={{ background: "var(--color-primary)" }}
                            />
                          ))
                        ) : (
                          <>
                            <span className="block w-1 h-1 rounded-full" style={{ background: "var(--color-primary)" }} />
                            <span className="block w-1 h-1 rounded-full" style={{ background: "var(--color-primary)" }} />
                            <span className="block w-1 h-1 rounded-full" style={{ background: "var(--color-purple)" }} />
                          </>
                        )}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Selected day detail */}
          {selectedDate && (
            <div
              className="rounded-xl border p-4 md:p-5 space-y-3 animate-fade-in-up"
              style={{ background: "var(--color-card)", borderColor: "var(--color-border)" }}
            >
              <div className="flex items-center justify-between gap-2">
                <h3
                  className="text-xs font-bold tracking-wider uppercase"
                  style={{ fontFamily: "var(--font-mono)", color: "var(--color-primary)" }}
                >
                  {new Date(selectedDate + "T00:00:00").toLocaleDateString("en-US", {
                    weekday: "long",
                    month: "long",
                    day: "numeric",
                  })}
                </h3>
                <span
                  className="text-[10px] font-mono"
                  style={{ color: "var(--color-faint)", fontFamily: "var(--font-mono)" }}
                >
                  {selectedSlots.length} slot{selectedSlots.length !== 1 ? "s" : ""}
                </span>
              </div>

              {selectedSlots.length === 0 && (
                <p className="text-xs" style={{ color: "var(--color-faint)" }}>
                  No slots for this day.
                </p>
              )}

              <div className="space-y-1.5">
                {selectedSlots.map((slot, i) => (
                  <SlotCard key={slot.id} slot={slot} index={i} onOpen={() => openSlot(slot.id)} />
                ))}
              </div>
            </div>
          )}

          {/* Empty state */}
          {!isLoading && slots.length === 0 && (
            <p className="text-xs text-center py-12" style={{ color: "var(--color-faint)" }}>
              No slots found
            </p>
          )}
        </>
      )}
    </div>
  );
}

function SlotCard({ slot, index, onOpen }: { slot: Slot; index: number; onOpen: () => void }) {
  const begin = new Date(slot.begin_at);
  const end = new Date(slot.end_at);
  const now = new Date();
  const isPast = end < now;
  const isLive = begin <= now && end >= now;
  const scaleName = slot.scale_team?.scale?.name;

  return (
    <div
      className={`
        rounded-lg border px-3 py-2.5 flex items-center justify-between gap-3 flex-wrap
        animate-fade-in-up
      `}
      style={{
        background: "var(--color-card-hi)",
        borderColor: "var(--color-border)",
        animationDelay: `${index * 0.05}s`,
      }}
    >
      <div className="flex items-center gap-3 min-w-0">
        {/* Status dot */}
        <div
          className="w-2 h-2 rounded-full shrink-0"
          style={{
            background: isLive ? "var(--color-green)" : isPast ? "var(--color-faint)" : "var(--color-primary)",
          }}
        />

        <div className="min-w-0">
          <div className="text-xs font-semibold truncate" style={{ color: "#e2e8f0" }}>
            {scaleName ?? `Slot #${slot.id}`}
          </div>
          <div className="flex items-center gap-2 mt-0.5 flex-wrap">
            <span
              className="text-[10px] font-mono"
              style={{ color: "var(--color-muted)", fontFamily: "var(--font-mono)" }}
            >
              {begin.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
              {" — "}
              {end.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
            </span>
            {slot.user?.login && (
              <span className="text-[10px]" style={{ color: "var(--color-faint)" }}>
                {slot.user.login}
              </span>
            )}
          </div>
        </div>
      </div>

      <button
        onClick={onOpen}
        className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1.5 rounded-lg border transition-all shrink-0"
        style={{
          color: "var(--color-primary)",
          borderColor: "var(--color-border)",
        }}
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLElement).style.background = "var(--color-primary)";
          (e.currentTarget as HTMLElement).style.color = "#000";
          (e.currentTarget as HTMLElement).style.borderColor = "var(--color-primary)";
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLElement).style.background = "";
          (e.currentTarget as HTMLElement).style.color = "var(--color-primary)";
          (e.currentTarget as HTMLElement).style.borderColor = "var(--color-border)";
        }}
      >
        OPEN
      </button>
    </div>
  );
}
