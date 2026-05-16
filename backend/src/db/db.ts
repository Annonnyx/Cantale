/**
 * Abstraction DB partagée pour SQLite (better-sqlite3) et MySQL (mysql2/promise).
 *
 * Toutes les méthodes retournent des Promises pour uniformiser l'API.
 * SQLite est en réalité synchrone mais wrappé pour cohérence.
 *
 * IMPORTANT : Le plugin Cantale écrit dans cette même DB.
 * Le backend lit la majorité (factions, claims, vies, balance, etc.) et écrit
 * UNIQUEMENT dans les tables web_* (gérées ici).
 */

import { config } from "../config";

export interface DbConnection {
  query<T = unknown>(sql: string, params?: unknown[]): Promise<T[]>;
  queryOne<T = unknown>(sql: string, params?: unknown[]): Promise<T | null>;
  execute(sql: string, params?: unknown[]): Promise<{ insertId?: number; affectedRows: number }>;
  /** Exécute plusieurs statements SQL (ex: création de tables). */
  exec(sql: string): Promise<void>;
  close(): Promise<void>;
}

// ─────────────────────────────────────────────────────────────────
// Implémentation SQLite (better-sqlite3)
// ─────────────────────────────────────────────────────────────────
class SqliteConnection implements DbConnection {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private readonly db: any;

  constructor(path: string) {
    // Import dynamique car better-sqlite3 est natif
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const Database = require("better-sqlite3");
    this.db = new Database(path, { fileMustExist: false });
    // Optimisations identiques au plugin
    this.db.pragma("journal_mode = WAL");
    this.db.pragma("busy_timeout = 5000");
    this.db.pragma("synchronous = NORMAL");
  }

  async query<T>(sql: string, params: unknown[] = []): Promise<T[]> {
    const stmt = this.db.prepare(sql);
    return stmt.all(...params) as T[];
  }

  async queryOne<T>(sql: string, params: unknown[] = []): Promise<T | null> {
    const stmt = this.db.prepare(sql);
    const row = stmt.get(...params);
    return (row ?? null) as T | null;
  }

  async execute(sql: string, params: unknown[] = []): Promise<{ insertId?: number; affectedRows: number }> {
    const stmt = this.db.prepare(sql);
    const info = stmt.run(...params);
    return {
      insertId: typeof info.lastInsertRowid === "bigint" ? Number(info.lastInsertRowid) : info.lastInsertRowid,
      affectedRows: info.changes,
    };
  }

  async exec(sql: string): Promise<void> {
    this.db.exec(sql);
  }

  async close(): Promise<void> {
    this.db.close();
  }
}

// ─────────────────────────────────────────────────────────────────
// Implémentation MySQL (mysql2/promise pool)
// ─────────────────────────────────────────────────────────────────
class MysqlConnection implements DbConnection {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private readonly pool: any;

  constructor(opts: { host: string; port: number; user: string; password: string; database: string }) {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const mysql = require("mysql2/promise");
    this.pool = mysql.createPool({
      host: opts.host,
      port: opts.port,
      user: opts.user,
      password: opts.password,
      database: opts.database,
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
      namedPlaceholders: false,
      dateStrings: false,
    });
  }

  async query<T>(sql: string, params: unknown[] = []): Promise<T[]> {
    const [rows] = await this.pool.query(sql, params);
    return rows as T[];
  }

  async queryOne<T>(sql: string, params: unknown[] = []): Promise<T | null> {
    const [rows] = await this.pool.query(sql, params);
    const arr = rows as T[];
    return arr.length > 0 ? arr[0] : null;
  }

  async execute(sql: string, params: unknown[] = []): Promise<{ insertId?: number; affectedRows: number }> {
    const [result] = await this.pool.execute(sql, params);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const r = result as any;
    return {
      insertId: r.insertId ?? undefined,
      affectedRows: r.affectedRows ?? 0,
    };
  }

  async exec(sql: string): Promise<void> {
    // mysql2 ne supporte qu'un statement par exec(), on split
    const statements = sql
      .split(";")
      .map((s) => s.trim())
      .filter((s) => s.length > 0);
    for (const stmt of statements) {
      await this.pool.query(stmt);
    }
  }

  async close(): Promise<void> {
    await this.pool.end();
  }
}

// ─────────────────────────────────────────────────────────────────
// Singleton
// ─────────────────────────────────────────────────────────────────
let connection: DbConnection | null = null;

export function getDb(): DbConnection {
  if (connection) return connection;
  if (config.db.type === "sqlite") {
    connection = new SqliteConnection(config.db.sqlitePath);
  } else {
    connection = new MysqlConnection(config.db.mysql);
  }
  return connection;
}

export async function closeDb(): Promise<void> {
  if (connection) {
    await connection.close();
    connection = null;
  }
}
