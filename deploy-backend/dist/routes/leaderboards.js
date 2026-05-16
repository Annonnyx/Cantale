"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const leaderboardRepo_1 = require("../data/leaderboardRepo");
const router = (0, express_1.Router)();
const VALID = ["kills", "deaths", "balance", "kill_streak", "votes", "factions"];
router.get("/", async (_req, res) => {
    const types = VALID;
    const all = await Promise.all(types.map(async (t) => [t, await (0, leaderboardRepo_1.getLeaderboard)(t, 10)]));
    res.json(Object.fromEntries(all));
});
router.get("/:type", async (req, res) => {
    const type = req.params.type;
    if (!VALID.includes(type)) {
        res.status(400).json({ error: "Type invalide", valid: VALID });
        return;
    }
    const limit = parseInt(req.query.limit ?? "10", 10);
    const entries = await (0, leaderboardRepo_1.getLeaderboard)(type, isNaN(limit) ? 10 : limit);
    res.json({ type, entries, count: entries.length });
});
exports.default = router;
//# sourceMappingURL=leaderboards.js.map