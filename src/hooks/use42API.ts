import { useQuery, type UseQueryResult } from "@tanstack/react-query";
import { useAuth } from "../context/AuthContext";
import { API42Error } from "../lib/api-error";

export type Params = Record<string, string | number | boolean | undefined>;

export interface API42Result<T> {
  data: T;
  total: number;
}

/** Dot-notation params → 42 API bracket notation.
 *  "filter.campus_id" → "filter[campus_id]"
 *  "page.number"      → "page[number]"
 */
function toSearchParams(params?: Params): string {
  if (!params) return "";
  const parts: string[] = [];
  for (const [k, v] of Object.entries(params)) {
    if (v === undefined || v === null || v === "") continue;
    const dot = k.indexOf(".");
    const key = dot !== -1 ? `${k.slice(0, dot)}[${k.slice(dot + 1)}]` : k;
    const encodedKey = encodeURIComponent(key);
    const raw = encodeURIComponent(String(v));
    const encodedValue = raw.replace(/%2C/g, ",");
    parts.push(`${encodedKey}=${encodedValue}`);
  }
  return parts.join("&");
}

export async function fetch42<T>(
  path: string,
  params: Params | undefined,
  token: string
): Promise<API42Result<T>> {
  const sp = toSearchParams(params);
  const qs = `path=${encodeURIComponent(path)}${sp ? "&" + sp : ""}`;
  const url = `${window.location.origin}/api/42?${qs}`;

  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
  });

  const total = parseInt(res.headers.get("X-Total") ?? "0", 10);
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new API42Error(res.status, body || res.statusText);
  }

  return { data: await res.json() as T, total };
}

/** Drop-in hook — wraps useQuery, zero manual effects. */
export function use42Query<T>(
  path: string | null,
  params?: Params,
): UseQueryResult<API42Result<T>, API42Error | Error> {
  const { token } = useAuth();

  return useQuery({
    queryKey:  ["42", path, params],
    queryFn:   () => fetch42<T>(path!, params, token!),
    enabled:   Boolean(path && token),
    staleTime: 30_000,   // reuse cached data for 30 s
    retry:     1,
  });
}
