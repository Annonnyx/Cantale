import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { env } from "./env";
import {
  getGuildMemberRoles,
  mapDiscordCapabilities,
  type DiscordCapabilities,
  type DiscordUser,
} from "./discord";
import { getMinecraftLinkByDiscordId } from "./repo/discord-links";

/**
 * Session maison : cookie httpOnly signé en HMAC-SHA256 (AUTH_SECRET).
 * Pas de dépendance externe — le payload ne contient que le profil Discord
 * public (scope identify), jamais de token d'accès.
 */

export const SESSION_COOKIE = "cantale_session";
export const OAUTH_STATE_COOKIE = "cantale_oauth_state";

/** Durée de session : 30 jours. */
const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000;
/** Durée de vie du state anti-CSRF OAuth : 10 minutes. */
const OAUTH_STATE_TTL_MS = 10 * 60 * 1000;

type SessionPayload = {
  user: DiscordUser;
  /** Expiration en millisecondes epoch. */
  exp: number;
};

function base64Url(input: Buffer | string): string {
  return Buffer.from(input).toString("base64url");
}

function sign(value: string, secret: string): string {
  return createHmac("sha256", secret).update(value).digest("base64url");
}

/** Sérialise et signe le payload de session. */
export function encodeSession(user: DiscordUser): string | null {
  const secret = env.authSecret;
  if (!secret) return null;
  const payload: SessionPayload = { user, exp: Date.now() + SESSION_TTL_MS };
  const body = base64Url(JSON.stringify(payload));
  return `${body}.${sign(body, secret)}`;
}

/** Vérifie la signature et l'expiration du cookie de session. */
export function decodeSession(value: string | undefined | null): DiscordUser | null {
  const secret = env.authSecret;
  if (!secret || !value) return null;
  const dot = value.lastIndexOf(".");
  if (dot <= 0) return null;
  const body = value.slice(0, dot);
  const signature = value.slice(dot + 1);
  const expected = sign(body, secret);
  const a = Buffer.from(signature);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  try {
    const payload = JSON.parse(Buffer.from(body, "base64url").toString()) as SessionPayload;
    if (!payload.user?.id || typeof payload.exp !== "number" || payload.exp < Date.now()) {
      return null;
    }
    return payload.user;
  } catch {
    return null;
  }
}

/** Options communes des cookies d'auth. */
function cookieOptions(maxAgeMs: number) {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: Math.floor(maxAgeMs / 1000),
  };
}

export async function setSessionCookie(user: DiscordUser): Promise<void> {
  const encoded = encodeSession(user);
  if (!encoded) return;
  (await cookies()).set(SESSION_COOKIE, encoded, cookieOptions(SESSION_TTL_MS));
}

export async function clearSessionCookie(): Promise<void> {
  (await cookies()).set(SESSION_COOKIE, "", cookieOptions(0));
}

export function generateOAuthState(): string {
  return randomBytes(24).toString("base64url");
}

export async function setOAuthStateCookie(state: string): Promise<void> {
  (await cookies()).set(OAUTH_STATE_COOKIE, state, cookieOptions(OAUTH_STATE_TTL_MS));
}

export async function readOAuthStateCookie(): Promise<string | null> {
  return (await cookies()).get(OAUTH_STATE_COOKIE)?.value ?? null;
}

export async function clearOAuthStateCookie(): Promise<void> {
  (await cookies()).set(OAUTH_STATE_COOKIE, "", cookieOptions(0));
}

export type SessionData = { user: DiscordUser };

/** Session brute (profil Discord) ou null si visiteur anonyme. */
export async function getSession(): Promise<SessionData | null> {
  const value = (await cookies()).get(SESSION_COOKIE)?.value;
  const user = decodeSession(value);
  return user ? { user } : null;
}

export type SessionTier = "anonymous" | "discord" | "linked" | "leader";

export type SessionUser = {
  tier: SessionTier;
  discordUser: DiscordUser | null;
  /** Compte Minecraft lié, si la liaison existe en base. */
  mc: { uuid: string; username: string | null } | null;
  capabilities: DiscordCapabilities;
};

const NO_CAPABILITIES: DiscordCapabilities = {
  isDirection: false,
  isLeader: false,
  hasFaction: false,
};

/**
 * Utilisateur courant avec son palier d'accès :
 * anonymous → discord (connecté) → linked (compte MC lié) → leader (rôle leader).
 */
export async function getSessionUser(): Promise<SessionUser> {
  const session = await getSession();
  if (!session) {
    return { tier: "anonymous", discordUser: null, mc: null, capabilities: NO_CAPABILITIES };
  }

  const [link, roles] = await Promise.all([
    getMinecraftLinkByDiscordId(session.user.id).catch(() => null),
    getGuildMemberRoles(session.user.id),
  ]);
  const capabilities = mapDiscordCapabilities(roles);
  const mc = link ? { uuid: link.uuid, username: link.username } : null;

  const tier: SessionTier = !mc ? "discord" : capabilities.isLeader ? "leader" : "linked";
  return { tier, discordUser: session.user, mc, capabilities };
}

export type AuthCheck =
  | { ok: true; user: SessionUser }
  | { ok: false; response: Response };

function jsonError(status: number, error: string): Response {
  return Response.json({ error }, { status });
}

/** Garde API : exige un compte Discord connecté ET lié à Minecraft. */
export async function requireLinked(): Promise<AuthCheck> {
  const user = await getSessionUser();
  if (user.tier === "anonymous") {
    return { ok: false, response: jsonError(401, "Connexion Discord requise.") };
  }
  if (!user.mc) {
    return { ok: false, response: jsonError(403, "Compte Minecraft non lié.") };
  }
  return { ok: true, user };
}

/** Garde API : exige le palier leader (compte lié + rôle leader Discord). */
export async function requireLeader(): Promise<AuthCheck> {
  const check = await requireLinked();
  if (!check.ok) return check;
  if (check.user.tier !== "leader") {
    return { ok: false, response: jsonError(403, "Rôle leader requis.") };
  }
  return check;
}

/** Garde API / page : Discord ID présent dans ADMIN_DISCORD_ID (env Vercel). */
export async function requireSiteAdmin(): Promise<AuthCheck> {
  const user = await getSessionUser();
  if (user.tier === "anonymous" || !user.discordUser) {
    return { ok: false, response: jsonError(401, "Connexion Discord requise.") };
  }
  const allowed = env.adminDiscordIds;
  if (allowed.length === 0) {
    return { ok: false, response: jsonError(503, "ADMIN_DISCORD_ID non configuré.") };
  }
  if (!allowed.includes(user.discordUser.id)) {
    return { ok: false, response: jsonError(403, "Accès admin refusé.") };
  }
  return { ok: true, user };
}
