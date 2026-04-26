/**
 * Starts the 42 OAuth Authorization Code flow using server-side Vercel env vars.
 */
export const config = { runtime: "edge" };

export default async function handler(request: Request): Promise<Response> {
  const url = new URL(request.url);
  const origin = url.origin;
  const clientId = process.env.FORTY_TWO_CLIENT_ID;

  if (!clientId) {
    return Response.redirect(`${origin}/#error=not_configured`, 302);
  }

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: `${origin}/api/auth/callback`,
    response_type: "code",
    scope: url.searchParams.get("scope") || "public",
  });

  return Response.redirect(`https://api.intra.42.fr/oauth/authorize?${params}`, 302);
}
