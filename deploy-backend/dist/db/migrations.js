"use strict";
/**
 * Migrations des tables web_* propres au backend.
 *
 * Idempotent : peut être exécuté à chaque démarrage du serveur.
 * Ne touche PAS aux tables du plugin (players, factions, etc.) — read-only de notre côté.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.runMigrations = runMigrations;
const db_1 = require("./db");
const config_1 = require("../config");
async function runMigrations() {
    const db = (0, db_1.getDb)();
    const isSqlite = config_1.config.db.type === "sqlite";
    const auto = isSqlite ? "INTEGER PRIMARY KEY AUTOINCREMENT" : "INT AUTO_INCREMENT PRIMARY KEY";
    const ts = isSqlite ? "INTEGER" : "BIGINT";
    // Codes de liaison in-game (court terme)
    await db.exec(`
    CREATE TABLE IF NOT EXISTS web_link_codes (
      id ${auto},
      code TEXT NOT NULL UNIQUE,
      player_uuid TEXT,
      player_name TEXT,
      created_at ${ts} NOT NULL,
      expires_at ${ts} NOT NULL,
      consumed_at ${ts}
    )
  `);
    // Sessions web (cookies)
    await db.exec(`
    CREATE TABLE IF NOT EXISTS web_sessions (
      id ${auto},
      token TEXT NOT NULL UNIQUE,
      player_uuid TEXT NOT NULL,
      player_name TEXT NOT NULL,
      created_at ${ts} NOT NULL,
      expires_at ${ts} NOT NULL,
      last_seen_at ${ts} NOT NULL,
      ip TEXT,
      user_agent TEXT
    )
  `);
    // Paniers de boutique (1 entrée par joueur × item)
    await db.exec(`
    CREATE TABLE IF NOT EXISTS web_cart_items (
      id ${auto},
      player_uuid TEXT NOT NULL,
      item_id TEXT NOT NULL,
      quantity INTEGER NOT NULL DEFAULT 1,
      added_at ${ts} NOT NULL
    )
  `);
    // Index utiles (idempotents)
    await db.exec(`CREATE INDEX IF NOT EXISTS idx_web_sessions_token ON web_sessions(token)`);
    await db.exec(`CREATE INDEX IF NOT EXISTS idx_web_sessions_uuid  ON web_sessions(player_uuid)`);
    await db.exec(`CREATE INDEX IF NOT EXISTS idx_web_link_code      ON web_link_codes(code)`);
    await db.exec(`CREATE INDEX IF NOT EXISTS idx_web_cart_player    ON web_cart_items(player_uuid)`);
    console.log("[DB] Migrations web_* exécutées avec succès.");
}
//# sourceMappingURL=migrations.js.map