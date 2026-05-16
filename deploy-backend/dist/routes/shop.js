"use strict";
/**
 * Routes boutique :
 *  GET  /api/shop/catalog             → liste publique des items
 *  GET  /api/shop/cart                → panier de l'utilisateur (auth requise)
 *  POST /api/shop/cart                → ajoute un item   {itemId, quantity?}
 *  PATCH /api/shop/cart/:itemId       → modifie la quantité   {quantity}
 *  DELETE /api/shop/cart/:itemId      → retire un item
 *  POST /api/shop/cart/clear          → vide le panier
 *  POST /api/shop/checkout            → finalise (renvoie 503 tant que SHOP_ENABLED=false)
 */
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const middleware_1 = require("../auth/middleware");
const shopCatalog_1 = require("../data/shopCatalog");
const db_1 = require("../db/db");
const config_1 = require("../config");
const router = (0, express_1.Router)();
router.get("/catalog", (_req, res) => {
    res.json({
        enabled: config_1.config.shop.enabled,
        items: shopCatalog_1.SHOP_CATALOG,
        notice: config_1.config.shop.enabled
            ? null
            : "La boutique est temporairement fermée. Les paniers sont conservés pour quand elle rouvrira.",
    });
});
async function readCart(uuid) {
    const db = (0, db_1.getDb)();
    const rows = await db.query(`SELECT id, item_id, quantity, added_at FROM web_cart_items WHERE player_uuid = ? ORDER BY added_at ASC`, [uuid]);
    const lines = [];
    for (const r of rows) {
        const item = (0, shopCatalog_1.findShopItem)(r.item_id);
        if (!item)
            continue; // item retiré du catalogue → on l'ignore (le SQL row peut être purgé plus tard)
        lines.push({
            itemId: item.id,
            quantity: r.quantity,
            unitPrice: item.priceEur,
            lineTotal: +(item.priceEur * r.quantity).toFixed(2),
            name: item.name,
            description: item.description,
            category: item.category,
        });
    }
    const totalEur = +lines.reduce((sum, l) => sum + l.lineTotal, 0).toFixed(2);
    return { lines, totalEur };
}
router.get("/cart", middleware_1.requireAuth, async (req, res) => {
    const cart = await readCart(req.user.player_uuid);
    res.json({ ...cart, shopEnabled: config_1.config.shop.enabled });
});
router.post("/cart", middleware_1.requireAuth, async (req, res) => {
    const { itemId, quantity = 1 } = req.body ?? {};
    const item = (0, shopCatalog_1.findShopItem)(itemId);
    if (!item) {
        res.status(400).json({ error: "Item invalide" });
        return;
    }
    if (item.recurring) {
        // Les grades = abonnements, max 1
        if (quantity !== 1) {
            res.status(400).json({ error: "Quantité 1 forcée pour les abonnements." });
            return;
        }
    }
    const qty = Math.max(1, Math.min(99, parseInt(quantity, 10) || 1));
    const db = (0, db_1.getDb)();
    const now = Math.floor(Date.now() / 1000);
    const uuid = req.user.player_uuid;
    // Vérifier si l'item est déjà dans le panier → incrémenter
    const existing = await db.queryOne(`SELECT id, item_id, quantity, added_at FROM web_cart_items WHERE player_uuid = ? AND item_id = ?`, [uuid, itemId]);
    if (existing) {
        const newQty = item.recurring ? 1 : Math.min(99, existing.quantity + qty);
        await db.execute(`UPDATE web_cart_items SET quantity = ? WHERE id = ?`, [newQty, existing.id]);
    }
    else {
        await db.execute(`INSERT INTO web_cart_items (player_uuid, item_id, quantity, added_at) VALUES (?, ?, ?, ?)`, [uuid, itemId, qty, now]);
    }
    const cart = await readCart(uuid);
    res.json(cart);
});
router.patch("/cart/:itemId", middleware_1.requireAuth, async (req, res) => {
    const { quantity } = req.body ?? {};
    const qty = parseInt(quantity, 10);
    if (isNaN(qty) || qty < 0 || qty > 99) {
        res.status(400).json({ error: "Quantité invalide (0-99)" });
        return;
    }
    const db = (0, db_1.getDb)();
    const uuid = req.user.player_uuid;
    if (qty === 0) {
        await db.execute(`DELETE FROM web_cart_items WHERE player_uuid = ? AND item_id = ?`, [uuid, req.params.itemId]);
    }
    else {
        await db.execute(`UPDATE web_cart_items SET quantity = ? WHERE player_uuid = ? AND item_id = ?`, [qty, uuid, req.params.itemId]);
    }
    res.json(await readCart(uuid));
});
router.delete("/cart/:itemId", middleware_1.requireAuth, async (req, res) => {
    const db = (0, db_1.getDb)();
    const uuid = req.user.player_uuid;
    await db.execute(`DELETE FROM web_cart_items WHERE player_uuid = ? AND item_id = ?`, [uuid, req.params.itemId]);
    res.json(await readCart(uuid));
});
router.post("/cart/clear", middleware_1.requireAuth, async (req, res) => {
    const db = (0, db_1.getDb)();
    await db.execute(`DELETE FROM web_cart_items WHERE player_uuid = ?`, [req.user.player_uuid]);
    res.json({ lines: [], totalEur: 0, shopEnabled: config_1.config.shop.enabled });
});
router.post("/checkout", middleware_1.requireAuth, async (_req, res) => {
    if (!config_1.config.shop.enabled) {
        res.status(503).json({
            error: "Boutique fermée",
            message: "Les transactions sont temporairement désactivées. Réessaie plus tard.",
        });
        return;
    }
    // Placeholder pour intégration Stripe / PayPal future
    res.status(501).json({ error: "Checkout pas encore implémenté (TODO : intégrer Stripe)" });
});
exports.default = router;
//# sourceMappingURL=shop.js.map