"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const factionRepo_1 = require("../data/factionRepo");
const router = (0, express_1.Router)();
router.get("/", async (_req, res) => {
    const factions = await (0, factionRepo_1.listFactions)();
    res.json({ factions, count: factions.length });
});
router.get("/:idOrTag", async (req, res) => {
    const idOrTag = req.params.idOrTag;
    let faction = null;
    if (/^\d+$/.test(idOrTag)) {
        faction = await (0, factionRepo_1.getFaction)(parseInt(idOrTag, 10));
    }
    else {
        faction = await (0, factionRepo_1.getFactionByTag)(idOrTag);
    }
    if (!faction) {
        res.status(404).json({ error: "Faction introuvable" });
        return;
    }
    const [members, claims] = await Promise.all([
        (0, factionRepo_1.getFactionMembers)(faction.id),
        (0, factionRepo_1.getFactionClaims)(faction.id),
    ]);
    res.json({ ...faction, members, claims });
});
exports.default = router;
//# sourceMappingURL=factions.js.map