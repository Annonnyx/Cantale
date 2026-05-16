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

import crypto from "crypto";
import { getDb } from "../db/db";
import { config } from "../config";

export interface LinkCode {
  id: number;
  code: string;
  player_uuid: string | null;
  player_name: string | null;
  created_at: number;
  expires_at: number;
  consumed_at: number | null;
}

const CODE_LENGTH = 6;

/** Génère un nouveau code numérique 6 chiffres en évitant les collisions. */
function generateCode(): string {
  const max = 10 ** CODE_LENGTH;
  const n = crypto.randomInt(0, max);
  return n.toString().padStart(CODE_LENGTH, "0");
}

/** Crée un nouveau link code en DB et retourne le code et son expiration. */
export async function createLinkCode(): Promise<{ code: string; expiresAt: number }> {
  const db = getDb();
  const now = Math.floor(Date.now() / 1000);
  const expiresAt = now + config.linkCode.ttlSeconds;

  // Quelques tentatives pour éviter une collision improbable
  for (let attempt = 0; attempt < 5; attempt++) {
    const code = generateCode();
    try {
      await db.execute(
        `INSERT INTO web_link_codes (code, player_uuid, player_name, created_at, expires_at)
         VALUES (?, NULL, NULL, ?, ?)`,
        [code, now, expiresAt]
      );
      return { code, expiresAt };
    } catch (err) {
      // UNIQUE constraint → retenter
      if ((err as Error).message.includes("UNIQUE") || (err as Error).message.includes("Duplicate")) {
        continue;
      }
      throw err;
    }
  }
  throw new Error("Impossible de générer un code unique après 5 tentatives");
}

/** Lit l'état d'un code (utilisé par le polling frontend). */
export async function getLinkCode(code: string): Promise<LinkCode | null> {
  const db = getDb();
  return await db.queryOne<LinkCode>(
    `SELECT id, code, player_uuid, player_name, created_at, expires_at, consumed_at
     FROM web_link_codes
     WHERE code = ?`,
    [code]
  );
}

/** Supprime les codes expirés. À appeler périodiquement (cron léger). */
export async function cleanupExpiredCodes(): Promise<number> {
  const db = getDb();
  const now = Math.floor(Date.now() / 1000);
  const r = await db.execute(`DELETE FROM web_link_codes WHERE expires_at < ?`, [now]);
  return r.affectedRows;
}
