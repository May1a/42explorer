/**
 * Vercel Edge Function — OAuth Authorization Code token exchange.
 *
 * 42's API does not support the implicit flow, so the client secret
 * must live server-side.  This tiny function:
 *   1. Receives the ?code= from 42's OAuth redirect
 *   2. POSTs to 42's token endpoint (with the secret)
 *   3. Redirects the browser back to the SPA with the token in the URL fragment
 *      so AuthContext.tsx can pick it up exactly as before.
 */
export const config = { runtime: "edge" };

export default async function handler(request: Request): Promise<Response> {
  const url    = new URL(request.url);
  const code   = url.searchParams.get("code");
  const error  = url.searchParams.get("error");
  const origin = url.origin;

  if (error || !code) {
    return Response.redirect(`${origin}/#error=auth_failed`, 302);
  }

  const CLIENT_ID     = process.env.FORTY_TWO_CLIENT_ID;
  const CLIENT_SECRET = process.env.FORTY_TWO_CLIENT_SECRET;

  if (!CLIENT_ID || !CLIENT_SECRET) {
    return Response.redirect(`${origin}/#error=not_configured`, 302);
  }

  const redirectUri = `${origin}/api/auth/callback`;

  let tokenRes: Response;
  try {
    tokenRes = await fetch("https://api.intra.42.fr/oauth/token", {
      method:  "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body:    new URLSearchParams({
        grant_type:    "authorization_code",
        client_id:     CLIENT_ID,
        client_secret: CLIENT_SECRET,
        code,
        redirect_uri:  redirectUri,
      }).toString(),
    });
  } catch (e: any) {
    console.error("Token exchange network error:", e?.message);
    return Response.redirect(`${origin}/#error=token_failed`, 302);
  }

  if (!tokenRes.ok) {
    const detail = await tokenRes.text().catch(() => "");
    console.error("Token exchange failed:", tokenRes.status, detail);
    return Response.redirect(`${origin}/#error=token_failed`, 302);
  }

  let data: { access_token: string; expires_in: number; scope?: string };
  try {
    data = await tokenRes.json() as typeof data;
  } catch {
    return Response.redirect(`${origin}/#error=token_failed`, 302);
  }

  // Build fragment with token, expiry, and scope so AuthContext can pick it up
  const params = new URLSearchParams();
  params.set("access_token", data.access_token);
  params.set("expires_in",    String(data.expires_in));
  if (data.scope) params.set("scope", data.scope);

  return Response.redirect(`${origin}/#${params.toString()}`, 302);
}
