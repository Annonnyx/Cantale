/**
 * Accès typé et paresseux aux variables d'environnement.
 * Jamais de throw au niveau module : le build Next ne doit pas exiger les secrets.
 */
export const env = {
  get databaseUrl(): string | null {
    return process.env.DATABASE_URL ?? null;
  },
  get discordClientId(): string | null {
    return process.env.DISCORD_CLIENT_ID ?? null;
  },
  get discordClientSecret(): string | null {
    return process.env.DISCORD_CLIENT_SECRET ?? null;
  },
  get discordBotToken(): string | null {
    return process.env.DISCORD_BOT_TOKEN ?? null;
  },
  get discordGuildId(): string | null {
    return process.env.DISCORD_GUILD_ID ?? null;
  },
  get authSecret(): string | null {
    return process.env.AUTH_SECRET ?? null;
  },
  /** Origine publique du site (ex. https://cantale.world) — base des URL de callback OAuth. */
  get authUrl(): string | null {
    return process.env.AUTH_URL ?? null;
  },
  get shopEnabled(): boolean {
    return process.env.SHOP_ENABLED === "true";
  },
  /**
   * Catégorie Discord dédiée aux tickets partenariats (optionnel).
   * Si absente, les tickets partenariats utilisent la catégorie support/tickets.
   */
  get discordPartnershipsCategoryId(): string | null {
    const value = process.env.DISCORD_PARTNERSHIPS_CATEGORY_ID?.trim();
    return value || null;
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
