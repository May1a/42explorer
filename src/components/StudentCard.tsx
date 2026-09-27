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
  const cursusUser = user.cursus_users?.find(c => c.cursus_id === 21)
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
          "flex items-center gap-3 px-2 py-2.5 rounded-md transition-colors",
          onClick ? "cursor-pointer" : "",
        ].join(" ")}
        style={{ background: "transparent", borderBottom: "1px solid var(--color-rule-soft)" }}
      >
        <div className="relative shrink-0">
          <img
            src={user.image?.versions?.small ?? `https://cdn.intra.42.fr/users/small_default.png`}
            alt={user.login}
            className="w-8 h-8 rounded-full object-cover avatar-soft"
          />
          {isOnline && (
            <span
              className="absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full"
              style={{ background: "var(--color-green)", border: "2px solid var(--color-bg)" }}
            />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-medium text-[13px] truncate data-mono">{user.login}</div>
          <div className="text-[12px] truncate" style={{ color: "var(--color-faint)" }}>{primaryCampus?.name}</div>
        </div>
        <div className="text-[12px] num shrink-0" style={{ color: "var(--color-muted)" }}>
          {level > 0 ? level.toFixed(2) : ""}
        </div>
      </div>
    );
  }

  return (
    <div
      onClick={onClick}
      className={[
        "relative flex flex-col gap-3 p-4 transition-colors overflow-hidden",
        onClick ? "cursor-pointer" : "",
      ].join(" ")}
      style={{
        background: "var(--color-surface)",
        border: "1px solid var(--color-border)",
        borderRadius: 4,
      }}
    >
      {coalition && <CoalitionStripe color={coalition.color} />}

      <div className="flex items-start gap-3">
        <div className="relative shrink-0">
          <img
            src={user.image?.versions?.medium ?? `https://cdn.intra.42.fr/users/medium_default.png`}
            alt={user.login}
            className="w-12 h-12 rounded-full object-cover avatar-soft"
          />
          {isOnline && (
            <span
              className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full"
              style={{ background: "var(--color-green)", border: "2px solid var(--color-surface)" }}
            />
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="font-semibold text-[15px] tracking-tight truncate">
            {user.displayname || user.login}
          </div>
          <div className="text-[12.5px] truncate data-mono" style={{ color: "var(--color-primary)" }}>
            @{user.login}
          </div>
          {title && (
            <div
              className="text-[12px] mt-0.5 truncate italic"
              style={{ color: coalition?.color ?? "var(--color-muted)" }}
            >
              {title.name.replace("%login", user.login ?? "")}
            </div>
          )}
        </div>
      </div>

      {level > 0 && <LevelBar level={level} />}

      <div className="flex items-center justify-between text-[12px]" style={{ color: "var(--color-faint)" }}>
        <span className="truncate">{primaryCampus?.name ?? "—"}</span>
        {isOnline ? (
          <span
            className="flex items-center gap-1.5 font-medium shrink-0"
            style={{ color: "var(--color-green)" }}
          >
            <span className="online-dot" />
            {user.location}
          </span>
        ) : (
          coalition && (
            <span
              className="font-medium shrink-0"
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
