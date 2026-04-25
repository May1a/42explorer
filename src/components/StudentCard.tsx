import type { FortyTwoUser } from "../types";
import { LevelBar } from "./LevelBar";
import { CoalitionStripe } from "./CoalitionBadge";

interface Props {
  user: Partial<FortyTwoUser>;
  onClick?: () => void;
  compact?: boolean;
}

export function StudentCard({ user, onClick, compact = false }: Props) {
  const coalition = user.coalitions_users?.[0]?.coalition;
  const cursusUser = user.cursus_users?.find(c => c.cursus_id === 21) // 42cursus
    ?? user.cursus_users?.[user.cursus_users.length - 1];
  const level = cursusUser?.level ?? 0;
  const isOnline = Boolean(user.location);
  const primaryCampus = user.campus?.[0];
  const selectedTitle = user.titles_users?.find(t => t.selected);
  const title = selectedTitle ? user.titles?.find(t => t.id === selectedTitle.title_id) : null;

  if (compact) {
    return (
      <div
        onClick={onClick}
        className={[
          "flex items-center gap-3 p-3 rounded-xl border transition-all",
          "bg-card border-border hover:border-border-hi hover:bg-card-hi",
          onClick ? "cursor-pointer" : "",
        ].join(" ")}
      >
        <div className="relative shrink-0">
          <img
            src={user.image?.versions?.small ?? `https://cdn.intra.42.fr/users/small_default.png`}
            alt={user.login}
            className="w-9 h-9 rounded-full object-cover"
          />
          {isOnline && <span className="online-pulse absolute -bottom-0.5 -right-0.5" />}
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-semibold text-sm truncate">{user.login}</div>
          <div className="text-xs text-muted truncate">{primaryCampus?.name}</div>
        </div>
        <div className="text-xs font-mono text-primary shrink-0">
          {level > 0 ? `lv.${Math.floor(level)}` : ""}
        </div>
      </div>
    );
  }

  return (
    <div
      onClick={onClick}
      className={[
        "relative flex flex-col gap-3 p-4 rounded-xl border transition-all overflow-hidden",
        "bg-card border-border",
        onClick ? "cursor-pointer hover:border-border-hi hover:bg-card-hi hover:-translate-y-0.5" : "",
      ].join(" ")}
    >
      {coalition && <CoalitionStripe color={coalition.color} />}

      {/* Avatar + identity */}
      <div className="flex items-start gap-3">
        <div className="relative shrink-0">
          <img
            src={user.image?.versions?.medium ?? `https://cdn.intra.42.fr/users/medium_default.png`}
            alt={user.login}
            className="w-14 h-14 rounded-xl object-cover bg-card-hi"
          />
          {isOnline && (
            <span
              className="online-pulse absolute -bottom-1 -right-1 border-2"
              style={{ borderColor: "var(--color-card)" }}
            />
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="font-bold text-sm truncate">{user.displayname || user.login}</div>
          <div className="text-xs text-muted truncate font-mono">@{user.login}</div>
          {title && (
            <div className="text-xs mt-0.5 truncate" style={{ color: coalition?.color ?? "var(--color-primary)" }}>
              {title.name.replace("%login", user.login ?? "")}
            </div>
          )}
        </div>
      </div>

      {/* Level bar */}
      {level > 0 && <LevelBar level={level} />}

      {/* Footer */}
      <div className="flex items-center justify-between text-xs text-muted">
        <span className="truncate">{primaryCampus?.name ?? "—"}</span>
        {isOnline ? (
          <span
            className="flex items-center gap-1 font-semibold shrink-0"
            style={{ color: "var(--color-green)" }}
          >
            <span className="online-pulse" />
            {user.location}
          </span>
        ) : (
          coalition && (
            <span
              className="font-semibold shrink-0 text-xs"
              style={{ color: coalition.color }}
            >
              {coalition.name}
            </span>
          )
        )}
      </div>
    </div>
  );
}
