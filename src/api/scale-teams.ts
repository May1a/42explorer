import { use42ApiQuery } from "./client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "../context/AuthContext";
import { API42Error } from "../lib/api-error";
import type { ScaleTeam } from "../types";
import type { Params } from "../hooks/use42API";

export function useMyScaleTeams(kind: "as_corrector" | "as_corrected", params?: Params, opts?: { enabled?: boolean }) {
  return use42ApiQuery<ScaleTeam[]>(`/me/scale_teams/${kind}`, {
    "page.size": 50,
    sort: "-begin_at",
    ...params,
  }, opts);
}

export function useScaleTeam(id: number) {
  return use42ApiQuery<ScaleTeam>(`/scale_teams/${id}`);
}

export function useUserScaleTeams(userId: number, params?: Params) {
  return use42ApiQuery<ScaleTeam[]>(`/users/${userId}/scale_teams`, {
    "page.size": 50,
    sort: "-begin_at",
    ...params,
  });
}

async function scaleTeamsMutate<T>(
  method: "POST" | "PATCH",
  path: string,
  token: string,
  bodyParams: URLSearchParams,
): Promise<T> {
  const url = new URL("/api/42", window.location.origin);
  url.searchParams.set("path", path);

  const res = await fetch(url.toString(), {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: bodyParams.toString(),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new API42Error(res.status, text || res.statusText);
  }
  return res.json() as Promise<T>;
}

export function useBookEvaluation() {
  const { token, user } = useAuth();
  const qc = useQueryClient();

  return useMutation<ScaleTeam, API42Error, { scaleId: number; teamId: number; beginAt: string; endAt: string }>({
    mutationFn: ({ scaleId, teamId, beginAt, endAt }) => {
      if (!user?.id) throw new API42Error(401, "Profile not loaded");
      const params = new URLSearchParams({
        "scale_team[scale_id]": String(scaleId),
        "scale_team[team_id]": String(teamId),
        "scale_team[begin_at]": beginAt,
        "scale_team[end_at]": endAt,
      });
      return scaleTeamsMutate<ScaleTeam>("POST", "/scale_teams", token!, params);
    },
    onSuccess: () => {
      setTimeout(() => {
        qc.invalidateQueries({ queryKey: ["42", "/me/scale_teams"] });
      }, 300);
    },
  });
}
