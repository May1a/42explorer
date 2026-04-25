import { useQuery, type UseQueryResult } from "@tanstack/react-query";
import { useAuth } from "../context/AuthContext";

export type Params = Record<string, string | number | boolean | undefined>;

export interface API42Result<T> {
  data: T;
  total: number;
}

/** Dot-notation params → 42 API bracket notation.
 *  "filter.campus_id" → "filter[campus_id]"
 *  "page.number"      → "page[number]"
 */
function toSearchParams(params?: Params): URLSearchParams {
  const sp = new URLSearchParams();
  if (!params) return sp;
  for (const [k, v] of Object.entries(params)) {
    if (v === undefined || v === null || v === "") continue;
    const dot = k.indexOf(".");
    const key = dot !== -1 ? `${k.slice(0, dot)}[${k.slice(dot + 1)}]` : k;
    sp.set(key, String(v));
  }
  return sp;
}

export async function fetch42<T>(
  path: string,
  params: Params | undefined,
  token: string
): Promise<API42Result<T>> {
  const url = new URL("/api/42", window.location.origin);
  url.searchParams.set("path", path);
  toSearchParams(params).forEach((v, k) => url.searchParams.set(k, v));

  const res = await fetch(url.toString(), {
    headers: { Authorization: `Bearer ${token}` },
  });

  const total = parseInt(res.headers.get("X-Total") ?? "0", 10);
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`${res.status} – ${body || res.statusText}`);
  }

  return { data: await res.json() as T, total };
}

/** Drop-in hook — wraps useQuery, zero manual effects. */
export function use42Query<T>(
  path: string | null,
  params?: Params,
): UseQueryResult<API42Result<T>, Error> {
  const { token } = useAuth();

  return useQuery({
    queryKey:  ["42", path, params],
    queryFn:   () => fetch42<T>(path!, params, token!),
    enabled:   Boolean(path && token),
    staleTime: 30_000,   // reuse cached data for 30 s
    retry:     1,
  });
}
