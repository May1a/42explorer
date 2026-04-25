import { useState, useEffect, useCallback } from "react";
import { useAPI42Fetcher } from "../hooks/use42API";
import { use42API } from "../hooks/use42API";
import { StudentCard } from "../components/StudentCard";
import { Pagination } from "../components/Pagination";
import { SkeletonCard } from "../components/Loading";
import type { FortyTwoUser, Campus, Cursus } from "../types";

const PAGE_SIZE = 20;
const SORT_OPTIONS = [
  { value: "-cursus_users.level", label: "Level (High → Low)" },
  { value: "cursus_users.level",  label: "Level (Low → High)" },
  { value: "login",               label: "Login A → Z" },
  { value: "-login",              label: "Login Z → A" },
  { value: "-created_at",         label: "Newest first" },
  { value: "created_at",          label: "Oldest first" },
];

function useDebounce<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

export function StudentsPage({ onNavigate }: { onNavigate: (page: any, extra?: string) => void }) {
  const fetch42 = useAPI42Fetcher();

  const [students, setStudents] = useState<FortyTwoUser[]>([]);
  const [total,    setTotal]    = useState(0);
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState<string | null>(null);

  // Filters
  const [search,    setSearch]    = useState("");
  const [campusId,  setCampusId]  = useState<string>("");
  const [cursusId,  setCursusId]  = useState<string>("21"); // 42cursus default
  const [levelMin,  setLevelMin]  = useState(0);
  const [levelMax,  setLevelMax]  = useState(21);
  const [onlineOnly, setOnlineOnly] = useState(false);
  const [sort,      setSort]      = useState("-cursus_users.level");
  const [page,      setPage]      = useState(1);

  const debouncedSearch = useDebounce(search, 400);

  // Load campus + cursus lists
  const { data: campuses } = use42API<Campus[]>("/campus", { "page.size": 100, sort: "name" });
  const { data: cursuses } = use42API<Cursus[]>("/cursus", { "page.size": 100, sort: "name" });

  const fetchStudents = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params: Record<string, any> = {
        "page.number": page,
        "page.size":   PAGE_SIZE,
        sort,
      };
      if (campusId)  params["filter.campus_id"]  = campusId;
      if (cursusId)  params["filter.cursus_id"]  = cursusId;
      if (onlineOnly) params["filter.location"]  = "active";
      if (debouncedSearch) {
        params["filter.login"] = debouncedSearch;
      }
      if (levelMin > 0 || levelMax < 21) {
        params["range.cursus_users.level"] = `${levelMin},${levelMax}`;
      }

      const { data, total } = await fetch42<FortyTwoUser[]>("/users", params);
      setStudents(data);
      setTotal(total);
    } catch (e: any) {
      setError(e.message);
    }
    setLoading(false);
  }, [fetch42, page, sort, campusId, cursusId, onlineOnly, debouncedSearch, levelMin, levelMax]);

  useEffect(() => { fetchStudents(); }, [fetchStudents]);

  // Reset to page 1 on filter change
  useEffect(() => { setPage(1); }, [debouncedSearch, campusId, cursusId, onlineOnly, levelMin, levelMax, sort]);

  function clearFilters() {
    setSearch("");
    setCampusId("");
    setCursusId("21");
    setLevelMin(0);
    setLevelMax(21);
    setOnlineOnly(false);
    setSort("-cursus_users.level");
    setPage(1);
  }

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
      <div
        className="rounded-2xl border p-5 space-y-4"
        style={{ background: "var(--color-card)", borderColor: "var(--color-border)" }}
      >
        {/* Search */}
        <div className="flex gap-3">
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
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

        {/* Filters row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {/* Campus */}
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider mb-1.5" style={{ color: "var(--color-faint)" }}>
              Campus
            </label>
            <select value={campusId} onChange={e => setCampusId(e.target.value)} className="w-full text-xs">
              <option value="">All campuses</option>
              {(campuses ?? []).map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          {/* Cursus */}
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider mb-1.5" style={{ color: "var(--color-faint)" }}>
              Cursus
            </label>
            <select value={cursusId} onChange={e => setCursusId(e.target.value)} className="w-full text-xs">
              <option value="">All cursus</option>
              {(cursuses ?? []).map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          {/* Sort */}
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider mb-1.5" style={{ color: "var(--color-faint)" }}>
              Sort by
            </label>
            <select value={sort} onChange={e => setSort(e.target.value)} className="w-full text-xs">
              {SORT_OPTIONS.map(o => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>

          {/* Online only */}
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider mb-1.5" style={{ color: "var(--color-faint)" }}>
              Status
            </label>
            <button
              onClick={() => setOnlineOnly(v => !v)}
              className="w-full py-2 px-3 rounded-lg border text-xs font-semibold text-left transition-all"
              style={
                onlineOnly
                  ? {
                      background: "color-mix(in srgb, var(--color-green) 12%, transparent)",
                      borderColor: "var(--color-green)",
                      color: "var(--color-green)",
                    }
                  : {
                      borderColor: "var(--color-border)",
                      color: "var(--color-faint)",
                    }
              }
            >
              {onlineOnly ? "● Online only" : "○ Show all"}
            </button>
          </div>
        </div>

        {/* Level range */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-[10px] font-bold uppercase tracking-wider" style={{ color: "var(--color-faint)" }}>
              Level range
            </label>
            <span className="text-xs font-mono" style={{ color: "var(--color-primary)", fontFamily: "var(--font-mono)" }}>
              {levelMin} – {levelMax}
            </span>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="text-[10px] mb-1" style={{ color: "var(--color-faint)" }}>Min</div>
              <input
                type="range" min={0} max={21} step={0.5}
                value={levelMin}
                onChange={e => setLevelMin(Math.min(Number(e.target.value), levelMax))}
              />
            </div>
            <div>
              <div className="text-[10px] mb-1" style={{ color: "var(--color-faint)" }}>Max</div>
              <input
                type="range" min={0} max={21} step={0.5}
                value={levelMax}
                onChange={e => setLevelMax(Math.max(Number(e.target.value), levelMin))}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Error state */}
      {error && (
        <div
          className="flex items-center gap-3 p-4 rounded-xl border-l-4"
          style={{
            background: "color-mix(in srgb, var(--color-red) 8%, transparent)",
            borderLeftColor: "var(--color-red)",
          }}
        >
          <span style={{ color: "var(--color-red)" }}>✕</span>
          <span className="text-sm" style={{ color: "var(--color-muted)" }}>{error}</span>
          <button
            onClick={fetchStudents}
            className="ml-auto text-xs font-semibold px-3 py-1 rounded-lg border transition-all"
            style={{ borderColor: "var(--color-red)", color: "var(--color-red)" }}
          >
            Retry
          </button>
        </div>
      )}

      {/* Results */}
      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
          {Array.from({ length: PAGE_SIZE }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
      ) : students.length === 0 ? (
        <div className="flex flex-col items-center gap-4 py-16 text-center">
          <div className="text-4xl" style={{ color: "var(--color-faint)" }}>◈</div>
          <div className="text-sm" style={{ color: "var(--color-faint)" }}>No students found</div>
          <button
            onClick={clearFilters}
            className="text-xs px-4 py-2 rounded-lg border transition-all"
            style={{ borderColor: "var(--color-border-hi)", color: "var(--color-muted)" }}
          >
            Clear all filters
          </button>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
            {students.map(student => (
              <StudentCard
                key={student.id}
                user={student}
                onClick={() => onNavigate("profile", student.login)}
              />
            ))}
          </div>
          <Pagination
            page={page}
            perPage={PAGE_SIZE}
            total={total}
            onChange={setPage}
          />
        </>
      )}
    </div>
  );
}
