"use strict";
/**
 * Gestion des codes de liaison in-game.
 *
 * Flux :
 *  1. Frontend → POST /api/auth/request-link  → backend génère un code 6 chiffres,
 *     stocke {code, expires_at, player_uuid=NULL} en DB, renvoie le code.
 *  2. Frontend poll → GET /api/auth/check-link/:code → tant que player_uuid=NULL,
 *     renvoie "pending". Dès que consumed_at est rempli (par le plugin), renvoie
 *     {linked: true, name, uuid} et le backend crée une session + envoie le cookie.
 *  3. In-game : `/web link 123456` → le plugin appelle (directement en DB) :
 *     UPDATE web_link_codes SET player_uuid=?, player_name=?, consumed_at=NOW WHERE code=? AND expires_at>NOW.
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createLinkCode = createLinkCode;
exports.getLinkCode = getLinkCode;
exports.cleanupExpiredCodes = cleanupExpiredCodes;
const crypto_1 = __importDefault(require("crypto"));
const db_1 = require("../db/db");
const config_1 = require("../config");
const CODE_LENGTH = 6;
/** Génère un nouveau code numérique 6 chiffres en évitant les collisions. */
function generateCode() {
    const max = 10 ** CODE_LENGTH;
    const n = crypto_1.default.randomInt(0, max);
    return n.toString().padStart(CODE_LENGTH, "0");
}
/** Crée un nouveau link code en DB et retourne le code et son expiration. */
async function createLinkCode() {
    const db = (0, db_1.getDb)();
    const now = Math.floor(Date.now() / 1000);
    const expiresAt = now + config_1.config.linkCode.ttlSeconds;
    // Quelques tentatives pour éviter une collision improbable
    for (let attempt = 0; attempt < 5; attempt++) {
        const code = generateCode();
        try {
            await db.execute(`INSERT INTO web_link_codes (code, player_uuid, player_name, created_at, expires_at)
         VALUES (?, NULL, NULL, ?, ?)`, [code, now, expiresAt]);
            return { code, expiresAt };
        }
        catch (err) {
            // UNIQUE constraint → retenter
            if (err.message.includes("UNIQUE") || err.message.includes("Duplicate")) {
                continue;
            }
            throw err;
        }
    }
    throw new Error("Impossible de générer un code unique après 5 tentatives");
}
/** Lit l'état d'un code (utilisé par le polling frontend). */
async function getLinkCode(code) {
    const db = (0, db_1.getDb)();
    return await db.queryOne(`SELECT id, code, player_uuid, player_name, created_at, expires_at, consumed_at
     FROM web_link_codes
     WHERE code = ?`, [code]);
}
/** Supprime les codes expirés. À appeler périodiquement (cron léger). */
async function cleanupExpiredCodes() {
    const db = (0, db_1.getDb)();
    const now = Math.floor(Date.now() / 1000);
    const r = await db.execute(`DELETE FROM web_link_codes WHERE expires_at < ?`, [now]);
    return r.affectedRows;
}
//# sourceMappingURL=codes.js.map