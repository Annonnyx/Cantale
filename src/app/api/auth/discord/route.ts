import { env } from "@/server/env";
import { generateOAuthState, setOAuthStateCookie } from "@/server/session";

export const dynamic = "force-dynamic";

/** Point d'entrée OAuth2 : redirige vers l'autorisation Discord (scope identify). */
export async function GET(request: Request) {
  const clientId = env.discordClientId;
  if (!clientId) {
    return Response.json({ error: "Authentification non configurée." }, { status: 503 });
  }

  const origin = env.authUrl ?? new URL(request.url).origin;
  const redirectUri = `${origin}/api/auth/discord/callback`;
  const state = generateOAuthState();
  await setOAuthStateCookie(state);

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: "identify",
    state,
    prompt: "consent",
  });

  return Response.redirect(`https://discord.com/oauth2/authorize?${params.toString()}`, 302);
}
