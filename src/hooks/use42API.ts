import { useState, useEffect, useRef } from "react";
import { useAuth } from "../context/AuthContext";

// All requests go through our Vercel proxy — the 42 API blocks direct browser calls (CORS).
const BASE = "/api/42";

export interface APIResult<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  total: number;
  refetch: () => void;
}

/** Build a 42 API URL with flat param object.
 *  Params prefixed with `filter.` → `filter[x]=y`
 *  Params prefixed with `range.`  → `range[x]=y`
 *  Params prefixed with `page.`   → `page[x]=y`
 *  Others passed through as-is.
 */
export function buildURL(path: string, params?: Record<string, string | number | boolean | undefined>): string {
  const url = new URL(`${BASE}${path}`, window.location.origin);
  if (params) {
    for (const [k, v] of Object.entries(params)) {
      if (v === undefined || v === null || v === "") continue;
      const dot = k.indexOf(".");
      if (dot !== -1) {
        const prefix = k.slice(0, dot);
        const field  = k.slice(dot + 1);
        url.searchParams.set(`${prefix}[${field}]`, String(v));
      } else {
        url.searchParams.set(k, String(v));
      }
    }
  }
  return url.toString();
}

export function use42API<T>(
  path: string | null,
  params?: Record<string, string | number | boolean | undefined>,
  deps: unknown[] = []
): APIResult<T> {
  const { token } = useAuth();
  const [data,    setData]    = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState<string | null>(null);
  const [total,   setTotal]   = useState(0);
  const [tick,    setTick]    = useState(0);

  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    if (!path || !token) return;

    abortRef.current?.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;

    setLoading(true);
    setError(null);

    const url = buildURL(path, params);

    fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
      signal: ctrl.signal,
    })
      .then(async res => {
        const t = res.headers.get("X-Total");
        if (t) setTotal(parseInt(t, 10));
        if (!res.ok) {
          const body = await res.text().catch(() => "");
          throw new Error(`${res.status} – ${body || res.statusText}`);
        }
        return res.json() as Promise<T>;
      })
      .then(d => { setData(d); setLoading(false); })
      .catch(err => {
        if (err.name === "AbortError") return;
        setError(err.message);
        setLoading(false);
      });

    return () => ctrl.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [path, token, tick, ...deps]);

  const refetch = () => setTick(t => t + 1);

  return { data, loading, error, total, refetch };
}

/** One-shot manual fetcher — useful for pagination without re-mounting. */
export function useAPI42Fetcher() {
  const { token } = useAuth();

  return async function fetch42<T>(
    path: string,
    params?: Record<string, string | number | boolean | undefined>
  ): Promise<{ data: T; total: number }> {
    if (!token) throw new Error("Not authenticated");
    const url = buildURL(path, params);
    const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
    const total = parseInt(res.headers.get("X-Total") ?? "0", 10);
    if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
    const data = await res.json() as T;
    return { data, total };
  };
}
