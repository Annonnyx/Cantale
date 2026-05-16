/**
 * Gestion des sessions web.
 *
 * Cookie HttpOnly + token aléatoire 32 bytes hex stocké en DB.
 * Validation à chaque requête authentifiée via middleware.
 */

import crypto from "crypto";
import { getDb } from "../db/db";
import { config } from "../config";

export interface Session {
  id: number;
  token: string;
  player_uuid: string;
  player_name: string;
  created_at: number;
  expires_at: number;
  last_seen_at: number;
  ip: string | null;
  user_agent: string | null;
}

function generateToken(): string {
  return crypto.randomBytes(32).toString("hex");
}

/** Crée une nouvelle session et renvoie le token. */
export async function createSession(opts: {
  playerUuid: string;
  playerName: string;
  ip?: string | null;
  userAgent?: string | null;
}): Promise<{ token: string; expiresAt: number }> {
  const db = getDb();
  const now = Math.floor(Date.now() / 1000);
  const expiresAt = now + config.session.ttlSeconds;
  const token = generateToken();

  await db.execute(
    `INSERT INTO web_sessions (token, player_uuid, player_name, created_at, expires_at, last_seen_at, ip, user_agent)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [token, opts.playerUuid, opts.playerName, now, expiresAt, now, opts.ip ?? null, opts.userAgent ?? null]
  );

  return { token, expiresAt };
}

/** Récupère une session par token et la met à jour last_seen_at si valide. */
export async function getSession(token: string): Promise<Session | null> {
  const db = getDb();
  const now = Math.floor(Date.now() / 1000);

  const s = await db.queryOne<Session>(
    `SELECT id, token, player_uuid, player_name, created_at, expires_at, last_seen_at, ip, user_agent
     FROM web_sessions
     WHERE token = ? AND expires_at > ?`,
    [token, now]
  );
  if (!s) return null;

  // Update last_seen_at (fire-and-forget, non bloquant)
  db.execute(`UPDATE web_sessions SET last_seen_at = ? WHERE id = ?`, [now, s.id]).catch(() => {});
  return s;
}

/** Invalide une session (logout). */
export async function deleteSession(token: string): Promise<void> {
  const db = getDb();
  await db.execute(`DELETE FROM web_sessions WHERE token = ?`, [token]);
}

/** Supprime toutes les sessions expirées. À appeler périodiquement. */
export async function cleanupExpiredSessions(): Promise<number> {
  const db = getDb();
  const now = Math.floor(Date.now() / 1000);
  const r = await db.execute(`DELETE FROM web_sessions WHERE expires_at < ?`, [now]);
  return r.affectedRows;
}
