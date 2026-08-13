/**
 * Accès typé et paresseux aux variables d'environnement.
 * Jamais de throw au niveau module : le build Next ne doit pas exiger les secrets.
 *
 * Lecture via index (`process.env[name]`) pour éviter l'inlining build-time
 * de Next quand la variable était absente au moment du `next build`.
 */
function readEnv(name: string): string | null {
  const value = process.env[name];
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

/** Origine publique sans slash final (évite `//api/...` dans les redirect_uri OAuth). */
function readOriginEnv(name: string): string | null {
  const value = readEnv(name);
  if (!value) return null;
  return value.replace(/\/+$/, "");
}

export type DatabaseConfig =
  | { mode: "uri"; uri: string }
  | {
      mode: "discrete";
      host: string;
      port: number;
      user: string;
      password: string;
      database: string;
    };

/**
 * Préfère les credentials discrets (DB_* / MYSQL_*) quand ils sont complets :
 * un mot de passe avec `@`, `=` ou `^` casse souvent une DATABASE_URL mal encodée.
 */
export function resolveDatabaseConfig(): DatabaseConfig | null {
  const host = readEnv("DB_HOST") ?? readEnv("MYSQL_HOST");
  const user = readEnv("DB_USER") ?? readEnv("MYSQL_USER");
  const password = readEnv("DB_PASSWORD") ?? readEnv("MYSQL_PASSWORD");
  const database = readEnv("DB_NAME") ?? readEnv("MYSQL_DATABASE") ?? readEnv("MYSQL_DB");
  const portRaw = readEnv("DB_PORT") ?? readEnv("MYSQL_PORT");

  if (host && user && password !== null && database) {
    const port = portRaw ? Number.parseInt(portRaw, 10) : 3306;
    return {
      mode: "discrete",
      host,
      port: Number.isFinite(port) && port > 0 ? port : 3306,
      user,
      password,
      database,
    };
  }

  const uri = readEnv("DATABASE_URL");
  if (uri) return { mode: "uri", uri };
  return null;
}

export const env = {
  get databaseUrl(): string | null {
    return readEnv("DATABASE_URL");
  },
  get discordClientId(): string | null {
    return readEnv("DISCORD_CLIENT_ID");
  },
  get discordClientSecret(): string | null {
    return readEnv("DISCORD_CLIENT_SECRET");
  },
  get discordBotToken(): string | null {
    return readEnv("DISCORD_BOT_TOKEN");
  },
  get discordGuildId(): string | null {
    return readEnv("DISCORD_GUILD_ID");
  },
  get authSecret(): string | null {
    return readEnv("AUTH_SECRET");
  },
  /**
   * Origine publique du site (ex. https://www.cantale.world) — base des URL de callback OAuth.
   * Doit correspondre exactement à une Redirect URI enregistrée sur le portail Discord,
   * et idéalement au domaine canonique (www) pour éviter un 307 apex→www pendant le callback.
   */
  get authUrl(): string | null {
    return readOriginEnv("AUTH_URL");
  },
  get shopEnabled(): boolean {
    return readEnv("SHOP_ENABLED") === "true";
  },
  /**
   * Catégorie Discord dédiée aux tickets partenariats (optionnel).
   * Si absente, les tickets partenariats utilisent la catégorie support/tickets.
   */
  get discordPartnershipsCategoryId(): string | null {
    return readEnv("DISCORD_PARTNERSHIPS_CATEGORY_ID");
  },
  /**
   * Discord IDs autorisés pour /admin et PASDIC carte.
   * Fusionne ADMIN_DISCORD_ID(S), OWNER_DISCORD_ID(S) et DIRECTION_DISCORD_ID(S)
   * (virgules, points-virgules ou espaces). Jamais hardcodé côté client.
   */
  get adminDiscordIds(): string[] {
    const seen = new Set<string>();
    const out: string[] = [];
    for (const name of [
      "ADMIN_DISCORD_ID",
      "ADMIN_DISCORD_IDS",
      "OWNER_DISCORD_ID",
      "OWNER_DISCORD_IDS",
      "DIRECTION_DISCORD_ID",
      "DIRECTION_DISCORD_IDS",
    ]) {
      for (const id of parseDiscordIdList(readEnv(name))) {
        if (seen.has(id)) continue;
        seen.add(id);
        out.push(id);
      }
    }
    return out;
  },
  /**
   * Overrides optionnels des IDs de rôles Équipe (sinon défauts `DISCORD_ROLES`).
   * Listing Discord : intent Privileged « Server Members » sur le bot.
   */
  get discordRoleAdmin(): string {
    return readDiscordSnowflake("DISCORD_ROLE_ADMIN") ?? DISCORD_ROLES.admin;
  },
  get discordRoleModo(): string | null {
    return readDiscordSnowflake("DISCORD_ROLE_MODO");
  },
  get discordRoleBuilder(): string {
    return readDiscordSnowflake("DISCORD_ROLE_BUILDER") ?? DISCORD_ROLES.builder;
  },
  get discordRoleDeveloppeur(): string {
    return readDiscordSnowflake("DISCORD_ROLE_DEVELOPPEUR") ?? DISCORD_ROLES.developpeur;
  },
  get discordRoleSupport(): string {
    return readDiscordSnowflake("DISCORD_ROLE_SUPPORT") ?? DISCORD_ROLES.support;
  },
  get discordRoleMonteur(): string {
    return readDiscordSnowflake("DISCORD_ROLE_MONTEUR") ?? DISCORD_ROLES.monteur;
  },
  get discordRoleGraphiste(): string {
    return readDiscordSnowflake("DISCORD_ROLE_GRAPHISTE") ?? DISCORD_ROLES.graphiste;
  },
  get discordRolePartenaire(): string {
    return readDiscordSnowflake("DISCORD_ROLE_PARTENAIRE") ?? DISCORD_ROLES.partenaire;
  },
  get discordRoleCreator(): string {
    return readDiscordSnowflake("DISCORD_ROLE_CREATOR") ?? DISCORD_ROLES.creator;
  },
};

function readDiscordSnowflake(name: string): string | null {
  const value = readEnv(name);
  if (!value) return null;
  return /^\d{5,32}$/.test(value) ? value : null;
}

function parseDiscordIdList(raw: string | null): string[] {
  if (!raw) return [];
  return raw
    .split(/[,;\s]+/)
    .map((id) => id.trim())
    .filter((id) => /^\d{5,32}$/.test(id));
}

/**
 * IDs de rôles Discord Cantale (guild).
 * Défauts stables pour tickets / Équipe ; overridables via `DISCORD_ROLE_*` quand exposé.
 */
export const DISCORD_ROLES = {
  fondateur: "1504907451789475991",
  coFondateur: "1504907619851047003",
  directeur: "1504907542554349618",
  developpeur: "1504907694148943893",
  admin: "1504907761069330494",
  support: "1504907938039599236",
  builder: "1504908080591409172",
  monteur: "1522198912335745075",
  graphiste: "1504907992439455984",
  partenaire: "1505140575760941238",
  creator: "1522211546766512258",
  leader: "1504910381586452621",
  hasFaction: "1504907203075903650",
} as const;

export const DISCORD_TICKET_CATEGORY = "1504899461401546954";
