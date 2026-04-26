import { useState, useMemo, useRef, useEffect } from "react";
import { useMySlots, useCreateSlot, useDeleteSlot, useUpdateSlot } from "../api/slots";
import { useAuth } from "../context/AuthContext";
import { InsufficientScopeCard, ScopePrompt } from "../components/errors/InsufficientScopeCard";
import type { Slot, MergedSlot } from "../types";

const HOUR_HEIGHT = 64;
const HOURS = Array.from({ length: 24 }, (_, i) => i);
const MIN_SLOT_LEAD_MINUTES = 30;
const SNAP_MINUTES = 15;

// 42 API returns slots as consecutive 15-min chunks — merge them into one block
function mergeSlots(slots: Slot[]): MergedSlot[] {
  if (slots.length === 0) return [];
  const sorted = [...slots].sort(
    (a, b) => new Date(a.begin_at).getTime() - new Date(b.begin_at).getTime(),
  );
  const merged: MergedSlot[] = [
    { ...sorted[0]!, slotIds: [sorted[0]!.id] },
  ];
  for (let i = 1; i < sorted.length; i++) {
    const last = merged[merged.length - 1]!;
    const lastEnd = new Date(last.end_at).getTime();
    const next = sorted[i]!;
    const nextStart = new Date(next.begin_at).getTime();
    if (nextStart <= lastEnd + 60_000) {
      const nextEnd = new Date(next.end_at).getTime();
      if (nextEnd > lastEnd) last.end_at = next.end_at;
      last.slotIds.push(next.id);
    } else {
      merged.push({ ...next, slotIds: [next.id] });
    }
  }
  return merged;
}

function sameDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function clampDate(d: Date, ref: Date): Date {
  if (d < ref) {
    const c = new Date(ref);
    c.setHours(0, 0, 0, 0);
    return c;
  }
  return d;
}

function minToISO(date: Date, totalMin: number): string {
  const d = new Date(date);
  d.setHours(Math.floor(totalMin / 60), totalMin % 60, 0, 0);
  return d.toISOString();
}

function dateAtMin(date: Date, totalMin: number): Date {
  const d = new Date(date);
  d.setHours(Math.floor(totalMin / 60), totalMin % 60, 0, 0);
  return d;
}

function minOpenMinForDate(date: Date, now: Date): number {
  if (!sameDay(date, now)) return 0;
  const nowMin = now.getHours() * 60 + now.getMinutes();
  return Math.min(
    24 * 60,
    Math.ceil((nowMin + MIN_SLOT_LEAD_MINUTES) / SNAP_MINUTES) * SNAP_MINUTES,
  );
}

function formatMinLabel(totalMin: number): string {
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  const suffix = h < 12 ? "AM" : "PM";
  const h12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
  return `${h12}:${String(m).padStart(2, "0")} ${suffix}`;
}

function slotStyle(begin: Date, end: Date): React.CSSProperties {
  const startMin = begin.getHours() * 60 + begin.getMinutes();
  const durationMin = (end.getTime() - begin.getTime()) / 60_000;
  return {
    top: Math.round((startMin / 60) * HOUR_HEIGHT),
    height: Math.max(Math.round((durationMin / 60) * HOUR_HEIGHT), 20),
  };
}

type DragState = { startMin: number; endMin: number };

export function SlotsPage() {
  const today = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);
  const [now, setNow] = useState(() => new Date());

  const { hasScope } = useAuth();

  const [activeDate, setActiveDate] = useState(today);
  const [dragDisplay, setDragDisplay] = useState<DragState | null>(null);
  const [createError, setCreateError] = useState<string | null>(null);
  const [createMode, setCreateMode] = useState(false);

  const [resizeGhost, setResizeGhost] = useState<{ top: number; height: number } | null>(null);
  const resizeGhostRef = useRef<{ top: number; height: number } | null>(null);
  const isResizing = useRef(false);
  const resizeRef = useRef<{ slot: MergedSlot; edge: "top" | "bottom" } | null>(null);

  function setResizeGhostBoth(g: { top: number; height: number } | null) {
    resizeGhostRef.current = g;
    setResizeGhost(g);
  }

  const nowIndicatorRef = useRef<HTMLDivElement>(null);
  const dayColumnRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);
  const dragStateRef = useRef<DragState | null>(null);
  const activeDateRef = useRef(activeDate);
  activeDateRef.current = activeDate;
  const nowRef = useRef(now);
  nowRef.current = now;

  const { data, isLoading, error } = useMySlots({ "page.size": 200 }, { enabled: hasScope("projects") });
  const create = useCreateSlot();
  const createRef = useRef(create);
  createRef.current = create;
  const del = useDeleteSlot();
  const update = useUpdateSlot();
  const updateRef = useRef(update);
  updateRef.current = update;

  const allSlots = data?.data ?? [];
  const minOpenMin = useMemo(() => minOpenMinForDate(activeDate, now), [activeDate, now]);
  const minOpenMinRef = useRef(minOpenMin);
  minOpenMinRef.current = minOpenMin;
  const invalidAreaHeight = Math.min(Math.round((minOpenMin / 60) * HOUR_HEIGHT), 24 * HOUR_HEIGHT);

  const upcomingDays = useMemo(() => {
    const days: Date[] = [];
    for (let i = 0; i < 30; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() + i);
      days.push(d);
    }
    return days;
  }, [today]);

  const stripWindow = useMemo(() => {
    const idx = upcomingDays.findIndex((d) => sameDay(d, activeDate));
    const start = Math.max(0, Math.min(idx - 3, upcomingDays.length - 7));
    return upcomingDays.slice(start, start + 7);
  }, [upcomingDays, activeDate]);

  const rawActiveSlots = useMemo(
    () => allSlots.filter((s) => sameDay(new Date(s.begin_at), activeDate)),
    [allSlots, activeDate],
  );
  const activeSlots = useMemo(() => mergeSlots(rawActiveSlots), [rawActiveSlots]);

  // Auto-scroll to current time
  useEffect(() => {
    if (sameDay(activeDate, today) && nowIndicatorRef.current) {
      nowIndicatorRef.current.scrollIntoView({ block: "center", behavior: "smooth" });
    }
  }, [activeDate]);

  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), 30_000);
    return () => window.clearInterval(id);
  }, []);

  // Cancel drag on day change
  useEffect(() => {
    isDragging.current = false;
    dragStateRef.current = null;
    setDragDisplay(null);
  }, [activeDate]);

  // Convert clientY to snapped minute value
  function yToSnappedMin(clientY: number): number {
    if (!dayColumnRef.current) return 0;
    const rect = dayColumnRef.current.getBoundingClientRect();
    const relY = Math.max(0, clientY - rect.top);
    const totalMin = (relY / HOUR_HEIGHT) * 60;
    return Math.min(Math.round(totalMin / SNAP_MINUTES) * SNAP_MINUTES, 23 * 60 + 45);
  }

  function rangeStartsSoon(startMin: number): boolean {
    return sameDay(activeDateRef.current, nowRef.current) && startMin < minOpenMinRef.current;
  }

  function validRangeForActiveDate(startMin: number, endMin: number): boolean {
    return startMin >= minOpenMinRef.current && endMin > startMin;
  }

  function showTooSoonError() {
    setCreateError("Slots must start at least 30 minutes from now.");
  }

  function handleResizeStart(e: React.MouseEvent, slot: MergedSlot, edge: "top" | "bottom") {
    e.preventDefault();
    e.stopPropagation();
    resizeRef.current = { slot, edge };
    isResizing.current = true;
    const begin = new Date(slot.begin_at);
    const end = new Date(slot.end_at);
    const top = Math.round((begin.getHours() * 60 + begin.getMinutes()) / 60 * HOUR_HEIGHT);
    const height = Math.round((end.getTime() - begin.getTime()) / 60_000 / 60 * HOUR_HEIGHT);
    setResizeGhostBoth({ top, height: Math.max(height, 20) });
  }

  function handleResizeTouchStart(e: React.TouchEvent, slot: MergedSlot, edge: "top" | "bottom") {
    e.preventDefault();
    e.stopPropagation();
    resizeRef.current = { slot, edge };
    isResizing.current = true;
    const begin = new Date(slot.begin_at);
    const end = new Date(slot.end_at);
    const top = Math.round((begin.getHours() * 60 + begin.getMinutes()) / 60 * HOUR_HEIGHT);
    const height = Math.round((end.getTime() - begin.getTime()) / 60_000 / 60 * HOUR_HEIGHT);
    setResizeGhostBoth({ top, height: Math.max(height, 20) });
  }

  function handleDayMouseDown(e: React.MouseEvent) {
    if (e.button !== 0) return;
    if ((e.target as Element).closest("[data-slot]")) return;
    e.preventDefault();
    const startMin = yToSnappedMin(e.clientY);
    if (rangeStartsSoon(startMin)) {
      showTooSoonError();
      return;
    }
    const initial: DragState = { startMin, endMin: startMin + 15 };
    dragStateRef.current = initial;
    setDragDisplay(initial);
    isDragging.current = true;
  }

  function handleDayTouchStart(e: React.TouchEvent) {
    if ((e.target as Element).closest("[data-slot]")) return;
    if (!createMode) return;
    e.preventDefault();
    const startMin = yToSnappedMin(e.touches[0]!.clientY);
    if (rangeStartsSoon(startMin)) {
      showTooSoonError();
      return;
    }
    const initial: DragState = { startMin, endMin: startMin + 15 };
    dragStateRef.current = initial;
    setDragDisplay(initial);
    isDragging.current = true;
  }

  // Global mouse handlers for drag & resize
  useEffect(() => {
    function handleMove(clientY: number) {
      const curMin = yToSnappedMin(clientY);

      if (isResizing.current && resizeRef.current) {
        const { slot, edge } = resizeRef.current;
        const begin = new Date(slot.begin_at);
        const end = new Date(slot.end_at);
        const beginMin = begin.getHours() * 60 + begin.getMinutes();
        const endMin = end.getHours() * 60 + end.getMinutes();
        const minOpenMin = minOpenMinForDate(begin, nowRef.current);
        let top: number, height: number;

        if (edge === "top") {
          const newBeginMin = Math.min(Math.max(curMin, minOpenMin), endMin - 15);
          top = Math.round((newBeginMin / 60) * HOUR_HEIGHT);
          const bottom = Math.round((endMin / 60) * HOUR_HEIGHT);
          height = Math.max(bottom - top, 20);
        } else {
          const newEndMin = Math.max(Math.min(curMin, 23 * 60 + 45), beginMin + 15);
          top = Math.round((beginMin / 60) * HOUR_HEIGHT);
          const bottom = Math.round((newEndMin / 60) * HOUR_HEIGHT);
          height = Math.max(bottom - top, 20);
        }
        setResizeGhostBoth({ top, height });
        return;
      }

      if (!isDragging.current || !dragStateRef.current) return;
      const next: DragState = {
        startMin: dragStateRef.current.startMin,
        endMin: Math.min(Math.max(curMin, dragStateRef.current.startMin + 15), 24 * 60),
      };
      dragStateRef.current = next;
      setDragDisplay(next);
    }

    function onMouseMove(e: MouseEvent) {
      handleMove(e.clientY);
    }

    function onTouchMove(e: TouchEvent) {
      if (!isDragging.current && !isResizing.current) return;
      e.preventDefault();
      handleMove(e.touches[0]!.clientY);
    }

    function onUp() {
      if (isResizing.current) {
        isResizing.current = false;
        const r = resizeRef.current;
        const ghost = resizeGhostRef.current;
        resizeRef.current = null;
        setResizeGhostBoth(null);

        if (r && ghost) {
          const { slot, edge } = r;
          const begin = new Date(slot.begin_at);
          const end = new Date(slot.end_at);
          let newBegin: Date, newEnd: Date;

          if (edge === "top") {
            const newBeginMin = Math.round((ghost.top / HOUR_HEIGHT) * 60);
            newBegin = dateAtMin(begin, newBeginMin);
            newEnd = new Date(end);
          } else {
            const newEndPx = ghost.top + ghost.height;
            const newEndMin = Math.round((newEndPx / HOUR_HEIGHT) * 60);
            newBegin = new Date(begin);
            newEnd = dateAtMin(end, newEndMin);
          }

          const newBeginMin = newBegin.getHours() * 60 + newBegin.getMinutes();
          const newEndMin = newEnd.getHours() * 60 + newEnd.getMinutes();
          const minOpenMin = minOpenMinForDate(newBegin, nowRef.current);
          if (newBeginMin < minOpenMin || newEndMin <= newBeginMin) {
            showTooSoonError();
          } else {
            updateRef.current.mutate({
              slotIds: slot.slotIds,
              begin_at: newBegin.toISOString(),
              end_at: newEnd.toISOString(),
            });
          }
        }
        return;
      }

      if (!isDragging.current) return;
      isDragging.current = false;
      const drag = dragStateRef.current;
      dragStateRef.current = null;
      setDragDisplay(null);
      if (drag) {
        if (!validRangeForActiveDate(drag.startMin, drag.endMin)) {
          showTooSoonError();
          return;
        }
        setCreateError(null);
        createRef.current.mutate(
          {
            begin_at: minToISO(activeDateRef.current, drag.startMin),
            end_at: minToISO(activeDateRef.current, drag.endMin),
          },
          {
            onError: (err: any) =>
              setCreateError(err instanceof Error ? err.message : "Failed to create slot"),
          },
        );
      }
    }

    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onUp);
    window.addEventListener("touchmove", onTouchMove, { passive: false });
    window.addEventListener("touchend", onUp);
    window.addEventListener("touchcancel", onUp);
    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onUp);
      window.removeEventListener("touchmove", onTouchMove);
      window.removeEventListener("touchend", onUp);
      window.removeEventListener("touchcancel", onUp);
    };
  }, []);

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

  const dateLabel = activeDate.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  const ghostStyle = dragDisplay
    ? {
        top: Math.round((dragDisplay.startMin / 60) * HOUR_HEIGHT),
        height: Math.round(((dragDisplay.endMin - dragDisplay.startMin) / 60) * HOUR_HEIGHT),
      }
    : null;

  return (
    <div className="p-4 md:p-6 max-w-3xl mx-auto flex flex-col gap-4">
      {/* Header */}
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

      {/* Create error */}
      {createError && (
        <div
          className="flex items-center justify-between gap-3 rounded-lg border px-3 py-2 text-xs"
          style={{
            background: "color-mix(in srgb, var(--color-red) 10%, var(--color-card))",
            borderColor: "color-mix(in srgb, var(--color-red) 40%, transparent)",
            color: "var(--color-red)",
          }}
        >
          <span>{createError}</span>
          <button
            onClick={() => setCreateError(null)}
            className="opacity-60 hover:opacity-100 font-bold"
          >
            ×
          </button>
        </div>
      )}
      {create.error && !createError && <InsufficientScopeCard error={create.error} />}

      {/* Loading */}
      {isLoading && (
        <div className="space-y-3">
          <div className="skeleton h-8 w-56 rounded-lg" />
          <div className="skeleton h-96 w-full rounded-xl" />
        </div>
      )}

      {/* Error */}
      {error && <InsufficientScopeCard error={error} />}

      {/* Scope missing */}
      {!isLoading && !error && !hasScope("projects") && (
        <ScopePrompt
          title="Projects Scope Needed"
          message="Slots require the projects scope."
        />
      )}

      {/* Content */}
      {!isLoading && !error && hasScope("projects") && (
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
                    style={{
                      background: "var(--color-primary)",
                      color: "#000",
                      fontFamily: "var(--font-mono)",
                    }}
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
              drag to create · drag edges to resize · click × to delete
            </span>
            <button
              className="sm:hidden text-[10px] font-bold px-3 py-1.5 rounded-lg border transition-all active:scale-95"
              onClick={() => setCreateMode((m) => !m)}
              style={{
                background: createMode ? "var(--color-primary)" : "transparent",
                borderColor: createMode ? "var(--color-primary)" : "var(--color-border)",
                color: createMode ? "#000" : "var(--color-muted)",
                fontFamily: "var(--font-mono)",
              }}
            >
              {createMode ? "✓ CREATING" : "+ CREATE"}
            </button>
          </div>

          {/* Day strip */}
          <div className="flex gap-1 overflow-x-auto pb-1" style={{ scrollbarWidth: "thin" }}>
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

            {/* Scrollable time grid */}
            <div style={{ overflowY: "auto", maxHeight: "calc(100dvh - 19rem)", WebkitOverflowScrolling: "touch" }}>
            <div className="flex" style={{ userSelect: "none" }}>
              {/* Time labels */}
              <div
                className="w-12 md:w-14 shrink-0"
                style={{ height: `${24 * HOUR_HEIGHT}px` }}
              >
                {HOURS.map((h) => (
                  <div
                    key={h}
                    className="text-[10px] text-right pr-2"
                    style={{
                      height: `${HOUR_HEIGHT}px`,
                      color: "var(--color-faint)",
                      fontFamily: "var(--font-mono)",
                      paddingTop: "2px",
                      lineHeight: 1,
                    }}
                  >
                    {h === 0 ? "12AM" : h < 12 ? `${h}AM` : h === 12 ? "12PM" : `${h - 12}PM`}
                  </div>
                ))}
              </div>

              {/* Day column */}
              <div
                ref={dayColumnRef}
                className="flex-1 relative border-l"
                  style={{
                    height: `${24 * HOUR_HEIGHT}px`,
                    borderColor: createMode
                      ? "var(--color-primary)"
                      : "var(--color-border)",
                    cursor: dragDisplay ? "ns-resize" : "crosshair",
                    touchAction: createMode ? "none" : "pan-y",
                  }}
                onMouseDown={handleDayMouseDown}
                onTouchStart={handleDayTouchStart}
              >
                {/* Hour rows */}
                {HOURS.map((h) => (
                  <div key={h} className="relative" style={{ height: `${HOUR_HEIGHT}px` }}>
                    <div
                      className="absolute inset-0 border-b"
                      style={{
                        borderColor: "var(--color-border)",
                        opacity: h % 3 === 0 ? 0.5 : 0.25,
                      }}
                    />
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

                {/* Disabled lead-time area */}
                {invalidAreaHeight > 0 && (
                  <div
                    className="absolute left-0 right-0 top-0 z-[1] border-b"
                    style={{
                      height: invalidAreaHeight,
                      background:
                        "repeating-linear-gradient(-45deg, color-mix(in srgb, var(--color-faint) 18%, transparent), color-mix(in srgb, var(--color-faint) 18%, transparent) 8px, color-mix(in srgb, var(--color-faint) 10%, transparent) 8px, color-mix(in srgb, var(--color-faint) 10%, transparent) 16px)",
                      borderColor: "color-mix(in srgb, var(--color-faint) 35%, transparent)",
                      touchAction: "pan-y",
                    }}
                    onMouseDown={(e) => e.stopPropagation()}
                    onTouchStart={(e) => e.stopPropagation()}
                    title="Slots must start at least 30 minutes from now"
                  />
                )}

                {/* Current time indicator */}
                {isToday && (
                  <div
                    ref={nowIndicatorRef}
                    className="absolute left-0 right-0 z-10 pointer-events-none flex items-center"
                    style={{
                      top: `${Math.round(
                        ((new Date().getHours() * 60 + new Date().getMinutes()) / 60) * HOUR_HEIGHT,
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

                {/* Drag ghost preview */}
                {ghostStyle && dragDisplay && (
                  <div
                    className="absolute left-1 right-1 rounded-lg border pointer-events-none z-20 flex flex-col justify-center px-2.5"
                    style={{
                      ...ghostStyle,
                      background: "color-mix(in srgb, var(--color-primary) 18%, transparent)",
                      borderColor: "var(--color-primary)",
                      borderStyle: "dashed",
                    }}
                  >
                    <span
                      className="text-[11px] font-bold leading-tight"
                      style={{ fontFamily: "var(--font-mono)", color: "var(--color-primary)" }}
                    >
                      {formatMinLabel(dragDisplay.startMin)} – {formatMinLabel(dragDisplay.endMin)}
                    </span>
                  </div>
                )}

                {/* Pending creation indicator */}
                {create.isPending && (
                  <div className="absolute inset-x-0 top-0 h-0.5 z-30 overflow-hidden">
                    <div
                      className="h-full animate-pulse"
                      style={{ background: "var(--color-primary)", opacity: 0.7 }}
                    />
                  </div>
                )}

                {/* Resize ghost preview */}
                {resizeGhost && (
                  <div
                    className="absolute left-1 right-1 rounded-lg border pointer-events-none z-20"
                    style={{
                      top: resizeGhost.top,
                      height: Math.max(resizeGhost.height, 4),
                      background: "color-mix(in srgb, var(--color-primary) 18%, transparent)",
                      borderColor: "var(--color-primary)",
                      borderStyle: "dashed",
                    }}
                  />
                )}

                {/* Slot blocks */}
                {activeSlots.map((slot) => {
                  const begin = new Date(slot.begin_at);
                  const end = new Date(slot.end_at);
                  const style = slotStyle(begin, end);
                  const scaleName = slot.scale_team?.scale?.name;
                  const isResizingThis = resizeGhost !== null && resizeRef.current?.slot === slot;

                  return (
                    <div
                      key={slot.id}
                      data-slot="true"
                      className="absolute left-1 right-1 rounded-lg border px-2 py-1.5 text-[11px] flex flex-col gap-0.5 overflow-hidden group/slot transition-shadow hover:z-10"
                      style={{
                        ...(isResizingThis ? { top: resizeGhost!.top, height: Math.max(resizeGhost!.height, 20) } : style),
                        background:
                          "color-mix(in srgb, var(--color-primary) 10%, var(--color-card))",
                        borderColor:
                          "color-mix(in srgb, var(--color-primary) 35%, transparent)",
                        color: "#e2e8f0",
                        opacity: isResizingThis ? 0.7 : 1,
                      }}
                      title={`${begin.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} – ${end.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}${scaleName ? "\n" + scaleName : ""}`}
                    >
                      {/* Resize handle — top */}
                      <div
                        data-resize-handle="true"
                        className="absolute left-0 right-0 top-0 h-2 cursor-ns-resize group/resize"
                        style={{ zIndex: 5, touchAction: "none" }}
                        onMouseDown={(e) => handleResizeStart(e, slot, "top")}
                        onTouchStart={(e) => handleResizeTouchStart(e, slot, "top")}
                      />

                      <div className="flex items-center justify-between gap-1" style={{ zIndex: 1 }}>
                        <span
                          className="font-bold truncate leading-tight"
                          style={{ fontFamily: "var(--font-mono)" }}
                        >
                          {begin.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                          <span style={{ opacity: 0.5, fontWeight: 400, margin: "0 2px" }}>–</span>
                          {end.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            if (confirm("Delete this slot?")) del.mutate(slot.slotIds);
                          }}
                          disabled={del.isPending}
                          className="shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold opacity-0 group-hover/slot:opacity-100 transition-all hover:bg-red-500/25"
                          style={{ color: "var(--color-red)" }}
                          title="Delete slot"
                        >
                          ×
                        </button>
                      </div>
                      <span
                        className="truncate text-[10px] leading-tight"
                        style={{ color: "var(--color-muted)", zIndex: 1 }}
                      >
                        {scaleName ?? "Available"}
                      </span>

                      {/* Resize handle — bottom */}
                      <div
                        data-resize-handle="true"
                        className="absolute left-0 right-0 bottom-0 h-2 cursor-ns-resize"
                        style={{ zIndex: 5, touchAction: "none" }}
                        onMouseDown={(e) => handleResizeStart(e, slot, "bottom")}
                        onTouchStart={(e) => handleResizeTouchStart(e, slot, "bottom")}
                      />
                    </div>
                  );
                })}
              </div>
            </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
