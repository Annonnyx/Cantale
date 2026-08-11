import { env } from "@/server/env";
import { generateOAuthState, setOAuthStateCookie } from "@/server/session";

export const dynamic = "force-dynamic";

/** Point d'entrée OAuth2 : redirige vers l'autorisation Discord (scope identify). */
export async function GET(request: Request) {
  const clientId = env.discordClientId;
  const clientSecret = env.discordClientSecret;
  // Les deux sont requis : sans secret, Discord accepte l'authorize puis l'échange
  // de code échoue avec « echange_impossible » — mieux vaut échouer ici.
  if (!clientId || !clientSecret) {
    return Response.json(
      {
        error:
          "Authentification Discord non configurée (DISCORD_CLIENT_ID / DISCORD_CLIENT_SECRET).",
      },
      { status: 503 },
    );
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
