import { env } from "@/server/env";
import { fetchDiscordUser } from "@/server/discord";
import {
  clearOAuthStateCookie,
  readOAuthStateCookie,
  setSessionCookie,
} from "@/server/session";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type TokenResponse = {
  access_token?: string;
  token_type?: string;
  error?: string;
  error_description?: string;
};

/** Échange le code d'autorisation contre un access token. */
async function exchangeCode(code: string, redirectUri: string): Promise<string | null> {
  const clientId = env.discordClientId;
  const clientSecret = env.discordClientSecret;
  if (!clientId || !clientSecret) {
    console.error("[auth/discord] missing DISCORD_CLIENT_ID or DISCORD_CLIENT_SECRET");
    return null;
  }

  try {
    // Credentials dans le body (forme documentée Discord) — Basic auth aussi accepté,
    // mais le body évite les pièges d'encodage sur certains secrets.
    const res = await fetch("https://discord.com/api/v10/oauth2/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        grant_type: "authorization_code",
        code,
        redirect_uri: redirectUri,
      }),
      cache: "no-store",
    });
    const raw = await res.text();
    let data: TokenResponse = {};
    try {
      data = raw ? (JSON.parse(raw) as TokenResponse) : {};
    } catch {
      data = {};
    }
    if (!res.ok) {
      const detail = data.error_description ?? data.error ?? raw.slice(0, 200);
      console.error(
        `[auth/discord] token exchange failed status=${res.status} redirect_uri=${redirectUri} detail=${detail}`,
      );
      return null;
    }
    return data.access_token ?? null;
  } catch (err) {
    console.error("[auth/discord] token exchange threw", err);
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
  if (!env.authSecret) {
    console.error("[auth/discord] AUTH_SECRET missing — session cookie not set");
  }
  return Response.redirect(`${origin}/connexion`, 302);
}
