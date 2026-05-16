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

import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import cookieParser from "cookie-parser";

import { config } from "./config";
import { runMigrations } from "./db/migrations";
import { closeDb } from "./db/db";
import { cleanupExpiredCodes } from "./auth/codes";
import { cleanupExpiredSessions } from "./auth/sessions";

import authRoutes from "./auth/routes";
import playersRoutes from "./routes/players";
import factionsRoutes from "./routes/factions";
import leaderboardsRoutes from "./routes/leaderboards";
import shopRoutes from "./routes/shop";

async function main(): Promise<void> {
  await runMigrations();

  const app = express();

  // ─── Middlewares globaux ───
  app.set("trust proxy", 1); // nginx en front
  app.use(express.json({ limit: "100kb" }));
  app.use(cookieParser());
  app.use(cors({
    origin: (origin, cb) => {
      if (!origin) return cb(null, true); // requêtes server-to-server
      if (config.cors.origins.includes(origin)) return cb(null, true);
      return cb(new Error(`Origin not allowed: ${origin}`));
    },
    credentials: true,
  }));

  // Log basique
  app.use((req, _res, next) => {
    if (config.env !== "production") {
      console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl}`);
    }
    next();
  });

  // ─── Routes ───
  app.get("/api/health", (_req: Request, res: Response) => {
    res.json({ ok: true, env: config.env, shopEnabled: config.shop.enabled });
  });

  app.use("/api/auth", authRoutes);
  app.use("/api/players", playersRoutes);
  app.use("/api/factions", factionsRoutes);
  app.use("/api/leaderboards", leaderboardsRoutes);
  app.use("/api/shop", shopRoutes);

  // 404 JSON
  app.use("/api", (_req: Request, res: Response) => {
    res.status(404).json({ error: "Endpoint introuvable" });
  });

  // Error handler générique
  app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
    console.error("[error]", err);
    res.status(500).json({ error: "Erreur interne du serveur" });
  });

  // ─── Cron cleanup léger toutes les 5 minutes ───
  setInterval(async () => {
    try {
      const codes = await cleanupExpiredCodes();
      const sessions = await cleanupExpiredSessions();
      if (codes > 0 || sessions > 0) {
        console.log(`[cron] Cleanup: ${codes} codes, ${sessions} sessions`);
      }
    } catch (err) {
      console.error("[cron] cleanup error:", err);
    }
  }, 5 * 60 * 1000);

  // ─── Shutdown propre ───
  const shutdown = async (signal: string): Promise<void> => {
    console.log(`\n[shutdown] Reçu ${signal}, fermeture propre...`);
    await closeDb();
    process.exit(0);
  };
  process.on("SIGINT", () => shutdown("SIGINT"));
  process.on("SIGTERM", () => shutdown("SIGTERM"));

  // ─── Démarrage ───
  app.listen(config.port, () => {
    console.log(`╭─ Cantale Backend ─────────────────────────╮`);
    console.log(`│ Port    : ${config.port.toString().padEnd(31)}│`);
    console.log(`│ Env     : ${config.env.padEnd(31)}│`);
    console.log(`│ DB      : ${config.db.type.padEnd(31)}│`);
    console.log(`│ Shop    : ${(config.shop.enabled ? "ON" : "OFF (consultation seule)").padEnd(31)}│`);
    console.log(`╰────────────────────────────────────────────╯`);
  });
}

main().catch((err) => {
  console.error("[fatal]", err);
  process.exit(1);
});
