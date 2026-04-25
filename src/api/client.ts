import { fetch42, type Params, type API42Result } from "../hooks/use42API";
import { useQuery, type UseQueryResult } from "@tanstack/react-query";
import { useAuth } from "../context/AuthContext";
import { rateLimitedFetch } from "../lib/rate-limiter";
import type { API42Error } from "../lib/api-error";

export async function apiFetch<T>(
  path: string,
  params?: Params,
  token?: string
): Promise<API42Result<T>> {
  return rateLimitedFetch(() => fetch42<T>(path, params, token!));
}

export function use42ApiQuery<T>(
  path: string | null,
  params?: Params,
  opts?: { staleTime?: number; enabled?: boolean },
): UseQueryResult<API42Result<T>, API42Error | Error> {
  const { token, user } = useAuth();

  return useQuery({
    queryKey: ["42", path, params, user?.id],
    queryFn: () => apiFetch<T>(path!, params, token!),
    enabled: Boolean(path && token) && (opts?.enabled !== false),
    staleTime: opts?.staleTime ?? 30_000,
    retry: 1,
  });
}
