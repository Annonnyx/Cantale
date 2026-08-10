import { env } from "@/server/env";
import { fetchDiscordUser } from "@/server/discord";
import {
  clearOAuthStateCookie,
  readOAuthStateCookie,
  setSessionCookie,
} from "@/server/session";

export const dynamic = "force-dynamic";

type TokenResponse = {
  access_token?: string;
  token_type?: string;
};

/** Échange le code d'autorisation contre un access token (Basic auth). */
async function exchangeCode(code: string, redirectUri: string): Promise<string | null> {
  const clientId = env.discordClientId;
  const clientSecret = env.discordClientSecret;
  if (!clientId || !clientSecret) return null;

  try {
    const res = await fetch("https://discord.com/api/v10/oauth2/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString("base64")}`,
      },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        code,
        redirect_uri: redirectUri,
      }),
      cache: "no-store",
    });
    if (!res.ok) return null;
    const data = (await res.json()) as TokenResponse;
    return data.access_token ?? null;
  } catch {
    return null;
  }
}

/** Callback OAuth2 : vérifie le state, identifie l'utilisateur, pose la session. */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const origin = env.authUrl ?? url.origin;
  const failure = (reason: string) =>
    Response.redirect(`${origin}/connexion?erreur=${encodeURIComponent(reason)}`, 302);

  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  if (!code || !state) return failure("oauth_invalide");

  const expectedState = await readOAuthStateCookie();
  await clearOAuthStateCookie();
  if (!expectedState || expectedState !== state) return failure("oauth_invalide");

  const accessToken = await exchangeCode(code, `${origin}/api/auth/discord/callback`);
  if (!accessToken) return failure("echange_impossible");

  const user = await fetchDiscordUser(accessToken);
  if (!user) return failure("profil_introuvable");

  await setSessionCookie(user);
  return Response.redirect(`${origin}/connexion`, 302);
}
