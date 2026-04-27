/**
 * Stable 42 API proxy endpoint.
 *
 * Vercel static deployments can fail to route nested dynamic function paths
 * like /api/42/cursus/21/users. The frontend calls this fixed endpoint and
 * passes the upstream 42 path in the path query parameter instead.
 */
export const config = { runtime: "edge" };

const rateWindowMs = 1000;
const rateLimitPerSecond = 5;
const rateCache = new Map<string, number[]>();

function isRateLimited(key: string): boolean {
  const now = Date.now();
  const wins = rateCache.get(key) ?? [];
  const fresh = wins.filter((t) => t > now - rateWindowMs);
  if (fresh.length >= rateLimitPerSecond) return true;
  fresh.push(now);
  rateCache.set(key, fresh);
  return false;
}

setInterval(() => {
  const now = Date.now();
  for (const [k, v] of rateCache) {
    const fresh = v.filter((t) => t > now - rateWindowMs);
    if (fresh.length === 0) rateCache.delete(k);
    else rateCache.set(k, fresh);
  }
}, 30_000);

export default async function handler(request: Request): Promise<Response> {
  if (request.method === "OPTIONS") {
    return new Response(null, {
      headers: {
        "Access-Control-Allow-Origin":  "*",
        "Access-Control-Allow-Methods": "GET, POST, PUT, PATCH, DELETE, OPTIONS",
        "Access-Control-Allow-Headers": "Authorization, Content-Type",
      },
    });
  }

  const auth = request.headers.get("Authorization") ?? "anonymous";
  const ip = request.headers.get("x-forwarded-for") ?? "unknown";
  const rateKey = `${ip}:${auth.slice(-8)}`;

  if (isRateLimited(rateKey)) {
    return Response.json(
      { error: "Too many requests" },
      {
        status: 429,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Retry-After": "1",
        },
      }
    );
  }

  const url = new URL(request.url);
  const path = url.searchParams.get("path");
  url.searchParams.delete("path");

  if (!path?.startsWith("/")) {
    return Response.json({ error: "Missing or invalid 42 API path" }, { status: 400 });
  }

  const apiUrl = new URL(`https://api.intra.42.fr/v2${path}`);
  const parts: string[] = [];
  url.searchParams.forEach((value, key) => {
    const ek = encodeURIComponent(key);
    const ev = encodeURIComponent(value).replace(/%2C/g, ",");
    parts.push(`${ek}=${ev}`);
  });
  if (parts.length) apiUrl.search = `?${parts.join("&")}`;

  if (!auth || auth === "anonymous") {
    return Response.json({ error: "Missing Authorization header" }, { status: 401 });
  }

  let upstream: Response;
  try {
    const headers = new Headers({ Authorization: auth });
    const contentType = request.headers.get("Content-Type");
    if (contentType) headers.set("Content-Type", contentType);

    upstream = await fetch(apiUrl.toString(), {
      method: request.method,
      headers,
      body: request.method === "GET" || request.method === "HEAD"
        ? undefined
        : await request.arrayBuffer(),
    });
  } catch (e: any) {
    return Response.json({ error: `Upstream fetch failed: ${e.message}` }, { status: 502 });
  }

  const body = await upstream.text();

  const headers = new Headers({
    "Content-Type":                "application/json",
    "Access-Control-Allow-Origin": "*",
  });

  for (const h of ["X-Total", "X-Page", "X-Per-Page", "X-Next-Page", "Link"]) {
    const v = upstream.headers.get(h);
    if (v) headers.set(h, v);
  }

  return new Response(body, { status: upstream.status, headers });
}
