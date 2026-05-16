"use strict";
/**
 * Repository LECTURE des factions, claims, banques.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.listFactions = listFactions;
exports.getFaction = getFaction;
exports.getFactionByTag = getFactionByTag;
exports.getFactionMembers = getFactionMembers;
exports.getFactionClaims = getFactionClaims;
const db_1 = require("../db/db");
async function listFactions() {
    const db = (0, db_1.getDb)();
    return await db.query(`
    SELECT f.id, f.name, f.tag, f.description, f.leader_uuid, f.balance, f.power, f.type, f.created_at,
           (SELECT COUNT(*) FROM faction_members fm WHERE fm.faction_id = f.id) AS memberCount,
           (SELECT COUNT(*) FROM claims c            WHERE c.faction_id = f.id) AS claimCount
    FROM factions f
    WHERE COALESCE(f.secret_until, 0) < ?
    ORDER BY f.power DESC, memberCount DESC
  `, [Math.floor(Date.now() / 1000)]);
}
async function getFaction(id) {
    const db = (0, db_1.getDb)();
    return await db.queryOne(`
    SELECT f.id, f.name, f.tag, f.description, f.leader_uuid, f.balance, f.power, f.type, f.created_at,
           (SELECT COUNT(*) FROM faction_members fm WHERE fm.faction_id = f.id) AS memberCount,
           (SELECT COUNT(*) FROM claims c            WHERE c.faction_id = f.id) AS claimCount
    FROM factions f
    WHERE f.id = ?
  `, [id]);
}
async function getFactionByTag(tag) {
    const db = (0, db_1.getDb)();
    return await db.queryOne(`
    SELECT f.id, f.name, f.tag, f.description, f.leader_uuid, f.balance, f.power, f.type, f.created_at,
           (SELECT COUNT(*) FROM faction_members fm WHERE fm.faction_id = f.id) AS memberCount,
           (SELECT COUNT(*) FROM claims c            WHERE c.faction_id = f.id) AS claimCount
    FROM factions f
    WHERE LOWER(f.tag) = LOWER(?)
  `, [tag]);
}
async function getFactionMembers(factionId) {
    const db = (0, db_1.getDb)();
    return await db.query(`
    SELECT fm.player_uuid, fm.rank, fm.joined_at, p.username
    FROM faction_members fm
    LEFT JOIN players p ON p.uuid = fm.player_uuid
    WHERE fm.faction_id = ?
    ORDER BY
      CASE fm.rank
        WHEN 'LEADER'  THEN 0
        WHEN 'OFFICER' THEN 1
        WHEN 'MEMBER'  THEN 2
        WHEN 'RECRUIT' THEN 3
        ELSE 4
      END,
      fm.joined_at ASC
  `, [factionId]);
}
async function getFactionClaims(factionId) {
    const db = (0, db_1.getDb)();
    return await db.query(`
    SELECT world, chunk_x, chunk_z, pasdic FROM claims WHERE faction_id = ?
  `, [factionId]);
}
//# sourceMappingURL=factionRepo.js.map