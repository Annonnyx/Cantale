import mysql from "mysql2/promise";
import { env } from "./env";

let pool: mysql.Pool | null = null;

function getPool(): mysql.Pool {
  if (!pool) {
    const url = env.databaseUrl;
    if (!url) throw new Error("DATABASE_URL manquante");
    pool = mysql.createPool({
      uri: url,
      connectionLimit: 5,
      namedPlaceholders: true,
      supportBigNumbers: true,
    });
  }
  return pool;
}

export type SqlValue = string | number | bigint | boolean | Date | null;

/**
 * Lecture seule sur les tables du plugin.
 * Règle d'or : toute requête touchant factions/claims exclut
 * `secret_until > NOW()` au niveau SQL — jamais côté client.
 */
export async function query<T>(sql: string, params: Record<string, SqlValue> = {}): Promise<T[]> {
  const [rows] = await getPool().execute(sql, params);
  return rows as T[];
}
