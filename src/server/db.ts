import mysql from "mysql2/promise";
import { resolveDatabaseConfig } from "./env";

let pool: mysql.Pool | null = null;

function getPool(): mysql.Pool {
  if (!pool) {
    const config = resolveDatabaseConfig();
    if (!config) {
      throw new Error(
        "Base de données non configurée : définir DATABASE_URL, ou DB_HOST + DB_USER + DB_PASSWORD + DB_NAME",
      );
    }

    const shared = {
      connectionLimit: 5,
      namedPlaceholders: true,
      supportBigNumbers: true,
    } as const;

    pool =
      config.mode === "uri"
        ? mysql.createPool({ uri: config.uri, ...shared })
        : mysql.createPool({
            host: config.host,
            port: config.port,
            user: config.user,
            password: config.password,
            database: config.database,
            ...shared,
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
