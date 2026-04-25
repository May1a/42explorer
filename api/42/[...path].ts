/**
 * Vercel Edge Function — 42 API proxy.
 *
 * The 42 API does not send CORS headers, so browser → api.intra.42.fr
 * requests are blocked. This proxy runs server-side (no CORS restriction)
 * and forwards any /api/42/* request to https://api.intra.42.fr/v2/*.
 *
 * The Bearer token is passed through from the frontend's Authorization header.
 */
export const config = { runtime: "edge" };

export default async function handler(request: Request): Promise<Response> {
  // Handle CORS preflight
  if (request.method === "OPTIONS") {
    return new Response(null, {
      headers: {
        "Access-Control-Allow-Origin":  "*",
        "Access-Control-Allow-Methods": "GET, OPTIONS",
        "Access-Control-Allow-Headers": "Authorization, Content-Type",
      },
    });
  }

  const url  = new URL(request.url);
  const path = url.pathname.replace(/^\/api\/42/, "");
  const apiUrl = `https://api.intra.42.fr/v2${path}${url.search}`;

  const auth = request.headers.get("Authorization");
  if (!auth) {
    return Response.json({ error: "Missing Authorization header" }, { status: 401 });
  }

  let upstream: Response;
  try {
    upstream = await fetch(apiUrl, {
      headers: { Authorization: auth },
    });
  } catch (e: any) {
    return Response.json({ error: `Upstream fetch failed: ${e.message}` }, { status: 502 });
  }

  const body = await upstream.text();

  const headers = new Headers({
    "Content-Type":                "application/json",
    "Access-Control-Allow-Origin": "*",
  });

  // Forward all pagination headers the frontend depends on
  for (const h of ["X-Total", "X-Page", "X-Per-Page", "X-Next-Page", "Link"]) {
    const v = upstream.headers.get(h);
    if (v) headers.set(h, v);
  }

  return new Response(body, { status: upstream.status, headers });
}
