import { Router, Request, Response } from "express";
import { listFactions, getFaction, getFactionByTag, getFactionMembers, getFactionClaims } from "../data/factionRepo";

const router = Router();

router.get("/", async (_req: Request, res: Response) => {
  const factions = await listFactions();
  res.json({ factions, count: factions.length });
});

router.get("/:idOrTag", async (req: Request, res: Response): Promise<void> => {
  const idOrTag = req.params.idOrTag;
  let faction = null;
  if (/^\d+$/.test(idOrTag)) {
    faction = await getFaction(parseInt(idOrTag, 10));
  } else {
    faction = await getFactionByTag(idOrTag);
  }
  if (!faction) {
    res.status(404).json({ error: "Faction introuvable" });
    return;
  }
  const [members, claims] = await Promise.all([
    getFactionMembers(faction.id),
    getFactionClaims(faction.id),
  ]);
  res.json({ ...faction, members, claims });
});

export default router;
