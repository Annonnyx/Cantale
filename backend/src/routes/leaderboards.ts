import { Router, Request, Response } from "express";
import { getLeaderboard, LeaderboardType } from "../data/leaderboardRepo";

const router = Router();

const VALID: LeaderboardType[] = ["kills", "deaths", "balance", "kill_streak", "votes", "factions"];

router.get("/", async (_req: Request, res: Response) => {
  const types = VALID;
  const all = await Promise.all(types.map(async (t) => [t, await getLeaderboard(t, 10)] as const));
  res.json(Object.fromEntries(all));
});

router.get("/:type", async (req: Request, res: Response): Promise<void> => {
  const type = req.params.type as LeaderboardType;
  if (!VALID.includes(type)) {
    res.status(400).json({ error: "Type invalide", valid: VALID });
    return;
  }
  const limit = parseInt((req.query.limit as string) ?? "10", 10);
  const entries = await getLeaderboard(type, isNaN(limit) ? 10 : limit);
  res.json({ type, entries, count: entries.length });
});

export default router;
