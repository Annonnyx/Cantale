import { cachedQuery, reactCache } from "../cache";
import { query } from "../db";
import { publicRankingExcludeSql } from "../public-ranking-exclusions";

/**
 * Table `players` du plugin CANTALE — lecture seule.
 * Tous les timestamps sont des unix secondes
 * (System.currentTimeMillis() / 1000 côté plugin).
 */
export type Player = {
  uuid: string;
  username: string;
  lives: number;
  balance: number;
  kills: number;
  deaths: number;
  killStreak: number;
  /** Dernière mort (unix secondes), 0 si jamais mort. */
  lastDeath: number;
  /** Temps de jeu cumulé, en secondes. */
  playtime: number;
  chatReactions: number;
  /** Première apparition (unix secondes) — 0 sur les comptes anciens. */
  createdAt: number;
};

type PlayerRow = {
  uuid: string;
  username: string;
  lives: number;
  balance: number;
  kills: number;
  deaths: number;
  kill_streak: number;
  last_death: number;
  playtime: number;
  chat_reactions: number;
  created_at: number;
};

const PLAYER_SELECT = [
  "uuid",
  "username",
  "lives",
  "balance",
  "kills",
  "deaths",
  "kill_streak",
  "last_death",
  "playtime",
  "chat_reactions",
  "created_at",
].join(", ");

/**
 * Whitelist stricte des colonnes triables — la valeur de tri ne vient
 * JAMAIS d'une entrée utilisateur, uniquement de cette table de correspondance.
 */
const SORTABLE_COLUMNS = {
  kills: "kills",
  deaths: "deaths",
  kill_streak: "kill_streak",
  balance: "balance",
  playtime: "playtime",
  chat_reactions: "chat_reactions",
  lives: "lives",
  created_at: "created_at",
} as const;

export type PlayerMetric = keyof typeof SORTABLE_COLUMNS;

function toPlayer(row: PlayerRow): Player {
  return {
    uuid: row.uuid,
    username: row.username,
    lives: Number(row.lives),
    balance: Number(row.balance),
    kills: Number(row.kills),
    deaths: Number(row.deaths),
    killStreak: Number(row.kill_streak),
    lastDeath: Number(row.last_death),
    playtime: Number(row.playtime),
    chatReactions: Number(row.chat_reactions),
    createdAt: Number(row.created_at),
  };
}

/** Entier borné, sûr à inliner dans un LIMIT (jamais d'entrée brute). */
function clampLimit(limit: number, fallback = 10, max = 100): number {
  if (!Number.isFinite(limit)) return fallback;
  return Math.max(1, Math.min(max, Math.floor(limit)));
}

const PLAYER_CACHE_TTL = 20;
const DEAD_PLAYERS_MAX = 400;

/** La collation MySQL par défaut rend la comparaison insensible à la casse. */
export const getPlayerByName = reactCache(async (username: string): Promise<Player | null> => {
  const key = username.trim();
  if (!key) return null;
  return cachedQuery(["player-by-name", key.toLowerCase()], PLAYER_CACHE_TTL, async () => {
    const rows = await query<PlayerRow>(
      `SELECT ${PLAYER_SELECT} FROM players WHERE username = :username LIMIT 1`,
      { username: key },
    );
    const row = rows[0];
    return row ? toPlayer(row) : null;
  });
});

export const getPlayerByUuid = reactCache(async (uuid: string): Promise<Player | null> => {
  const key = uuid.trim();
  if (!key) return null;
  return cachedQuery(["player-by-uuid", key.toLowerCase()], PLAYER_CACHE_TTL, async () => {
    const rows = await query<PlayerRow>(
      `SELECT ${PLAYER_SELECT} FROM players WHERE uuid = :uuid LIMIT 1`,
      { uuid: key },
    );
    const row = rows[0];
    return row ? toPlayer(row) : null;
  });
});

/**
 * Joueurs tombés à 0 vie — « La Liste », le mémorial des bannis.
 * Mêmes critères que PlayerDAO.getPermanentlyDeadPlayers côté plugin :
 * les plus récemment tombés d'abord. Plafond SQL : la recherche client
 * n'a pas besoin de tout l'historique.
 */
export async function getDeadPlayers(): Promise<Player[]> {
  return cachedQuery(["dead-players"], 45, async () => {
    const rows = await query<PlayerRow>(
      `SELECT ${PLAYER_SELECT} FROM players
       WHERE lives <= 0 AND last_death > 0
       ORDER BY last_death DESC
       LIMIT ${DEAD_PLAYERS_MAX}`,
    );
    return rows.map(toPlayer);
  });
}

/**
 * Classement des joueurs. `metric` est limité à SORTABLE_COLUMNS ;
 * `limit` est borné puis inliné comme entier validé.
 */
export async function getTopPlayers(metric: PlayerMetric, limit = 10): Promise<Player[]> {
  const column = SORTABLE_COLUMNS[metric];
  const safeLimit = clampLimit(limit);
  return cachedQuery(["top-players", metric, String(safeLimit)], 30, async () => {
    const rows = await query<PlayerRow>(
      `SELECT ${PLAYER_SELECT} FROM players
       WHERE ${publicRankingExcludeSql("username", "uuid")}
       ORDER BY ${column} DESC, username ASC LIMIT ${safeLimit}`,
    );
    return rows.map(toPlayer);
  });
}
