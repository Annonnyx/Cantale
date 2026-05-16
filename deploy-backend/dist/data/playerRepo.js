"use strict";
/**
 * Repository LECTURE SEULE des tables du plugin Cantale.
 * Source de vérité : DB partagée (sqlite ou mysql).
 *
 * IMPORTANT : ne JAMAIS écrire dans ces tables depuis le backend.
 * Toute mutation passe par le plugin via les commandes Minecraft.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.getPlayerByUuid = getPlayerByUuid;
exports.getPlayerByName = getPlayerByName;
exports.getPlayerFaction = getPlayerFaction;
exports.getPlayerRank = getPlayerRank;
exports.getPlayerVoteStats = getPlayerVoteStats;
exports.getPlayerExtended = getPlayerExtended;
const db_1 = require("../db/db");
async function getPlayerByUuid(uuid) {
    const db = (0, db_1.getDb)();
    return await db.queryOne(`SELECT uuid, username, lives, balance, deaths, kills, kill_streak, last_death, tutorial_progress, created_at
     FROM players WHERE uuid = ?`, [uuid]);
}
async function getPlayerByName(name) {
    const db = (0, db_1.getDb)();
    return await db.queryOne(`SELECT uuid, username, lives, balance, deaths, kills, kill_streak, last_death, tutorial_progress, created_at
     FROM players WHERE username = ? COLLATE NOCASE`, [name]).catch(async () => {
        // MySQL n'aime pas COLLATE NOCASE ; fallback case-insensitive
        return db.queryOne(`SELECT uuid, username, lives, balance, deaths, kills, kill_streak, last_death, tutorial_progress, created_at
       FROM players WHERE LOWER(username) = LOWER(?)`, [name]);
    });
}
async function getPlayerFaction(uuid) {
    const db = (0, db_1.getDb)();
    return await db.queryOne(`SELECT fm.faction_id, fm.rank, f.name, f.tag, f.type
     FROM faction_members fm
     INNER JOIN factions f ON f.id = fm.faction_id
     WHERE fm.player_uuid = ?`, [uuid]);
}
async function getPlayerRank(uuid) {
    const db = (0, db_1.getDb)();
    const r = await db.queryOne(`SELECT role FROM player_permissions WHERE uuid = ?`, [uuid]);
    return r?.role ?? null;
}
async function getPlayerVoteStats(uuid) {
    const db = (0, db_1.getDb)();
    const r = await db.queryOne(`SELECT total_votes, streak_days, last_vote_at FROM vote_stats WHERE player_uuid = ?`, [uuid]);
    return r ? { total: r.total_votes, streak: r.streak_days, lastVoteAt: r.last_vote_at } : null;
}
/** Agrège le profil complet d'un joueur. */
async function getPlayerExtended(uuid) {
    const base = await getPlayerByUuid(uuid);
    if (!base)
        return null;
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
//# sourceMappingURL=playerRepo.js.map