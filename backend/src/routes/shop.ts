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

import { Router, Request, Response } from "express";
import { requireAuth } from "../auth/middleware";
import { SHOP_CATALOG, findShopItem } from "../data/shopCatalog";
import { getDb } from "../db/db";
import { config } from "../config";

const router = Router();

router.get("/catalog", (_req: Request, res: Response) => {
  res.json({
    enabled: config.shop.enabled,
    items: SHOP_CATALOG,
    notice: config.shop.enabled
      ? null
      : "La boutique est temporairement fermée. Les paniers sont conservés pour quand elle rouvrira.",
  });
});

interface CartRow {
  id: number;
  item_id: string;
  quantity: number;
  added_at: number;
}

interface CartLine {
  itemId: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
  name: string;
  description: string;
  category: string;
}

async function readCart(uuid: string): Promise<{ lines: CartLine[]; totalEur: number }> {
  const db = getDb();
  const rows = await db.query<CartRow>(
    `SELECT id, item_id, quantity, added_at FROM web_cart_items WHERE player_uuid = ? ORDER BY added_at ASC`,
    [uuid]
  );

  const lines: CartLine[] = [];
  for (const r of rows) {
    const item = findShopItem(r.item_id);
    if (!item) continue; // item retiré du catalogue → on l'ignore (le SQL row peut être purgé plus tard)
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

router.get("/cart", requireAuth, async (req: Request, res: Response) => {
  const cart = await readCart(req.user!.player_uuid);
  res.json({ ...cart, shopEnabled: config.shop.enabled });
});

router.post("/cart", requireAuth, async (req: Request, res: Response): Promise<void> => {
  const { itemId, quantity = 1 } = req.body ?? {};
  const item = findShopItem(itemId);
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
  const db = getDb();
  const now = Math.floor(Date.now() / 1000);
  const uuid = req.user!.player_uuid;

  // Vérifier si l'item est déjà dans le panier → incrémenter
  const existing = await db.queryOne<CartRow>(
    `SELECT id, item_id, quantity, added_at FROM web_cart_items WHERE player_uuid = ? AND item_id = ?`,
    [uuid, itemId]
  );
  if (existing) {
    const newQty = item.recurring ? 1 : Math.min(99, existing.quantity + qty);
    await db.execute(`UPDATE web_cart_items SET quantity = ? WHERE id = ?`, [newQty, existing.id]);
  } else {
    await db.execute(
      `INSERT INTO web_cart_items (player_uuid, item_id, quantity, added_at) VALUES (?, ?, ?, ?)`,
      [uuid, itemId, qty, now]
    );
  }

  const cart = await readCart(uuid);
  res.json(cart);
});

router.patch("/cart/:itemId", requireAuth, async (req: Request, res: Response): Promise<void> => {
  const { quantity } = req.body ?? {};
  const qty = parseInt(quantity, 10);
  if (isNaN(qty) || qty < 0 || qty > 99) {
    res.status(400).json({ error: "Quantité invalide (0-99)" });
    return;
  }
  const db = getDb();
  const uuid = req.user!.player_uuid;
  if (qty === 0) {
    await db.execute(`DELETE FROM web_cart_items WHERE player_uuid = ? AND item_id = ?`, [uuid, req.params.itemId]);
  } else {
    await db.execute(`UPDATE web_cart_items SET quantity = ? WHERE player_uuid = ? AND item_id = ?`,
      [qty, uuid, req.params.itemId]);
  }
  res.json(await readCart(uuid));
});

router.delete("/cart/:itemId", requireAuth, async (req: Request, res: Response) => {
  const db = getDb();
  const uuid = req.user!.player_uuid;
  await db.execute(`DELETE FROM web_cart_items WHERE player_uuid = ? AND item_id = ?`, [uuid, req.params.itemId]);
  res.json(await readCart(uuid));
});

router.post("/cart/clear", requireAuth, async (req: Request, res: Response) => {
  const db = getDb();
  await db.execute(`DELETE FROM web_cart_items WHERE player_uuid = ?`, [req.user!.player_uuid]);
  res.json({ lines: [], totalEur: 0, shopEnabled: config.shop.enabled });
});

router.post("/checkout", requireAuth, async (_req: Request, res: Response): Promise<void> => {
  if (!config.shop.enabled) {
    res.status(503).json({
      error: "Boutique fermée",
      message: "Les transactions sont temporairement désactivées. Réessaie plus tard.",
    });
    return;
  }
  // Placeholder pour intégration Stripe / PayPal future
  res.status(501).json({ error: "Checkout pas encore implémenté (TODO : intégrer Stripe)" });
});

export default router;
