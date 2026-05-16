/**
 * Repository LECTURE SEULE des tables du plugin Cantale.
 * Source de vérité : DB partagée (sqlite ou mysql).
 *
 * IMPORTANT : ne JAMAIS écrire dans ces tables depuis le backend.
 * Toute mutation passe par le plugin via les commandes Minecraft.
 */

import { getDb } from "../db/db";

export interface PlayerProfile {
  uuid: string;
  username: string;
  lives: number;
  balance: number;
  deaths: number;
  kills: number;
  kill_streak: number;
  last_death: number;
  tutorial_progress: number;
  created_at: number;
}

export interface PlayerExtended extends PlayerProfile {
  faction?: {
    id: number;
    name: string;
    tag: string;
    type: string;
    memberRank: string;
  };
  rank?: string;        // VIP / CHEVRE / NONE
  voteStats?: {
    total: number;
    streak: number;
    lastVoteAt: number;
  };
}

export async function getPlayerByUuid(uuid: string): Promise<PlayerProfile | null> {
  const db = getDb();
  return await db.queryOne<PlayerProfile>(
    `SELECT uuid, username, lives, balance, deaths, kills, kill_streak, last_death, tutorial_progress, created_at
     FROM players WHERE uuid = ?`,
    [uuid]
  );
}

export async function getPlayerByName(name: string): Promise<PlayerProfile | null> {
  const db = getDb();
  return await db.queryOne<PlayerProfile>(
    `SELECT uuid, username, lives, balance, deaths, kills, kill_streak, last_death, tutorial_progress, created_at
     FROM players WHERE username = ? COLLATE NOCASE`,
    [name]
  ).catch(async () => {
    // MySQL n'aime pas COLLATE NOCASE ; fallback case-insensitive
    return db.queryOne<PlayerProfile>(
      `SELECT uuid, username, lives, balance, deaths, kills, kill_streak, last_death, tutorial_progress, created_at
       FROM players WHERE LOWER(username) = LOWER(?)`,
      [name]
    );
  });
}

interface FactionMembership {
  faction_id: number;
  rank: string;
  name: string;
  tag: string;
  type: string;
}

export async function getPlayerFaction(uuid: string): Promise<FactionMembership | null> {
  const db = getDb();
  return await db.queryOne<FactionMembership>(
    `SELECT fm.faction_id, fm.rank, f.name, f.tag, f.type
     FROM faction_members fm
     INNER JOIN factions f ON f.id = fm.faction_id
     WHERE fm.player_uuid = ?`,
    [uuid]
  );
}

export async function getPlayerRank(uuid: string): Promise<string | null> {
  const db = getDb();
  const r = await db.queryOne<{ role: string }>(
    `SELECT role FROM player_permissions WHERE uuid = ?`,
    [uuid]
  );
  return r?.role ?? null;
}

export async function getPlayerVoteStats(uuid: string): Promise<{ total: number; streak: number; lastVoteAt: number } | null> {
  const db = getDb();
  const r = await db.queryOne<{ total_votes: number; streak_days: number; last_vote_at: number }>(
    `SELECT total_votes, streak_days, last_vote_at FROM vote_stats WHERE player_uuid = ?`,
    [uuid]
  );
  return r ? { total: r.total_votes, streak: r.streak_days, lastVoteAt: r.last_vote_at } : null;
}

/** Agrège le profil complet d'un joueur. */
export async function getPlayerExtended(uuid: string): Promise<PlayerExtended | null> {
  const base = await getPlayerByUuid(uuid);
  if (!base) return null;

  const [faction, rank, voteStats] = await Promise.all([
    getPlayerFaction(uuid),
    getPlayerRank(uuid),
    getPlayerVoteStats(uuid),
  ]);

  return {
    ...base,
    faction: faction ? {
      id: faction.faction_id,
      name: faction.name,
      tag: faction.tag,
      type: faction.type,
      memberRank: faction.rank,
    } : undefined,
    rank: rank ?? "NONE",
    voteStats: voteStats ?? undefined,
  };
}
