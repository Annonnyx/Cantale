/**
 * Middleware Express : authentification par cookie de session.
 *
 * Si la session est valide, on attache `req.user` au request.
 * Sinon, on renvoie 401.
 */

import { Request, Response, NextFunction } from "express";
import { getSession, Session } from "./sessions";

export const SESSION_COOKIE = "cantale_session";

declare module "express-serve-static-core" {
  interface Request {
    user?: Session;
  }
}

/** Middleware obligatoire : 401 si pas de session valide. */
export async function requireAuth(req: Request, res: Response, next: NextFunction): Promise<void> {
  const token = req.cookies?.[SESSION_COOKIE];
  if (!token) {
    res.status(401).json({ error: "Non authentifié" });
    return;
  }
  const session = await getSession(token);
  if (!session) {
    res.clearCookie(SESSION_COOKIE);
    res.status(401).json({ error: "Session expirée" });
    return;
  }
  req.user = session;
  next();
}

/** Middleware optionnel : ne bloque pas, mais remplit req.user si dispo. */
export async function optionalAuth(req: Request, _res: Response, next: NextFunction): Promise<void> {
  const token = req.cookies?.[SESSION_COOKIE];
  if (token) {
    const session = await getSession(token);
    if (session) req.user = session;
  }
  next();
}
