import { useState, useEffect, useRef } from "react";
import { use42Query } from "../hooks/use42API";
import { useAuth } from "../context/AuthContext";
import { LevelBar } from "../components/LevelBar";
import { SkeletonCard } from "../components/Loading";
import type { Campus, Location } from "../types";

function timeSince(dateStr: string): string {
  const secs = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (secs < 60)   return `${secs}s`;
  if (secs < 3600) return `${Math.floor(secs / 60)}m`;
  const h = Math.floor(secs / 3600);
  const m = Math.floor((secs % 3600) / 60);
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

function HostChip({ host }: { host: string }) {
  const [copied, setCopied] = useState(false);
  function copy(e: React.MouseEvent) {
    e.stopPropagation();
    navigator.clipboard.writeText(host).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }
  return (
    <button
      onClick={copy}
      className="badge"
      title="Click to copy"
    >
      {copied ? "Copied" : host}
    </button>
  );
}

function LocationCard({
  loc,
  isMe,
  onProfile,
}: {
  loc: Location;
  isMe: boolean;
  onProfile: () => void;
}) {
  const cursusUser =
    loc.user.cursus_users?.find(c => c.cursus_id === 21) ??
    loc.user.cursus_users?.[loc.user.cursus_users?.length - 1];

  return (
    <div
      onClick={onProfile}
      className="card-hover relative flex flex-col gap-3 p-4 rounded-md border cursor-pointer"
      style={{
        background: "var(--color-surface)",
        borderColor: isMe ? "var(--color-purple)" : "var(--color-border)",
      }}
    >
      {/* Online badge */}
      <div className="flex items-center justify-between">
        <span className="badge badge-ok">
          <span className="online-dot" />
          Online
        </span>
        {isMe && (
          <span
            className="badge"
            style={{
              color: "var(--color-purple)",
              borderColor: "color-mix(in srgb, var(--color-purple) 30%, var(--color-border))",
            }}
          >
            You
          </span>
        )}
      </div>

      {/* Avatar + identity */}
      <div className="flex items-center gap-3">
        <img
          src={loc.user.image?.versions?.small ?? ""}
          alt={loc.user.login}
          className="w-12 h-12 rounded-full avatar-soft object-cover shrink-0"
        />
        <div className="flex-1 min-w-0">
          <div className="text-[13px] font-medium data-mono truncate" style={{ color: "var(--color-ink)" }}>
            {loc.user.login}
          </div>
          <div className="text-[12px] truncate" style={{ color: "var(--color-muted)" }}>
            {loc.user.displayname}
          </div>
        </div>
      </div>

      {/* Host chip */}
      <div onClick={e => e.stopPropagation()}>
        <HostChip host={loc.host} />
      </div>

      {/* Time online */}
      <div className="text-[12px] data-mono" style={{ color: "var(--color-faint)" }}>
        {timeSince(loc.begin_at)} online
      </div>

      {/* Level */}
      {cursusUser && <LevelBar level={cursusUser.level} height={4} />}
    </div>
  );
}

export function LocationsPage({ onNavigate }: { onNavigate: (page: any, extra?: string) => void }) {
  const { user } = useAuth();
  const [search, setSearch] = useState("");

  // Load campuses
  const { data: campusRes } = use42Query<Campus[]>("/campus", { "page.size": 100, sort: "name" });
  const campuses = campusRes?.data ?? [];

  const defaultCampus = user?.campus_users?.find(c => c.is_primary)?.campus_id;
  const [campusId, setCampusId] = useState<number | null>(null);

  // Set default campus once loaded
  useEffect(() => {
    if (defaultCampus && campusId === null) setCampusId(defaultCampus);
  }, [defaultCampus, campusId]);

  // Auto-refresh tick — only used to bust the query key, no manual fetch calls
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [countdown, setCountdown]     = useState(30);
  const [tick, setTick]               = useState(0);
  const cdRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!autoRefresh) { if (cdRef.current) clearInterval(cdRef.current); return; }
    setCountdown(30);
    cdRef.current = setInterval(() => {
      setCountdown(c => {
        if (c <= 1) { setTick(t => t + 1); return 30; }
        return c - 1;
      });
    }, 1000);
    return () => { if (cdRef.current) clearInterval(cdRef.current); };
  }, [autoRefresh, tick]);

  // Locations data — tick in params busts the React Query cache on each refresh cycle
  const { data: locRes, isLoading, refetch } = use42Query<Location[]>(
    campusId ? `/campus/${campusId}/locations` : null,
    { "filter.active": true, "page.size": 100, _tick: tick }
  );

  const locations = locRes?.data;
  const filteredLocations = locations?.filter(loc => {
    const needle = search.trim().toLowerCase();
    if (!needle) return true;
    return [
      loc.user.login,
      loc.user.displayname,
      loc.host,
    ].some(value => value?.toLowerCase().includes(needle));
  });
  const selectedCampus = campuses.find(c => c.id === campusId);

  return (
    <div className="p-5 md:p-8 max-w-5xl mx-auto animate-fade-in">
      {/* Header */}
      <div className="flex items-baseline justify-between gap-3 flex-wrap mb-1">
        <h1 className="text-[24px] font-semibold tracking-tight" style={{ color: "var(--color-ink)" }}>
          Peerfinder
        </h1>
        <div className="flex items-center gap-2">
          <button onClick={() => refetch()} className="btn-quiet text-[12.5px]">
            Refresh
          </button>
          <button
            onClick={() => setAutoRefresh(v => !v)}
            className={autoRefresh ? "badge badge-ok" : "badge"}
          >
            {autoRefresh && <span className="online-dot" />}
            {autoRefresh ? `Auto ${countdown}s` : "Auto-refresh off"}
          </button>
        </div>
      </div>
      <p className="text-[13.5px] mb-6" style={{ color: "var(--color-muted)" }}>
        Who’s on the floor at your campus — live hosts and session time.
      </p>

      {/* Campus selector — quiet filter bar */}
      <div
        className="rounded-md border p-4 mb-6"
        style={{ background: "var(--color-surface)", borderColor: "var(--color-border)" }}
      >
        <div className="flex items-start gap-4 flex-wrap">
          <div className="flex-1 min-w-[200px]">
            <label className="label block mb-1.5">Campus</label>
            <select
              value={campusId ?? ""}
              onChange={e => setCampusId(Number(e.target.value))}
              className="w-full"
            >
              <option value="">Select a campus…</option>
              {campuses.map(c => (
                <option key={c.id} value={c.id}>{c.name} — {c.city}, {c.country}</option>
              ))}
            </select>
          </div>
          <div className="flex-1 min-w-[200px]">
            <label className="label block mb-1.5">Search</label>
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Login, name, or host…"
              className="w-full"
            />
          </div>

          {/* Online count */}
          {locations && campusId && (
            <div className="flex items-baseline gap-2.5 self-end pb-1">
              <span className="text-[22px] font-medium num" style={{ color: "var(--color-green)" }}>
                {filteredLocations?.length ?? 0}
              </span>
              <span className="text-[13px]" style={{ color: "var(--color-muted)" }}>
                online at {selectedCampus?.name}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Grid */}
      {!campusId ? (
        <p className="text-[13px] py-16 text-center" style={{ color: "var(--color-faint)" }}>
          Select a campus to see who’s online
        </p>
      ) : isLoading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
          {Array.from({ length: 20 }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
      ) : !locations?.length ? (
        <p className="text-[13px] py-16 text-center" style={{ color: "var(--color-faint)" }}>
          No one online at {selectedCampus?.name} right now
        </p>
      ) : !filteredLocations?.length ? (
        <p className="text-[13px] py-16 text-center" style={{ color: "var(--color-faint)" }}>
          No online peers match your search
        </p>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
          {filteredLocations.map(loc => (
            <LocationCard
              key={loc.id}
              loc={loc}
              isMe={loc.user.login === user?.login}
              onProfile={() => onNavigate("profile", loc.user.login)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
