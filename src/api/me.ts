import { apiFetch, use42ApiQuery } from "./client";
import type { FortyTwoUser } from "../types";
import type { API42Result } from "../hooks/use42API";

export function getMe(token?: string): Promise<API42Result<FortyTwoUser>> {
  return apiFetch<FortyTwoUser>("/me", undefined, token);
}

export function useMe() {
  return use42ApiQuery<FortyTwoUser>("/me", undefined, { staleTime: 60_000 });
}
