import { apiFetch, use42ApiQuery } from "./client";
import type { Project, ProjectUser } from "../types";
import type { Params } from "../hooks/use42API";

export function useProjects(params?: Params) {
  return use42ApiQuery<Project[]>("/projects", params, { staleTime: 3600_000 });
}

export function useProjectUsers(userId?: number, params?: Params) {
  const path = userId != null ? `/users/${userId}/projects_users` : "/me/projects_users";
  return use42ApiQuery<ProjectUser[]>(path, {
    "page.size": 100,
    sort: "-updated_at",
    ...params,
  });
}
