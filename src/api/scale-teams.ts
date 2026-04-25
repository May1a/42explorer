import { use42ApiQuery } from "./client";
import type { ScaleTeam } from "../types";
import type { Params } from "../hooks/use42API";

export function useMyScaleTeams(kind: "as_corrector" | "as_corrected", params?: Params) {
  return use42ApiQuery<ScaleTeam[]>(`/me/scale_teams/${kind}`, {
    "page.size": 50,
    sort: "-begin_at",
    ...params,
  });
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
