"use strict";
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.getDb = getDb;
exports.closeDb = closeDb;
const config_1 = require("../config");
// ─────────────────────────────────────────────────────────────────
// Implémentation SQLite (better-sqlite3)
// ─────────────────────────────────────────────────────────────────
class SqliteConnection {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    db;
    constructor(path) {
        // Import dynamique car better-sqlite3 est natif
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const Database = require("better-sqlite3");
        this.db = new Database(path, { fileMustExist: false });
        // Optimisations identiques au plugin
        this.db.pragma("journal_mode = WAL");
        this.db.pragma("busy_timeout = 5000");
        this.db.pragma("synchronous = NORMAL");
    }
    async query(sql, params = []) {
        const stmt = this.db.prepare(sql);
        return stmt.all(...params);
    }
    async queryOne(sql, params = []) {
        const stmt = this.db.prepare(sql);
        const row = stmt.get(...params);
        return (row ?? null);
    }
    async execute(sql, params = []) {
        const stmt = this.db.prepare(sql);
        const info = stmt.run(...params);
        return {
            insertId: typeof info.lastInsertRowid === "bigint" ? Number(info.lastInsertRowid) : info.lastInsertRowid,
            affectedRows: info.changes,
        };
    }
    async exec(sql) {
        this.db.exec(sql);
    }
    async close() {
        this.db.close();
    }
}
// ─────────────────────────────────────────────────────────────────
// Implémentation MySQL (mysql2/promise pool)
// ─────────────────────────────────────────────────────────────────
class MysqlConnection {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    pool;
    constructor(opts) {
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
    async query(sql, params = []) {
        const [rows] = await this.pool.query(sql, params);
        return rows;
    }
    async queryOne(sql, params = []) {
        const [rows] = await this.pool.query(sql, params);
        const arr = rows;
        return arr.length > 0 ? arr[0] : null;
    }
    async execute(sql, params = []) {
        const [result] = await this.pool.execute(sql, params);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const r = result;
        return {
            insertId: r.insertId ?? undefined,
            affectedRows: r.affectedRows ?? 0,
        };
    }
    async exec(sql) {
        // mysql2 ne supporte qu'un statement par exec(), on split
        const statements = sql
            .split(";")
            .map((s) => s.trim())
            .filter((s) => s.length > 0);
        for (const stmt of statements) {
            await this.pool.query(stmt);
        }
    }
    async close() {
        await this.pool.end();
    }
}
// ─────────────────────────────────────────────────────────────────
// Singleton
// ─────────────────────────────────────────────────────────────────
let connection = null;
function getDb() {
    if (connection)
        return connection;
    if (config_1.config.db.type === "sqlite") {
        connection = new SqliteConnection(config_1.config.db.sqlitePath);
    }
    else {
        connection = new MysqlConnection(config_1.config.db.mysql);
    }
    return connection;
}
async function closeDb() {
    if (connection) {
        await connection.close();
        connection = null;
    }
}
//# sourceMappingURL=db.js.map