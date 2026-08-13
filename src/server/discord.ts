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

type GuildOwnerCache = { id: string | null; expiresAt: number };
let guildOwnerCache: GuildOwnerCache | null = null;
const GUILD_OWNER_TTL_MS = 5 * 60 * 1000;

/**
 * Owner Discord de la guilde CANTALE (`owner_id`), cache 5 min.
 * Échec API → dernière valeur connue, sinon null.
 */
export async function getGuildOwnerId(): Promise<string | null> {
  if (guildOwnerCache && guildOwnerCache.expiresAt > Date.now()) {
    return guildOwnerCache.id;
  }

  const token = env.discordBotToken;
  const guildId = env.discordGuildId;
  if (!token || !guildId) return guildOwnerCache?.id ?? null;

  try {
    const res = await fetch(`https://discord.com/api/v10/guilds/${guildId}`, {
      headers: { Authorization: `Bot ${token}` },
      cache: "no-store",
      signal: AbortSignal.timeout(3_000),
    });
    if (!res.ok) return guildOwnerCache?.id ?? null;
    const data = (await res.json()) as { owner_id?: string };
    const id =
      typeof data.owner_id === "string" && /^\d{5,32}$/.test(data.owner_id)
        ? data.owner_id
        : null;
    guildOwnerCache = { id, expiresAt: Date.now() + GUILD_OWNER_TTL_MS };
    return id;
  } catch {
    return guildOwnerCache?.id ?? null;
  }
}

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
      {
        headers: { Authorization: `Bot ${token}` },
        cache: "no-store",
        signal: AbortSignal.timeout(3_000),
      },
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
  /** Fondateur, co-fondateur, directeur, ou owner Discord de la guilde. */
  isDirection: boolean;
  /** Rôle Discord Admin (pas modo / support / builder). */
  isDiscordAdmin: boolean;
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
    isDiscordAdmin: has(env.discordRoleAdmin),
    isLeader: has(DISCORD_ROLES.leader),
    hasFaction: has(DISCORD_ROLES.hasFaction),
  };
}

export type GuildMemberSnapshot = {
  id: string;
  username: string;
  globalName: string | null;
  avatar: string | null;
  roles: string[];
};

type GuildMemberApi = {
  user?: DiscordApiUser;
  nick?: string | null;
  roles?: string[];
};

type GuildMembersCache = { members: GuildMemberSnapshot[]; expiresAt: number };

let guildMembersCache: GuildMembersCache | null = null;
const GUILD_MEMBERS_TTL_MS = 5 * 60_000;
const GUILD_MEMBERS_PAGE = 1000;
const GUILD_MEMBERS_MAX_PAGES = 10;

/**
 * Liste paginée des membres de la guilde (intent Privileged Server Members requis).
 * Cache 5 min ; échec / intent manquant → [] sans throw.
 */
export async function listGuildMembers(): Promise<GuildMemberSnapshot[]> {
  if (guildMembersCache && guildMembersCache.expiresAt > Date.now()) {
    return guildMembersCache.members;
  }

  const token = env.discordBotToken;
  const guildId = env.discordGuildId;
  if (!token || !guildId) return [];

  const members: GuildMemberSnapshot[] = [];
  let after: string | null = null;

  try {
    for (let page = 0; page < GUILD_MEMBERS_MAX_PAGES; page++) {
      const url = new URL(`https://discord.com/api/v10/guilds/${guildId}/members`);
      url.searchParams.set("limit", String(GUILD_MEMBERS_PAGE));
      if (after) url.searchParams.set("after", after);

      const res = await fetch(url, {
        headers: { Authorization: `Bot ${token}` },
        cache: "no-store",
        signal: AbortSignal.timeout(4_000),
      });
      if (!res.ok) {
        guildMembersCache = { members: [], expiresAt: Date.now() + GUILD_MEMBERS_TTL_MS };
        return [];
      }

      const batch = (await res.json()) as GuildMemberApi[];
      if (!Array.isArray(batch) || batch.length === 0) break;

      for (const entry of batch) {
        const user = entry.user;
        if (!user?.id || !user.username) continue;
        members.push({
          id: user.id,
          username: user.username,
          globalName: entry.nick ?? user.global_name ?? null,
          avatar: user.avatar ?? null,
          roles: Array.isArray(entry.roles) ? entry.roles : [],
        });
        after = user.id;
      }

      if (batch.length < GUILD_MEMBERS_PAGE) break;
    }
  } catch {
    guildMembersCache = { members: [], expiresAt: Date.now() + GUILD_MEMBERS_TTL_MS };
    return [];
  }

  guildMembersCache = { members, expiresAt: Date.now() + GUILD_MEMBERS_TTL_MS };
  return members;
}

/** Membres portant au moins un des rôles demandés. */
export async function listGuildMembersWithAnyRole(
  roleIds: readonly string[],
): Promise<GuildMemberSnapshot[]> {
  const wanted = new Set(roleIds.filter((id) => /^\d{5,32}$/.test(id)));
  if (wanted.size === 0) return [];
  const members = await listGuildMembers();
  return members.filter((member) => member.roles.some((role) => wanted.has(role)));
}
