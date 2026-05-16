import { Router, Request, Response } from "express";
import { getPlayerByUuid, getPlayerByName, getPlayerExtended } from "../data/playerRepo";
import { requireAuth } from "../auth/middleware";

const router = Router();

const UUID_RE = /^[0-9a-f]{8}-?[0-9a-f]{4}-?[0-9a-f]{4}-?[0-9a-f]{4}-?[0-9a-f]{12}$/i;

/** Récupère le profil public d'un joueur (par UUID ou par nom). */
router.get("/:identifier", async (req: Request, res: Response): Promise<void> => {
  const id = req.params.identifier;
  let profile;
  if (UUID_RE.test(id)) {
    profile = await getPlayerExtended(id);
  } else {
    const base = await getPlayerByName(id);
    if (base) profile = await getPlayerExtended(base.uuid);
  }
  if (!profile) {
    res.status(404).json({ error: "Joueur introuvable" });
    return;
  }
  res.json(profile);
});

/** Profil de l'utilisateur connecté (raccourci). */
router.get("/me/profile", requireAuth, async (req: Request, res: Response) => {
  const profile = await getPlayerExtended(req.user!.player_uuid);
  if (!profile) {
    // Edge case : compte lié mais entrée players manquante (1er join non encore fait)
    const fallback = await getPlayerByUuid(req.user!.player_uuid);
    res.json({
      uuid: req.user!.player_uuid,
      username: req.user!.player_name,
      lives: 3,
      balance: 0,
      deaths: 0,
      kills: 0,
      kill_streak: 0,
      last_death: 0,
      tutorial_progress: 0,
      created_at: 0,
      rank: "NONE",
      ...fallback,
    });
    return;
  }
  res.json(profile);
});

export default router;
