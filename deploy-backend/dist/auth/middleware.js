"use strict";
/**
 * Middleware Express : authentification par cookie de session.
 *
 * Si la session est valide, on attache `req.user` au request.
 * Sinon, on renvoie 401.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.SESSION_COOKIE = void 0;
exports.requireAuth = requireAuth;
exports.optionalAuth = optionalAuth;
const sessions_1 = require("./sessions");
exports.SESSION_COOKIE = "cantale_session";
/** Middleware obligatoire : 401 si pas de session valide. */
async function requireAuth(req, res, next) {
    const token = req.cookies?.[exports.SESSION_COOKIE];
    if (!token) {
        res.status(401).json({ error: "Non authentifié" });
        return;
    }
    const session = await (0, sessions_1.getSession)(token);
    if (!session) {
        res.clearCookie(exports.SESSION_COOKIE);
        res.status(401).json({ error: "Session expirée" });
        return;
    }
    req.user = session;
    next();
}
/** Middleware optionnel : ne bloque pas, mais remplit req.user si dispo. */
async function optionalAuth(req, _res, next) {
    const token = req.cookies?.[exports.SESSION_COOKIE];
    if (token) {
        const session = await (0, sessions_1.getSession)(token);
        if (session)
            req.user = session;
    }
    next();
}
//# sourceMappingURL=middleware.js.map