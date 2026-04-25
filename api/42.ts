/**
 * Stable 42 API proxy endpoint.
 *
 * Vercel static deployments can fail to route nested dynamic function paths
 * like /api/42/cursus/21/users. The frontend calls this fixed endpoint and
 * passes the upstream 42 path in the path query parameter instead.
 */
export const config = { runtime: "edge" };

export default async function handler(request: Request): Promise<Response> {
  if (request.method === "OPTIONS") {
    return new Response(null, {
      headers: {
        "Access-Control-Allow-Origin":  "*",
        "Access-Control-Allow-Methods": "GET, OPTIONS",
        "Access-Control-Allow-Headers": "Authorization, Content-Type",
      },
    });
  }

  const url = new URL(request.url);
  const path = url.searchParams.get("path");
  url.searchParams.delete("path");

  if (!path?.startsWith("/")) {
    return Response.json({ error: "Missing or invalid 42 API path" }, { status: 400 });
  }

  const apiUrl = new URL(`https://api.intra.42.fr/v2${path}`);
  url.searchParams.forEach((value, key) => apiUrl.searchParams.set(key, value));

  const auth = request.headers.get("Authorization");
  if (!auth) {
    return Response.json({ error: "Missing Authorization header" }, { status: 401 });
  }

  let upstream: Response;
  try {
    upstream = await fetch(apiUrl.toString(), {
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

  for (const h of ["X-Total", "X-Page", "X-Per-Page", "X-Next-Page", "Link"]) {
    const v = upstream.headers.get(h);
    if (v) headers.set(h, v);
  }

  return new Response(body, { status: upstream.status, headers });
}
