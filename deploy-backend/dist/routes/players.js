"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const playerRepo_1 = require("../data/playerRepo");
const middleware_1 = require("../auth/middleware");
const router = (0, express_1.Router)();
const UUID_RE = /^[0-9a-f]{8}-?[0-9a-f]{4}-?[0-9a-f]{4}-?[0-9a-f]{4}-?[0-9a-f]{12}$/i;
/** Récupère le profil public d'un joueur (par UUID ou par nom). */
router.get("/:identifier", async (req, res) => {
    const id = req.params.identifier;
    let profile;
    if (UUID_RE.test(id)) {
        profile = await (0, playerRepo_1.getPlayerExtended)(id);
    }
    else {
        const base = await (0, playerRepo_1.getPlayerByName)(id);
        if (base)
            profile = await (0, playerRepo_1.getPlayerExtended)(base.uuid);
    }
    if (!profile) {
        res.status(404).json({ error: "Joueur introuvable" });
        return;
    }
    res.json(profile);
});
/** Profil de l'utilisateur connecté (raccourci). */
router.get("/me/profile", middleware_1.requireAuth, async (req, res) => {
    const profile = await (0, playerRepo_1.getPlayerExtended)(req.user.player_uuid);
    if (!profile) {
        // Edge case : compte lié mais entrée players manquante (1er join non encore fait)
        const fallback = await (0, playerRepo_1.getPlayerByUuid)(req.user.player_uuid);
        res.json({
            uuid: req.user.player_uuid,
            username: req.user.player_name,
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
exports.default = router;
//# sourceMappingURL=players.js.map