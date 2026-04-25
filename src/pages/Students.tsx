import { useState, useEffect, useMemo } from "react";
import { use42Query } from "../hooks/use42API";
import { StudentCard } from "../components/StudentCard";
import { Pagination } from "../components/Pagination";
import { SkeletonCard } from "../components/Loading";
import type { FortyTwoUser, Campus, Cursus } from "../types";

const PAGE_SIZE = 20;

const SORT_OPTIONS = [
  { value: "-level",      label: "Level (High → Low)" },
  { value: "level",       label: "Level (Low → High)" },
  { value: "login",       label: "Login A → Z" },
  { value: "-login",      label: "Login Z → A" },
  { value: "-created_at", label: "Newest first" },
  { value: "created_at",  label: "Oldest first" },
];

function useDebounce<T>(value: T, ms: number): T {
  const [deb, setDeb] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setDeb(value), ms);
    return () => clearTimeout(id);
  }, [value, ms]);
  return deb;
}

export function StudentsPage({ onNavigate }: { onNavigate: (page: any, extra?: string) => void }) {
  // ── Filter state ──────────────────────────────────────────────────────────
  const [search,    setSearch]    = useState("");
  const [campusId,  setCampusId]  = useState("");
  const [cursusId,  setCursusId]  = useState("21");
  const [levelMin,  setLevelMin]  = useState(0);
  const [levelMax,  setLevelMax]  = useState(21);
  const [onlineOnly, setOnlineOnly] = useState(false);
  const [sort,      setSort]      = useState("-level");
  const [page,      setPage]      = useState(1);

  const debouncedSearch = useDebounce(search, 400);

  // Every handler resets page — no useEffect needed
  function handleSearch(v: string)      { setSearch(v);    setPage(1); }
  function handleCampus(v: string)      { setCampusId(v);  setPage(1); }
  function handleCursus(v: string)      { setCursusId(v);  setPage(1); }
  function handleSort(v: string)        { setSort(v);      setPage(1); }
  function handleOnline(v: boolean)     { setOnlineOnly(v); setPage(1); }
  function handleLevelMin(v: number)    { setLevelMin(v);  setPage(1); }
  function handleLevelMax(v: number)    { setLevelMax(v);  setPage(1); }

  function clearFilters() {
    setSearch(""); setCampusId(""); setCursusId("21");
    setLevelMin(0); setLevelMax(21); setOnlineOnly(false);
    setSort("-level"); setPage(1);
  }

  // ── Query params — derived, stable object ─────────────────────────────────
  const params = useMemo(() => ({
    "page.number": page,
    "page.size":   PAGE_SIZE,
    sort,
    ...(campusId            && { "filter.campus_id":  campusId }),
    ...(cursusId            && { "filter.cursus_id":  cursusId }),
    ...(onlineOnly          && { "filter.location":   "active" }),
    ...(debouncedSearch     && { "filter.login":      debouncedSearch }),
    ...((levelMin > 0 || levelMax < 21) && {
      "range.cursus_users.level": `${levelMin},${levelMax}`,
    }),
  }), [page, sort, campusId, cursusId, onlineOnly, debouncedSearch, levelMin, levelMax]);

  // ── Data — one query, no manual effects ───────────────────────────────────
  const { data: campusRes }  = use42Query<Campus[]>("/campus",  { "page.size": 100, sort: "name" });
  const { data: cursusRes }  = use42Query<Cursus[]>("/cursus",  { "page.size": 100, sort: "name" });
  const { data: studentsRes, isLoading, error } = use42Query<FortyTwoUser[]>("/users", params);

  const students = studentsRes?.data ?? [];
  const total    = studentsRes?.total ?? 0;
  const campuses = campusRes?.data ?? [];
  const cursuses = cursusRes?.data ?? [];

  const hasFilters = Boolean(search || campusId || cursusId !== "21" || levelMin > 0 || levelMax < 21 || onlineOnly);

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-bold tracking-widest uppercase" style={{ fontFamily: "var(--font-mono)", color: "#e2e8f0" }}>
          &gt; STUDENTS_BROWSER
        </h1>
        {total > 0 && (
          <span className="text-xs" style={{ color: "var(--color-faint)", fontFamily: "var(--font-mono)" }}>
            {total.toLocaleString()} students
          </span>
        )}
      </div>

      {/* Filter panel */}
      <div className="rounded-2xl border p-5 space-y-4" style={{ background: "var(--color-card)", borderColor: "var(--color-border)" }}>
        {/* Search */}
        <div className="flex gap-3">
          <input
            type="text"
            value={search}
            onChange={e => handleSearch(e.target.value)}
            placeholder="◈  Search by login or display name..."
            className="flex-1"
            style={{ fontFamily: "var(--font-mono)", fontSize: 13 }}
          />
          {hasFilters && (
            <button
              onClick={clearFilters}
              className="px-4 py-2 rounded-lg text-xs font-semibold border transition-all"
              style={{ borderColor: "var(--color-border-hi)", color: "var(--color-muted)" }}
            >
              Clear filters
            </button>
          )}
        </div>

        {/* Dropdowns */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider mb-1.5" style={{ color: "var(--color-faint)" }}>Campus</label>
            <select value={campusId} onChange={e => handleCampus(e.target.value)} className="w-full text-xs">
              <option value="">All campuses</option>
              {campuses.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider mb-1.5" style={{ color: "var(--color-faint)" }}>Cursus</label>
            <select value={cursusId} onChange={e => handleCursus(e.target.value)} className="w-full text-xs">
              <option value="">All cursus</option>
              {cursuses.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider mb-1.5" style={{ color: "var(--color-faint)" }}>Sort by</label>
            <select value={sort} onChange={e => handleSort(e.target.value)} className="w-full text-xs">
              {SORT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider mb-1.5" style={{ color: "var(--color-faint)" }}>Status</label>
            <button
              onClick={() => handleOnline(!onlineOnly)}
              className="w-full py-2 px-3 rounded-lg border text-xs font-semibold text-left transition-all"
              style={onlineOnly
                ? { background: "color-mix(in srgb, var(--color-green) 12%, transparent)", borderColor: "var(--color-green)", color: "var(--color-green)" }
                : { borderColor: "var(--color-border)", color: "var(--color-faint)" }}
            >
              {onlineOnly ? "● Online only" : "○ Show all"}
            </button>
          </div>
        </div>

        {/* Level range */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-[10px] font-bold uppercase tracking-wider" style={{ color: "var(--color-faint)" }}>Level range</label>
            <span className="text-xs font-mono" style={{ color: "var(--color-primary)", fontFamily: "var(--font-mono)" }}>
              {levelMin} – {levelMax}
            </span>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="text-[10px] mb-1" style={{ color: "var(--color-faint)" }}>Min</div>
              <input type="range" min={0} max={21} step={0.5} value={levelMin}
                onChange={e => handleLevelMin(Math.min(Number(e.target.value), levelMax))} />
            </div>
            <div>
              <div className="text-[10px] mb-1" style={{ color: "var(--color-faint)" }}>Max</div>
              <input type="range" min={0} max={21} step={0.5} value={levelMax}
                onChange={e => handleLevelMax(Math.max(Number(e.target.value), levelMin))} />
            </div>
          </div>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-center gap-3 p-4 rounded-xl border-l-4"
          style={{ background: "color-mix(in srgb, var(--color-red) 8%, transparent)", borderLeftColor: "var(--color-red)" }}>
          <span style={{ color: "var(--color-red)" }}>✕</span>
          <span className="text-sm" style={{ color: "var(--color-muted)" }}>{error.message}</span>
        </div>
      )}

      {/* Results */}
      {isLoading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
          {Array.from({ length: PAGE_SIZE }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
      ) : students.length === 0 ? (
        <div className="flex flex-col items-center gap-4 py-16 text-center">
          <div className="text-4xl" style={{ color: "var(--color-faint)" }}>◈</div>
          <div className="text-sm" style={{ color: "var(--color-faint)" }}>No students found</div>
          {hasFilters && (
            <button onClick={clearFilters} className="text-xs px-4 py-2 rounded-lg border transition-all"
              style={{ borderColor: "var(--color-border-hi)", color: "var(--color-muted)" }}>
              Clear all filters
            </button>
          )}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
            {students.map(s => (
              <StudentCard key={s.id} user={s} onClick={() => onNavigate("profile", s.login)} />
            ))}
          </div>
          <Pagination page={page} perPage={PAGE_SIZE} total={total} onChange={setPage} />
        </>
      )}
    </div>
  );
}
