"use strict";
/**
 * Point d'entrée du backend Cantale.
 *
 * Lance :
 *   - Migrations DB (idempotent)
 *   - Express avec middleware (cors, cookie-parser, json)
 *   - Cron cleanup léger (codes & sessions expirés)
 *
 * Routes :
 *   /api/auth/*        → liaison in-game et sessions
 *   /api/players/*     → profils joueurs
 *   /api/factions/*    → liste & détails factions
 *   /api/leaderboards/*→ classements
 *   /api/shop/*        → catalogue et panier
 *   /api/health        → ping
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const config_1 = require("./config");
const migrations_1 = require("./db/migrations");
const db_1 = require("./db/db");
const codes_1 = require("./auth/codes");
const sessions_1 = require("./auth/sessions");
const routes_1 = __importDefault(require("./auth/routes"));
const players_1 = __importDefault(require("./routes/players"));
const factions_1 = __importDefault(require("./routes/factions"));
const leaderboards_1 = __importDefault(require("./routes/leaderboards"));
const shop_1 = __importDefault(require("./routes/shop"));
async function main() {
    await (0, migrations_1.runMigrations)();
    const app = (0, express_1.default)();
    // ─── Middlewares globaux ───
    app.set("trust proxy", 1); // nginx en front
    app.use(express_1.default.json({ limit: "100kb" }));
    app.use((0, cookie_parser_1.default)());
    app.use((0, cors_1.default)({
        origin: (origin, cb) => {
            if (!origin)
                return cb(null, true); // requêtes server-to-server
            if (config_1.config.cors.origins.includes(origin))
                return cb(null, true);
            return cb(new Error(`Origin not allowed: ${origin}`));
        },
        credentials: true,
    }));
    // Log basique
    app.use((req, _res, next) => {
        if (config_1.config.env !== "production") {
            console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl}`);
        }
        next();
    });
    // ─── Routes ───
    app.get("/api/health", (_req, res) => {
        res.json({ ok: true, env: config_1.config.env, shopEnabled: config_1.config.shop.enabled });
    });
    app.use("/api/auth", routes_1.default);
    app.use("/api/players", players_1.default);
    app.use("/api/factions", factions_1.default);
    app.use("/api/leaderboards", leaderboards_1.default);
    app.use("/api/shop", shop_1.default);
    // 404 JSON
    app.use("/api", (_req, res) => {
        res.status(404).json({ error: "Endpoint introuvable" });
    });
    // Error handler générique
    app.use((err, _req, res, _next) => {
        console.error("[error]", err);
        res.status(500).json({ error: "Erreur interne du serveur" });
    });
    // ─── Cron cleanup léger toutes les 5 minutes ───
    setInterval(async () => {
        try {
            const codes = await (0, codes_1.cleanupExpiredCodes)();
            const sessions = await (0, sessions_1.cleanupExpiredSessions)();
            if (codes > 0 || sessions > 0) {
                console.log(`[cron] Cleanup: ${codes} codes, ${sessions} sessions`);
            }
        }
        catch (err) {
            console.error("[cron] cleanup error:", err);
        }
    }, 5 * 60 * 1000);
    // ─── Shutdown propre ───
    const shutdown = async (signal) => {
        console.log(`\n[shutdown] Reçu ${signal}, fermeture propre...`);
        await (0, db_1.closeDb)();
        process.exit(0);
    };
    process.on("SIGINT", () => shutdown("SIGINT"));
    process.on("SIGTERM", () => shutdown("SIGTERM"));
    // ─── Démarrage ───
    app.listen(config_1.config.port, () => {
        console.log(`╭─ Cantale Backend ─────────────────────────╮`);
        console.log(`│ Port    : ${config_1.config.port.toString().padEnd(31)}│`);
        console.log(`│ Env     : ${config_1.config.env.padEnd(31)}│`);
        console.log(`│ DB      : ${config_1.config.db.type.padEnd(31)}│`);
        console.log(`│ Shop    : ${(config_1.config.shop.enabled ? "ON" : "OFF (consultation seule)").padEnd(31)}│`);
        console.log(`╰────────────────────────────────────────────╯`);
    });
}
main().catch((err) => {
    console.error("[fatal]", err);
    process.exit(1);
});
//# sourceMappingURL=server.js.map