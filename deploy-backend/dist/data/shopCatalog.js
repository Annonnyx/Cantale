"use strict";
/**
 * Catalogue statique des items de la boutique (source unique de vérité).
 * Aligné avec les CTA de boutique.html.
 *
 * Si la boutique est désactivée (SHOP_ENABLED=false), le catalogue reste
 * consultable mais aucun checkout n'est possible.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.SHOP_CATALOG = void 0;
exports.findShopItem = findShopItem;
exports.SHOP_CATALOG = [
    // ─── GRADES ──────────────────────────────────────────
    { id: "grade_aventurier", category: "grade", name: "Aventurier", description: "Grade premium niveau 1", priceEur: 2.99, recurring: "monthly", delivers: { rank: "AVENTURIER" } },
    { id: "grade_vip", category: "grade", name: "VIP", description: "Grade premium niveau 2", priceEur: 6.99, recurring: "monthly", delivers: { rank: "VIP" } },
    { id: "grade_chevre", category: "grade", name: "Chèvre", description: "Grade premium ultime", priceEur: 13.99, recurring: "monthly", delivers: { rank: "CHEVRE" } },
    // ─── VIES ────────────────────────────────────────────
    { id: "lives_1", category: "lives", name: "1 Vie", description: "À l'unité", priceEur: 2, delivers: { vies: 1 } },
    { id: "lives_5", category: "lives", name: "5 Vies", description: "Pack petit", priceEur: 9, delivers: { vies: 5 } },
    { id: "lives_10", category: "lives", name: "10 Vies", description: "Pack moyen", priceEur: 16, delivers: { vies: 10 } },
    { id: "lives_30", category: "lives", name: "30 Vies", description: "Pack grand", priceEur: 42, delivers: { vies: 30 } },
    { id: "lives_50", category: "lives", name: "50 Vies", description: "Pack méga", priceEur: 60, delivers: { vies: 50 } },
    { id: "lives_100", category: "lives", name: "100 Vies", description: "Pack ultime", priceEur: 100, delivers: { vies: 100 } },
    // ─── OUTILS CUSTOM ───────────────────────────────────
    { id: "tool_pickantaxe", category: "tool", name: "Pickantaxe", description: "Pioche multizone (Fer/Diamant/Netherite)", priceEur: 3 },
    { id: "tool_cantaxe", category: "tool", name: "Cantaxe", description: "Hache multizone (Fer/Diamant/Netherite)", priceEur: 3 },
    { id: "tool_multicantool", category: "tool", name: "Multi-Cantool", description: "Outil polyvalent (Pioche+Hache+Pelle+Cisailles)", priceEur: 4 },
    { id: "tool_statiolytras", category: "tool", name: "Statio-Lytra", description: "Vol créatif en claims", priceEur: 5 },
    { id: "tool_cantalame", category: "tool", name: "Cantalame", description: "Épée évolutive (Netherite + rune évolutive)", priceEur: 5 },
    { id: "tool_rune", category: "tool", name: "Rune Fortif.", description: "Protection claim (un chunk entier)", priceEur: 3 },
    // ─── PACKS ───────────────────────────────────────────
    { id: "pack_mineur", category: "pack", name: "Pack Mineur", description: "Pickantaxe Fer 3x3 + Cantaxe Fer + Multi-Cantool Fer", priceEur: 7 },
    { id: "pack_moyen", category: "pack", name: "Pack Moyen", description: "Pickantaxe Diamant 5x5 + Cantaxe Diamant + Multi-Cantool Diamant + Statio-Lytra", priceEur: 12 },
    { id: "pack_ultime", category: "pack", name: "Pack Ultime", description: "Pickantaxe Netherite 7x7 + Cantaxe Netherite + Multi-Cantool Netherite + Statio-Lytra + Cantalame + Rune", priceEur: 18 },
];
function findShopItem(id) {
    return exports.SHOP_CATALOG.find((i) => i.id === id);
}
//# sourceMappingURL=shopCatalog.js.map