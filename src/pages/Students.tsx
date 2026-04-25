import { useState, useEffect, useMemo } from "react";
import { use42Query } from "../hooks/use42API";
import { useAuth } from "../context/AuthContext";
import { StudentCard } from "../components/StudentCard";
import { Pagination } from "../components/Pagination";
import { SkeletonCard } from "../components/Loading";
import { InsufficientScopeCard } from "../components/errors/InsufficientScopeCard";
import type { FortyTwoUser, Campus, Cursus, CursusUser } from "../types";

const PAGE_SIZE = 20;

function getStudentsHashParams(): URLSearchParams {
  const hash = window.location.hash;
  const qIdx = hash.indexOf("?");
  return new URLSearchParams(qIdx >= 0 ? hash.slice(qIdx + 1) : "");
}

function saveStudentsHash(filters: {
  search: string; campusId: string; cursusId: string; kickoff: string;
  levelMin: number; levelMax: number; onlineOnly: boolean; sort: string; page: number;
}) {
  const p = new URLSearchParams();
  if (filters.search) p.set("q", filters.search);
  if (filters.campusId) p.set("campus", filters.campusId);
  if (filters.cursusId) p.set("cursus", filters.cursusId);
  if (filters.kickoff) p.set("kickoff", filters.kickoff);
  if (filters.levelMin > 0) p.set("lvMin", String(filters.levelMin));
  if (filters.levelMax < 21) p.set("lvMax", String(filters.levelMax));
  if (filters.onlineOnly) p.set("online", "1");
  if (filters.sort !== "-level") p.set("sort", filters.sort);
  if (filters.page > 1) p.set("page", String(filters.page));
  const hash = p.toString() ? `#/students?${p.toString()}` : "#/students";
  window.history.replaceState(null, "", hash);
  sessionStorage.setItem("studentsHash", hash);
}

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

const USER_API_SORTS = new Set(["login", "-login", "created_at", "-created_at"]);
const CURSUS_USER_API_SORTS = new Set(["level", "-level", "begin_at", "-begin_at"]);

function selectedCursusUser(user: FortyTwoUser, cursusId: string) {
  const id = Number(cursusId);
  return (id ? user.cursus_users?.find(c => c.cursus_id === id) : undefined)
    ?? user.cursus_users?.find(c => c.cursus_id === 21)
    ?? user.cursus_users?.[user.cursus_users.length - 1];
}

function kickoffRange(month: string) {
  const [year, rawMonth] = month.split("-").map(Number);
  if (!year || !rawMonth) return null;
  const start = new Date(Date.UTC(year, rawMonth - 1, 1));
  const end = new Date(Date.UTC(year, rawMonth, 1));
  return `${start.toISOString()},${end.toISOString()}`;
}

function kickoffLabel(month: string) {
  const [year, rawMonth] = month.split("-").map(Number);
  if (!year || !rawMonth) return month;
  return new Date(Date.UTC(year, rawMonth - 1, 1)).toLocaleDateString(undefined, {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
}

function kickoffMonth(value: string) {
  return value.slice(0, 7);
}

function cursusUserToStudent(cursusUser: CursusUser): FortyTwoUser {
  return {
    ...cursusUser.user,
    id: cursusUser.user.id ?? cursusUser.user_id,
    login: cursusUser.user.login ?? "",
    cursus_users: [cursusUser],
  } as FortyTwoUser;
}

export function StudentsPage({ onNavigate }: { onNavigate: (page: any, extra?: string) => void }) {
  const { user } = useAuth();
  const primaryCampusId = user?.campus_users?.find(c => c.is_primary)?.campus_id.toString() ?? "";

  // ── Filter state — initialised from URL hash params ───────────────────────
  const [search,    setSearch]    = useState(() => getStudentsHashParams().get("q") ?? "");
  const [campusId,  setCampusId]  = useState(() => getStudentsHashParams().get("campus") ?? "");
  const [campusReady, setCampusReady] = useState(() => Boolean(getStudentsHashParams().get("campus")));
  const [cursusId,  setCursusId]  = useState(() => getStudentsHashParams().get("cursus") ?? "");
  const [kickoff,   setKickoff]   = useState(() => getStudentsHashParams().get("kickoff") ?? "");
  const [levelMin,  setLevelMin]  = useState(() => Number(getStudentsHashParams().get("lvMin") ?? 0));
  const [levelMax,  setLevelMax]  = useState(() => Number(getStudentsHashParams().get("lvMax") ?? 21));
  const [onlineOnly, setOnlineOnly] = useState(() => getStudentsHashParams().get("online") === "1");
  const [sort,      setSort]      = useState(() => getStudentsHashParams().get("sort") ?? "-level");
  const [page,      setPage]      = useState(() => Number(getStudentsHashParams().get("page") ?? 1));

  const debouncedSearch = useDebounce(search, 400);

  useEffect(() => {
    if (primaryCampusId && !campusReady) {
      setCampusId(primaryCampusId);
      setCampusReady(true);
    }
  }, [primaryCampusId, campusReady]);

  // Persist filter state to URL hash + sessionStorage whenever anything changes
  useEffect(() => {
    if (!campusReady) return;
    saveStudentsHash({ search, campusId, cursusId, kickoff, levelMin, levelMax, onlineOnly, sort, page });
  }, [campusReady, search, campusId, cursusId, kickoff, levelMin, levelMax, onlineOnly, sort, page]);

  // Every handler resets page — no useEffect needed
  function handleSearch(v: string)      { setSearch(v);    setPage(1); }
  function handleCampus(v: string)      { setCampusId(v); setCampusReady(true); setPage(1); }
  function handleCursus(v: string)      { setCursusId(v);  setPage(1); }
  function handleKickoff(v: string)     { setKickoff(v);   setPage(1); }
  function handleSort(v: string)        { setSort(v);      setPage(1); }
  function handleOnline(v: boolean)     { setOnlineOnly(v); setPage(1); }
  function handleLevelMin(v: number)    { setLevelMin(v);  setPage(1); }
  function handleLevelMax(v: number)    { setLevelMax(v);  setPage(1); }

  function clearFilters() {
    setSearch(""); setCampusId(primaryCampusId); setCampusReady(true); setCursusId(""); setKickoff("");
    setLevelMin(0); setLevelMax(21); setOnlineOnly(false);
    setSort("-level"); setPage(1);
  }

  // ── Query params — derived, stable object ─────────────────────────────────
  const kickoffRangeValue = kickoffRange(kickoff);
  const usesKickoffEndpoint = Boolean(kickoffRangeValue);
  const studentsPath = usesKickoffEndpoint
    ? (cursusId ? `/cursus/${cursusId}/cursus_users` : "/cursus_users")
    : (cursusId ? `/cursus/${cursusId}/users` : "/users");
  const apiSort = usesKickoffEndpoint
    ? (CURSUS_USER_API_SORTS.has(sort) ? sort : undefined)
    : (USER_API_SORTS.has(sort) ? sort : undefined);

  const isNameSearch = !usesKickoffEndpoint && Boolean(debouncedSearch);
  const params = useMemo(() => ({
    "page.number": isNameSearch ? 1 : page,
    "page.size":   isNameSearch ? 100 : PAGE_SIZE,
    ...(apiSort             && { sort: apiSort }),
    ...(usesKickoffEndpoint && campusId && { "filter.campus_id": campusId }),
    ...(!usesKickoffEndpoint && campusId && { "filter.primary_campus_id":  campusId }),
    ...(!usesKickoffEndpoint && debouncedSearch && { "filter.login":      debouncedSearch }),
    ...(usesKickoffEndpoint && kickoffRangeValue && { "range.begin_at": kickoffRangeValue }),
    ...(usesKickoffEndpoint && (levelMin > 0 || levelMax < 21) && { "range.level": `${levelMin},${levelMax}` }),
  }), [page, isNameSearch, apiSort, usesKickoffEndpoint, campusId, debouncedSearch, cursusId, kickoffRangeValue, levelMin, levelMax]);

  // ── Data — one query, no manual effects ───────────────────────────────────
  const { data: campusRes }  = use42Query<Campus[]>("/campus",  { "page.size": 100, sort: "name" });
  const { data: cursusRes }  = use42Query<Cursus[]>("/cursus",  { "page.size": 100, sort: "name" });
  const { data: kickoffRes } = use42Query<Record<string, number>>("/cursus_users/graph/on/begin_at/by/month", {
    ...(campusId && { "filter.campus_id": campusId }),
    ...(cursusId && { "filter.cursus_id": cursusId }),
  });
  const { data: studentsRes, isLoading: isLoadingMain, error } = use42Query<FortyTwoUser[] | CursusUser[]>(studentsPath, params);

  const nameSearchPath = isNameSearch ? (cursusId ? `/cursus/${cursusId}/users` : "/users") : null;
  const firstNameParams = useMemo(() => ({
    "page.size": 100,
    ...(campusId && { "filter.primary_campus_id": campusId }),
    "filter.first_name": debouncedSearch,
  }), [campusId, debouncedSearch]);
  const lastNameParams = useMemo(() => ({
    "page.size": 100,
    ...(campusId && { "filter.primary_campus_id": campusId }),
    "filter.last_name": debouncedSearch,
  }), [campusId, debouncedSearch]);
  const { data: firstNameRes, isLoading: isLoadingFirstName } = use42Query<FortyTwoUser[]>(nameSearchPath, firstNameParams);
  const { data: lastNameRes,  isLoading: isLoadingLastName  } = use42Query<FortyTwoUser[]>(nameSearchPath, lastNameParams);
  const isLoading = isLoadingMain || isLoadingFirstName || isLoadingLastName;

  const students = useMemo(() => {
    let rows: (FortyTwoUser | CursusUser)[] = (studentsRes?.data ?? []) as (FortyTwoUser | CursusUser)[];

    if (isNameSearch) {
      const seen = new Set((rows as FortyTwoUser[]).map(u => u.id));
      for (const user of [...(firstNameRes?.data ?? []), ...(lastNameRes?.data ?? [])]) {
        if (!seen.has(user.id)) {
          seen.add(user.id);
          rows = [...rows, user];
        }
      }
    }

    const filtered = rows.filter(user => {
      const student = usesKickoffEndpoint ? cursusUserToStudent(user as CursusUser) : user as FortyTwoUser;
      const cursusUser = selectedCursusUser(student, cursusId);
      const level = cursusUser?.level ?? 0;
      const matchesSearch = !usesKickoffEndpoint || !debouncedSearch || [
        student.login,
        student.first_name,
        student.last_name,
        student.displayname,
        student.email,
      ].some(value => value?.toLowerCase().includes(debouncedSearch.toLowerCase()));
      if (onlineOnly && !student.location) return false;
      if (!matchesSearch) return false;
      if (usesKickoffEndpoint) return true;
      return level >= levelMin && level <= levelMax;
    }).map(user => usesKickoffEndpoint ? cursusUserToStudent(user as CursusUser) : user as FortyTwoUser);

    if (!usesKickoffEndpoint && (sort === "level" || sort === "-level")) {
      return [...filtered].sort((a, b) => {
        const aLevel = selectedCursusUser(a, cursusId)?.level ?? 0;
        const bLevel = selectedCursusUser(b, cursusId)?.level ?? 0;
        return sort === "level" ? aLevel - bLevel : bLevel - aLevel;
      });
    }

    return filtered;
  }, [studentsRes?.data, firstNameRes?.data, lastNameRes?.data, isNameSearch, usesKickoffEndpoint, cursusId, levelMin, levelMax, onlineOnly, debouncedSearch, sort]);

  const usesLocalFilters = onlineOnly || Boolean(debouncedSearch) || (!usesKickoffEndpoint && (levelMin > 0 || levelMax < 21));
  const displayedStudents = usesLocalFilters
    ? students.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)
    : students;
  const total    = usesLocalFilters ? students.length : studentsRes?.total ?? 0;
  const campuses = campusRes?.data ?? [];
  const cursuses = cursusRes?.data ?? [];
  const kickoffOptions = useMemo(() => {
    const months = new Set<string>();
    for (const [month, count] of Object.entries(kickoffRes?.data ?? {})) {
      if (count > 0) months.add(kickoffMonth(month));
    }
    if (kickoff) months.add(kickoff);
    return [...months].sort((a, b) => b.localeCompare(a));
  }, [kickoffRes?.data, kickoff]);

  const hasFilters = Boolean(search || campusId !== primaryCampusId || cursusId || kickoff || levelMin > 0 || levelMax < 21 || onlineOnly);

  return (
    <div className="p-3 md:p-6 max-w-7xl mx-auto space-y-4 md:space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <h1 className="text-base md:text-lg font-bold tracking-widest uppercase" style={{ fontFamily: "var(--font-mono)", color: "#e2e8f0" }}>
          &gt; STUDENTS_BROWSER
        </h1>
        {total > 0 && (
          <span className="text-xs" style={{ color: "var(--color-faint)", fontFamily: "var(--font-mono)" }}>
            {total.toLocaleString()} students
          </span>
        )}
      </div>

      {/* Filter panel */}
      <div className="rounded-2xl border p-4 md:p-5 space-y-4" style={{ background: "var(--color-card)", borderColor: "var(--color-border)" }}>
        {/* Search */}
        <div className="flex gap-3 flex-wrap">
          <input
            type="text"
            value={search}
            onChange={e => handleSearch(e.target.value)}
            placeholder="◈  Search by login, first or last name..."
            className="flex-1 min-w-[140px]"
            style={{ fontFamily: "var(--font-mono)", fontSize: 13 }}
          />
          {hasFilters && (
            <button
              onClick={clearFilters}
              className="px-4 py-2 rounded-lg text-xs font-semibold border transition-all whitespace-nowrap"
              style={{ borderColor: "var(--color-border-hi)", color: "var(--color-muted)" }}
            >
              Clear filters
            </button>
          )}
        </div>

        {/* Dropdowns */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
          <div>
            <label className="block text-xs md:text-[10px] font-bold uppercase tracking-wider mb-1.5" style={{ color: "var(--color-faint)" }}>Campus</label>
            <select value={campusId} onChange={e => handleCampus(e.target.value)} className="w-full text-xs">
              <option value="">All campuses</option>
              {campuses.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs md:text-[10px] font-bold uppercase tracking-wider mb-1.5" style={{ color: "var(--color-faint)" }}>Cursus</label>
            <select value={cursusId} onChange={e => handleCursus(e.target.value)} className="w-full text-xs">
              <option value="">All cursus</option>
              {cursuses.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs md:text-[10px] font-bold uppercase tracking-wider mb-1.5" style={{ color: "var(--color-faint)" }}>Sort by</label>
            <select value={sort} onChange={e => handleSort(e.target.value)} className="w-full text-xs">
              {SORT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs md:text-[10px] font-bold uppercase tracking-wider mb-1.5" style={{ color: "var(--color-faint)" }}>Kickoff</label>
            <select
              value={kickoff}
              onChange={e => handleKickoff(e.target.value)}
              className="w-full text-xs"
            >
              <option value="">All kickoffs</option>
              {kickoffOptions.map(month => (
                <option key={month} value={month}>{kickoffLabel(month)}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs md:text-[10px] font-bold uppercase tracking-wider mb-1.5" style={{ color: "var(--color-faint)" }}>Status</label>
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
            <label className="text-xs md:text-[10px] font-bold uppercase tracking-wider" style={{ color: "var(--color-faint)" }}>Level range</label>
            <span className="text-xs font-mono" style={{ color: "var(--color-primary)", fontFamily: "var(--font-mono)" }}>
              {levelMin} – {levelMax}
            </span>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="text-xs md:text-[10px] mb-1" style={{ color: "var(--color-faint)" }}>Min</div>
              <input type="range" min={0} max={21} step={0.5} value={levelMin}
                onChange={e => handleLevelMin(Math.min(Number(e.target.value), levelMax))} />
            </div>
            <div>
              <div className="text-xs md:text-[10px] mb-1" style={{ color: "var(--color-faint)" }}>Max</div>
              <input type="range" min={0} max={21} step={0.5} value={levelMax}
                onChange={e => handleLevelMax(Math.max(Number(e.target.value), levelMin))} />
            </div>
          </div>
        </div>
      </div>

      {/* Error */}
      {error && <InsufficientScopeCard error={error} />}

      {/* Results */}
      {isLoading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
          {Array.from({ length: PAGE_SIZE }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
      ) : displayedStudents.length === 0 ? (
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
            {displayedStudents.map(s => (
              <StudentCard key={s.id} user={s} onClick={() => onNavigate("profile", s.login)} />
            ))}
          </div>
          <Pagination page={page} perPage={PAGE_SIZE} total={total} onChange={setPage} />
        </>
      )}
    </div>
  );
}
