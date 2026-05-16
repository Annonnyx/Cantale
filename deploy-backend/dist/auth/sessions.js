"use strict";
/**
 * Gestion des sessions web.
 *
 * Cookie HttpOnly + token aléatoire 32 bytes hex stocké en DB.
 * Validation à chaque requête authentifiée via middleware.
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createSession = createSession;
exports.getSession = getSession;
exports.deleteSession = deleteSession;
exports.cleanupExpiredSessions = cleanupExpiredSessions;
const crypto_1 = __importDefault(require("crypto"));
const db_1 = require("../db/db");
const config_1 = require("../config");
function generateToken() {
    return crypto_1.default.randomBytes(32).toString("hex");
}
/** Crée une nouvelle session et renvoie le token. */
async function createSession(opts) {
    const db = (0, db_1.getDb)();
    const now = Math.floor(Date.now() / 1000);
    const expiresAt = now + config_1.config.session.ttlSeconds;
    const token = generateToken();
    await db.execute(`INSERT INTO web_sessions (token, player_uuid, player_name, created_at, expires_at, last_seen_at, ip, user_agent)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`, [token, opts.playerUuid, opts.playerName, now, expiresAt, now, opts.ip ?? null, opts.userAgent ?? null]);
    return { token, expiresAt };
}
/** Récupère une session par token et la met à jour last_seen_at si valide. */
async function getSession(token) {
    const db = (0, db_1.getDb)();
    const now = Math.floor(Date.now() / 1000);
    const s = await db.queryOne(`SELECT id, token, player_uuid, player_name, created_at, expires_at, last_seen_at, ip, user_agent
     FROM web_sessions
     WHERE token = ? AND expires_at > ?`, [token, now]);
    if (!s)
        return null;
    // Update last_seen_at (fire-and-forget, non bloquant)
    db.execute(`UPDATE web_sessions SET last_seen_at = ? WHERE id = ?`, [now, s.id]).catch(() => { });
    return s;
}
/** Invalide une session (logout). */
async function deleteSession(token) {
    const db = (0, db_1.getDb)();
    await db.execute(`DELETE FROM web_sessions WHERE token = ?`, [token]);
}
/** Supprime toutes les sessions expirées. À appeler périodiquement. */
async function cleanupExpiredSessions() {
    const db = (0, db_1.getDb)();
    const now = Math.floor(Date.now() / 1000);
    const r = await db.execute(`DELETE FROM web_sessions WHERE expires_at < ?`, [now]);
    return r.affectedRows;
}
//# sourceMappingURL=sessions.js.map