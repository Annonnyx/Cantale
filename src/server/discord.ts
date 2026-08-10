import { env, DISCORD_ROLES } from "./env";

/**
 * Client minimal de l'API Discord v10 (bot).
 * Toute défaillance se résout en valeurs vides — jamais d'exception vers la page.
 */

export type DiscordUser = {
  id: string;
  username: string;
  /** Nom d'affichage Discord, null si non défini. */
  globalName: string | null;
  /** Hash d'avatar, null si avatar par défaut. */
  avatar: string | null;
};

type DiscordApiUser = {
  id: string;
  username: string;
  global_name?: string | null;
  avatar?: string | null;
};

/** Profil Discord de l'utilisateur authentifié (scope identify). */
export async function fetchDiscordUser(accessToken: string): Promise<DiscordUser | null> {
  try {
    const res = await fetch("https://discord.com/api/v10/users/@me", {
      headers: { Authorization: `Bearer ${accessToken}` },
      cache: "no-store",
    });
    if (!res.ok) return null;
    const data = (await res.json()) as DiscordApiUser;
    if (!data.id || !data.username) return null;
    return {
      id: data.id,
      username: data.username,
      globalName: data.global_name ?? null,
      avatar: data.avatar ?? null,
    };
  } catch {
    return null;
  }
}

/** URL CDN de l'avatar Discord (avatar par défaut calculé depuis l'id). */
export function discordAvatarUrl(user: DiscordUser, size = 128): string {
  if (user.avatar) {
    return `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png?size=${size}`;
  }
  const index = Number(BigInt(user.id) >> BigInt(22)) % 6;
  return `https://cdn.discordapp.com/embed/avatars/${index}.png`;
}

type RolesCacheEntry = { roles: string[]; expiresAt: number };

const rolesCache = new Map<string, RolesCacheEntry>();
const ROLES_CACHE_TTL_MS = 60_000;

/**
 * Rôles du membre sur la guilde CANTALE, via le token bot.
 * Cache mémoire 60 s par utilisateur ; en cas d'échec (API down, membre
 * absent, config manquante) renvoie [] sans propager d'erreur.
 */
export async function getGuildMemberRoles(discordUserId: string): Promise<string[]> {
  const cached = rolesCache.get(discordUserId);
  if (cached && cached.expiresAt > Date.now()) return cached.roles;

  const token = env.discordBotToken;
  const guildId = env.discordGuildId;
  if (!token || !guildId) return [];

  let roles: string[] = [];
  try {
    const res = await fetch(
      `https://discord.com/api/v10/guilds/${guildId}/members/${discordUserId}`,
      { headers: { Authorization: `Bot ${token}` }, cache: "no-store" },
    );
    if (res.ok) {
      const data = (await res.json()) as { roles?: string[] };
      roles = Array.isArray(data.roles) ? data.roles : [];
    }
  } catch {
    roles = [];
  }

  rolesCache.set(discordUserId, { roles, expiresAt: Date.now() + ROLES_CACHE_TTL_MS });
  return roles;
}

export type DiscordCapabilities = {
  /** Fondateur, co-fondateur ou directeur. */
  isDirection: boolean;
  /** Rôle leader de faction. */
  isLeader: boolean;
  /** Rôle « a une faction ». */
  hasFaction: boolean;
};

/** Traduit les rôles Discord en capacités métier du site. */
export function mapDiscordCapabilities(roles: readonly string[]): DiscordCapabilities {
  const has = (roleId: string) => roles.includes(roleId);
  return {
    isDirection:
      has(DISCORD_ROLES.fondateur) || has(DISCORD_ROLES.coFondateur) || has(DISCORD_ROLES.directeur),
    isLeader: has(DISCORD_ROLES.leader),
    hasFaction: has(DISCORD_ROLES.hasFaction),
  };
}
