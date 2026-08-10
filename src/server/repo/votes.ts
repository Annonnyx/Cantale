import { query } from "../db";

/**
 * Tables `votes` (bruts, Votifier) et `vote_stats` (agrégats) — lecture seule.
 * Timestamps en unix secondes.
 */

/** Dernier vote enregistré d'un joueur sur un site donné. */
export type SiteVote = {
  site: string;
  tier: string | null;
  /** unix secondes. */
  votedAt: number;
};

/** Stats agrégées d'un joueur (table `vote_stats`). */
export type VoteStats = {
  playerUuid: string;
  playerName: string;
  totalVotes: number;
  streakDays: number;
  /** unix secondes. */
  lastVoteAt: number;
  monthlyVotes: number;
  /** Mois de référence au format YYYYMM (ex. 202608). */
  lastMonth: number;
};

type VoteRow = {
  site: string;
  tier: string | null;
  voted_at: number;
};

type VoteStatsRow = {
  player_uuid: string;
  player_name: string;
  total_votes: number;
  streak_days: number;
  last_vote_at: number;
  monthly_votes: number;
  last_month: number;
};

function toVoteStats(row: VoteStatsRow): VoteStats {
  return {
    playerUuid: row.player_uuid,
    playerName: row.player_name,
    totalVotes: Number(row.total_votes),
    streakDays: Number(row.streak_days),
    lastVoteAt: Number(row.last_vote_at),
    monthlyVotes: Number(row.monthly_votes),
    lastMonth: Number(row.last_month),
  };
}

/** Entier borné, sûr à inliner dans un LIMIT (jamais d'entrée brute). */
function clampLimit(limit: number, fallback = 10, max = 100): number {
  if (!Number.isFinite(limit)) return fallback;
  return Math.max(1, Math.min(max, Math.floor(limit)));
}

/**
 * Dernier vote par site pour un joueur — utile pour afficher les cooldowns
 * de vote sans exposer les adresses IP (colonne `address`, jamais lue ici).
 */
export async function getLastVotesBySite(playerUuid: string): Promise<SiteVote[]> {
  const rows = await query<VoteRow>(
    `SELECT v.site, v.tier, v.voted_at
     FROM votes v
     INNER JOIN (
       SELECT site, MAX(voted_at) AS max_voted_at
       FROM votes
       WHERE player_uuid = :playerUuid
       GROUP BY site
     ) latest ON latest.site = v.site AND latest.max_voted_at = v.voted_at
     WHERE v.player_uuid = :playerUuid
     ORDER BY v.voted_at DESC`,
    { playerUuid },
  );
  // Deux votes la même seconde sur un site produiraient un doublon : on déduplique.
  const seen = new Set<string>();
  const result: SiteVote[] = [];
  for (const row of rows) {
    if (seen.has(row.site)) continue;
    seen.add(row.site);
    result.push({ site: row.site, tier: row.tier, votedAt: Number(row.voted_at) });
  }
  return result;
}

export async function getVoteStats(playerUuid: string): Promise<VoteStats | null> {
  const rows = await query<VoteStatsRow>(
    `SELECT player_uuid, player_name, total_votes, streak_days, last_vote_at, monthly_votes, last_month
     FROM vote_stats
     WHERE player_uuid = :playerUuid
     LIMIT 1`,
    { playerUuid },
  );
  const row = rows[0];
  return row ? toVoteStats(row) : null;
}

/** Top voteurs lifetime — miroir de VoteDAO.getTopVoters côté plugin. */
export async function getTopVoters(limit = 10): Promise<VoteStats[]> {
  const safeLimit = clampLimit(limit);
  const rows = await query<VoteStatsRow>(
    `SELECT player_uuid, player_name, total_votes, streak_days, last_vote_at, monthly_votes, last_month
     FROM vote_stats
     ORDER BY total_votes DESC
     LIMIT ${safeLimit}`,
  );
  return rows.map(toVoteStats);
}

/** Nombre total de votes enregistrés, toutes périodes confondues. */
export async function getTotalVotes(): Promise<number> {
  const rows = await query<{ total: number }>("SELECT COUNT(*) AS total FROM votes");
  return Number(rows[0]?.total ?? 0);
}
