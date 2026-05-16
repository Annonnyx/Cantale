/**
 * Routes /api/auth/*
 *
 *  POST /request-link       → crée un code, renvoie {code, expiresAt}
 *  GET  /check-link/:code   → poll, renvoie {status: "pending"|"linked", session?}
 *                              Si "linked" : crée la session et SET le cookie HttpOnly
 *  GET  /me                 → renvoie l'utilisateur courant (404 si non auth)
 *  POST /logout             → détruit la session
 */

import { Router, Request, Response } from "express";
import rateLimit from "express-rate-limit";
import { createLinkCode, getLinkCode } from "./codes";
import { createSession, deleteSession } from "./sessions";
import { requireAuth, SESSION_COOKIE } from "./middleware";
import { config, isProd } from "../config";

const router = Router();

// Limite : max 5 requêtes par minute par IP pour la création de code (anti-spam)
const requestLinkLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Trop de tentatives. Réessayez dans une minute." },
});

router.post("/request-link", requestLinkLimiter, async (_req: Request, res: Response) => {
  try {
    const { code, expiresAt } = await createLinkCode();
    res.json({
      code,
      expiresAt,
      ttlSeconds: config.linkCode.ttlSeconds,
      instruction: `Connecte-toi sur Minecraft puis tape /web link ${code}`,
    });
  } catch (err) {
    console.error("[auth] request-link error:", err);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

router.get("/check-link/:code", async (req: Request, res: Response): Promise<void> => {
  const code = req.params.code;
  if (!/^\d{6}$/.test(code)) {
    res.status(400).json({ error: "Code invalide" });
    return;
  }

  const link = await getLinkCode(code);
  if (!link) {
    res.status(404).json({ error: "Code introuvable" });
    return;
  }

  const now = Math.floor(Date.now() / 1000);
  if (link.expires_at < now && !link.consumed_at) {
    res.status(410).json({ error: "Code expiré", status: "expired" });
    return;
  }

  if (!link.consumed_at || !link.player_uuid || !link.player_name) {
    res.json({ status: "pending", expiresAt: link.expires_at });
    return;
  }

  // ✓ Le joueur a validé in-game → on crée une session et on envoie le cookie
  const ip = req.ip ?? req.socket.remoteAddress ?? null;
  const ua = req.headers["user-agent"] ?? null;
  const { token, expiresAt } = await createSession({
    playerUuid: link.player_uuid,
    playerName: link.player_name,
    ip,
    userAgent: ua,
  });

  res.cookie(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: isProd,
    sameSite: "lax",
    domain: config.session.cookieDomain,
    maxAge: config.session.ttlSeconds * 1000,
    path: "/",
  });

  res.json({
    status: "linked",
    user: {
      uuid: link.player_uuid,
      name: link.player_name,
    },
    expiresAt,
  });
});

router.get("/me", requireAuth, async (req: Request, res: Response) => {
  res.json({
    uuid: req.user!.player_uuid,
    name: req.user!.player_name,
    sessionExpiresAt: req.user!.expires_at,
  });
});

router.post("/logout", async (req: Request, res: Response) => {
  const token = req.cookies?.[SESSION_COOKIE];
  if (token) await deleteSession(token);
  res.clearCookie(SESSION_COOKIE, {
    domain: config.session.cookieDomain,
    path: "/",
  });
  res.json({ success: true });
});

export default router;
