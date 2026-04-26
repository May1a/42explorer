import { apiFetch, use42ApiQuery } from "./client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "../context/AuthContext";
import { API42Error } from "../lib/api-error";
import type { Project, ProjectUser } from "../types";
import type { Params } from "../hooks/use42API";

export function useProjects(params?: Params, opts?: { staleTime?: number; enabled?: boolean }) {
  return use42ApiQuery<Project[]>("/projects", params, { staleTime: 3600_000, ...opts });
}

export function useProject(id?: number) {
  return use42ApiQuery<Project>(id != null ? `/projects/${id}` : null, undefined, { staleTime: 3600_000 });
}

export function useCursusProjects(cursusId?: number, params?: Params, opts?: { staleTime?: number; enabled?: boolean }) {
  return use42ApiQuery<Project[]>("/projects", {
    "filter.cursus_id": cursusId,
    "page.size": 200,
    sort: "name",
    ...params,
  }, { staleTime: 3600_000, ...opts });
}

export function useProjectUsers(userId?: number, params?: Params, opts?: { staleTime?: number; enabled?: boolean }) {
  const path = userId != null ? `/users/${userId}/projects_users` : "/me/projects_users";
  return use42ApiQuery<ProjectUser[]>(path, {
    "page.size": 100,
    sort: "-updated_at",
    ...params,
  }, opts);
}

async function projectsMutate<T>(
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

export function useStartProject() {
  const { token, user } = useAuth();
  const qc = useQueryClient();

  return useMutation<ProjectUser, API42Error, { projectId: number }>({
    mutationFn: ({ projectId }) => {
      if (!user?.id) throw new API42Error(401, "Profile not loaded");
      const params = new URLSearchParams({
        "project_user[user_id]": String(user.id),
        "project_user[project_id]": String(projectId),
      });
      return projectsMutate<ProjectUser>("POST", "/projects_users", token!, params);
    },
    onSuccess: () => {
      setTimeout(() => {
        qc.invalidateQueries({ queryKey: ["42", "/me/projects_users"] });
        qc.invalidateQueries({ queryKey: ["42", "/projects"] });
      }, 300);
    },
  });
}

export function useSubmitProject() {
  const { token } = useAuth();
  const qc = useQueryClient();

  return useMutation<ProjectUser, API42Error, { projectUserId: number }>({
    mutationFn: ({ projectUserId }) => {
      const params = new URLSearchParams({
        "project_user[status]": "waiting_for_correction",
      });
      return projectsMutate<ProjectUser>("PATCH", `/projects_users/${projectUserId}`, token!, params);
    },
    onSuccess: () => {
      setTimeout(() => {
        qc.invalidateQueries({ queryKey: ["42", "/me/projects_users"] });
      }, 300);
    },
  });
}
