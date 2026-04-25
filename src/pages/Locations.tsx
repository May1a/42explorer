import { useState, useEffect, useRef } from "react";
import { use42API } from "../hooks/use42API";
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
      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all"
      style={{
        background: "color-mix(in srgb, var(--color-primary) 12%, transparent)",
        border: "1px solid color-mix(in srgb, var(--color-primary) 30%, transparent)",
        color: "var(--color-primary)",
        fontFamily: "var(--font-mono)",
      }}
      title="Click to copy"
    >
      <span>◈</span>
      {copied ? "✓ Copied!" : host}
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
      className="relative flex flex-col gap-3 p-4 rounded-xl border cursor-pointer transition-all"
      style={{
        background: "var(--color-card)",
        borderColor: isMe ? "var(--color-purple)" : "var(--color-border)",
      }}
      onMouseEnter={e =>
        (e.currentTarget.style.borderColor = isMe ? "var(--color-purple)" : "var(--color-primary)")
      }
      onMouseLeave={e =>
        (e.currentTarget.style.borderColor = isMe ? "var(--color-purple)" : "var(--color-border)")
      }
    >
      {/* Online badge */}
      <div className="flex items-center justify-between">
        <span className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider" style={{ color: "var(--color-green)" }}>
          <span className="online-pulse" /> Online
        </span>
        {isMe && (
          <span
            className="text-[10px] font-bold px-2 py-0.5 rounded-full"
            style={{
              background: "color-mix(in srgb, var(--color-purple) 15%, transparent)",
              color: "var(--color-purple)",
            }}
          >
            YOU
          </span>
        )}
      </div>

      {/* Avatar + identity */}
      <div className="flex items-center gap-3">
        <img
          src={loc.user.image?.versions?.small ?? ""}
          alt={loc.user.login}
          className="w-12 h-12 rounded-xl object-cover shrink-0"
          style={{ border: `2px solid ${isMe ? "var(--color-purple)" : "var(--color-border-hi)"}` }}
        />
        <div className="flex-1 min-w-0">
          <div
            className="text-sm font-bold truncate"
            style={{ color: "#e2e8f0", fontFamily: "var(--font-mono)" }}
          >
            {loc.user.login}
          </div>
          <div className="text-xs truncate" style={{ color: "var(--color-muted)" }}>
            {loc.user.displayname}
          </div>
        </div>
      </div>

      {/* Host chip */}
      <div onClick={e => e.stopPropagation()}>
        <HostChip host={loc.host} />
      </div>

      {/* Time online */}
      <div className="text-xs" style={{ color: "var(--color-faint)" }}>
        ⏱ {timeSince(loc.begin_at)} online
      </div>

      {/* Level */}
      {cursusUser && <LevelBar level={cursusUser.level} height={4} />}
    </div>
  );
}

export function LocationsPage({ onNavigate }: { onNavigate: (page: any, extra?: string) => void }) {
  const { user } = useAuth();

  // Load campuses
  const { data: campuses } = use42API<Campus[]>("/campus", { "page.size": 100, sort: "name" });
  const defaultCampus = user?.campus_users?.find(c => c.is_primary)?.campus_id;
  const [campusId, setCampusId] = useState<number | null>(null);

  // Set default campus once loaded
  useEffect(() => {
    if (defaultCampus && campusId === null) setCampusId(defaultCampus);
  }, [defaultCampus, campusId]);

  // Auto-refresh
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

  // Locations data
  const { data: locations, loading, refetch } = use42API<Location[]>(
    campusId ? `/campus/${campusId}/locations` : null,
    { "filter.active": true, "page.size": 100 },
    [campusId, tick]
  );

  const selectedCampus = campuses?.find(c => c.id === campusId);

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-lg font-bold tracking-widest uppercase" style={{ fontFamily: "var(--font-mono)", color: "#e2e8f0" }}>
          &gt; PEERFINDER++_
        </h1>

        {/* Auto-refresh toggle */}
        <div className="flex items-center gap-3">
          <button
            onClick={refetch}
            className="text-xs px-3 py-1.5 rounded-lg border transition-all font-semibold"
            style={{ borderColor: "var(--color-border-hi)", color: "var(--color-muted)" }}
          >
            ↻ Refresh
          </button>
          <button
            onClick={() => setAutoRefresh(v => !v)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-semibold transition-all"
            style={
              autoRefresh
                ? {
                    background: "color-mix(in srgb, var(--color-green) 12%, transparent)",
                    borderColor: "var(--color-green)",
                    color: "var(--color-green)",
                  }
                : { borderColor: "var(--color-border)", color: "var(--color-faint)" }
            }
          >
            {autoRefresh ? (
              <>
                <span className="online-pulse" />
                Auto {countdown}s
              </>
            ) : (
              "○ Auto-refresh off"
            )}
          </button>
        </div>
      </div>

      {/* Campus selector */}
      <div
        className="rounded-xl border p-4"
        style={{ background: "var(--color-card)", borderColor: "var(--color-border)" }}
      >
        <div className="flex items-start gap-4 flex-wrap">
          <div className="flex-1 min-w-[200px]">
            <label className="block text-[10px] font-bold uppercase tracking-wider mb-1.5" style={{ color: "var(--color-faint)" }}>
              Campus
            </label>
            <select
              value={campusId ?? ""}
              onChange={e => setCampusId(Number(e.target.value))}
              className="w-full text-sm"
            >
              <option value="">Select a campus…</option>
              {(campuses ?? []).map(c => (
                <option key={c.id} value={c.id}>{c.name} — {c.city}, {c.country}</option>
              ))}
            </select>
          </div>

          {/* Online count badge */}
          {locations && campusId && (
            <div
              className="flex items-center gap-3 px-4 py-3 rounded-xl border-l-4 self-end"
              style={{
                background: "color-mix(in srgb, var(--color-green) 8%, transparent)",
                borderLeftColor: "var(--color-green)",
                minWidth: 200,
              }}
            >
              <span className="online-pulse" />
              <div>
                <div
                  className="text-xl font-black"
                  style={{ color: "var(--color-green)", fontFamily: "var(--font-mono)" }}
                >
                  {locations.length}
                </div>
                <div className="text-xs" style={{ color: "var(--color-faint)" }}>
                  online at {selectedCampus?.name}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Grid */}
      {!campusId ? (
        <div className="flex flex-col items-center gap-3 py-16 text-center">
          <div className="text-4xl" style={{ color: "var(--color-faint)" }}>◎</div>
          <div className="text-sm" style={{ color: "var(--color-faint)" }}>Select a campus to see who's online</div>
        </div>
      ) : loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
          {Array.from({ length: 20 }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
      ) : !locations?.length ? (
        <div className="flex flex-col items-center gap-3 py-16 text-center">
          <div className="text-4xl" style={{ color: "var(--color-faint)" }}>○</div>
          <div className="text-sm" style={{ color: "var(--color-faint)" }}>No one online at {selectedCampus?.name} right now</div>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
          {locations.map(loc => (
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
