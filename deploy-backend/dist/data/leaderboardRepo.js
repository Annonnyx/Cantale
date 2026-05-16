"use strict";
/**
 * Repository LECTURE pour les leaderboards.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.getLeaderboard = getLeaderboard;
const db_1 = require("../db/db");
const LIMIT_MAX = 100;
async function getLeaderboard(type, limit = 10) {
    const db = (0, db_1.getDb)();
    const lim = Math.min(Math.max(limit, 1), LIMIT_MAX);
    let rows = [];
    switch (type) {
        case "kills":
            rows = await db.query(`SELECT uuid, username, kills AS value FROM players WHERE kills > 0 ORDER BY kills DESC LIMIT ?`, [lim]);
            break;
        case "deaths":
            rows = await db.query(`SELECT uuid, username, deaths AS value FROM players WHERE deaths > 0 ORDER BY deaths DESC LIMIT ?`, [lim]);
            break;
        case "balance":
            rows = await db.query(`SELECT uuid, username, balance AS value FROM players ORDER BY balance DESC LIMIT ?`, [lim]);
            break;
        case "kill_streak":
            rows = await db.query(`SELECT uuid, username, kill_streak AS value FROM players WHERE kill_streak > 0 ORDER BY kill_streak DESC LIMIT ?`, [lim]);
            break;
        case "votes":
            rows = await db.query(`SELECT player_uuid AS uuid, player_name AS username, total_votes AS value, CAST(streak_days AS TEXT) AS extra
         FROM vote_stats ORDER BY total_votes DESC LIMIT ?`, [lim]);
            break;
        case "factions":
            rows = await db.query(`SELECT f.tag AS uuid, f.name AS username, f.power AS value,
                CAST((SELECT COUNT(*) FROM faction_members fm WHERE fm.faction_id = f.id) AS TEXT) AS extra
         FROM factions f
         WHERE COALESCE(f.secret_until, 0) < ?
         ORDER BY f.power DESC LIMIT ?`, [Math.floor(Date.now() / 1000), lim]);
            break;
    }
    return rows.map((r, i) => ({
        rank: i + 1,
        uuid: r.uuid ?? "",
        username: r.username ?? "Inconnu",
        value: r.value,
        extra: r.extra,
    }));
}
//# sourceMappingURL=leaderboardRepo.js.map