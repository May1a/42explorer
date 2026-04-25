import { apiFetch, use42ApiQuery } from "./client";
import type { FortyTwoUser, ProjectUser, Location, CursusUser } from "../types";
import type { Params } from "../hooks/use42API";

export function getUser(login: string, token?: string) {
  return apiFetch<FortyTwoUser>(`/users/${login}`, undefined, token);
}

export function useUser(login: string) {
  return use42ApiQuery<FortyTwoUser>(`/users/${login}`);
}

export function searchUsers(params?: Params) {
  return use42ApiQuery<FortyTwoUser[]>("/users", params);
}

export function useUserProjects(userId: number) {
  return use42ApiQuery<ProjectUser[]>(`/users/${userId}/projects_users`, {
    "page.size": 100,
    sort: "-updated_at",
  });
}

export function useUserLocations(userId: number) {
  return use42ApiQuery<Location[]>(`/users/${userId}/locations`, {
    "page.size": 50,
    sort: "-begin_at",
  });
}

export function useUserCursus(userId: number) {
  return use42ApiQuery<CursusUser[]>(`/users/${userId}/cursus_users`);
}
