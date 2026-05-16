"use strict";
/**
 * Routes /api/auth/*
 *
 *  POST /request-link       → crée un code, renvoie {code, expiresAt}
 *  GET  /check-link/:code   → poll, renvoie {status: "pending"|"linked", session?}
 *                              Si "linked" : crée la session et SET le cookie HttpOnly
 *  GET  /me                 → renvoie l'utilisateur courant (404 si non auth)
 *  POST /logout             → détruit la session
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const codes_1 = require("./codes");
const sessions_1 = require("./sessions");
const middleware_1 = require("./middleware");
const config_1 = require("../config");
const router = (0, express_1.Router)();
// Limite : max 5 requêtes par minute par IP pour la création de code (anti-spam)
const requestLinkLimiter = (0, express_rate_limit_1.default)({
    windowMs: 60 * 1000,
    limit: 5,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: "Trop de tentatives. Réessayez dans une minute." },
});
router.post("/request-link", requestLinkLimiter, async (_req, res) => {
    try {
        const { code, expiresAt } = await (0, codes_1.createLinkCode)();
        res.json({
            code,
            expiresAt,
            ttlSeconds: config_1.config.linkCode.ttlSeconds,
            instruction: `Connecte-toi sur Minecraft puis tape /web link ${code}`,
        });
    }
    catch (err) {
        console.error("[auth] request-link error:", err);
        res.status(500).json({ error: "Erreur serveur" });
    }
});
router.get("/check-link/:code", async (req, res) => {
    const code = req.params.code;
    if (!/^\d{6}$/.test(code)) {
        res.status(400).json({ error: "Code invalide" });
        return;
    }
    const link = await (0, codes_1.getLinkCode)(code);
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
    const { token, expiresAt } = await (0, sessions_1.createSession)({
        playerUuid: link.player_uuid,
        playerName: link.player_name,
        ip,
        userAgent: ua,
    });
    res.cookie(middleware_1.SESSION_COOKIE, token, {
        httpOnly: true,
        secure: config_1.isProd,
        sameSite: "lax",
        domain: config_1.config.session.cookieDomain,
        maxAge: config_1.config.session.ttlSeconds * 1000,
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
router.get("/me", middleware_1.requireAuth, async (req, res) => {
    res.json({
        uuid: req.user.player_uuid,
        name: req.user.player_name,
        sessionExpiresAt: req.user.expires_at,
    });
});
router.post("/logout", async (req, res) => {
    const token = req.cookies?.[middleware_1.SESSION_COOKIE];
    if (token)
        await (0, sessions_1.deleteSession)(token);
    res.clearCookie(middleware_1.SESSION_COOKIE, {
        domain: config_1.config.session.cookieDomain,
        path: "/",
    });
    res.json({ success: true });
});
exports.default = router;
//# sourceMappingURL=routes.js.map