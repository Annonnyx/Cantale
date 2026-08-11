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
  /** Origine publique du site (ex. https://cantale.world) — base des URL de callback OAuth. */
  get authUrl(): string | null {
    return readEnv("AUTH_URL");
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
};

export const DISCORD_ROLES = {
  fondateur: "1504907451789475991",
  coFondateur: "1504907619851047003",
  directeur: "1504907542554349618",
  leader: "1504910381586452621",
  hasFaction: "1504907203075903650",
} as const;

export const DISCORD_TICKET_CATEGORY = "1504899461401546954";
