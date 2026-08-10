/**
 * Catalogue de la boutique CANTALE — source unique de vérité.
 *
 * Prix en EUR, côté serveur uniquement : le checkout revalide chaque ligne
 * contre ce catalogue (voir /api/shop/checkout) et ignore tout prix envoyé
 * par le client.
 *
 * Sources des avantages :
 * - plugin : src/main/java/fr/cantale/plugin/rank/PlayerRank.java (Cantox
 *   quotidien, vies mensuelles, Statio-Lytra, homes, /ah),
 *   listeners/AfkListener.java (anti-AFK : 10 min base, 30 min Aventurier,
 *   1 h VIP, illimité Chèvre), commands/FeedCommand.java (/feed VIP+ :
 *   3 min, 1 min Chèvre), privatechest/PrivateChestService.java (coffres :
 *   /pc 27→54 slots, /pc2 dès VIP, /pc3 Chèvre ; ender chest 54 slots Chèvre).
 * - noms RP des clés : crate/CrateType.java (Cadeau du Roi, Trésor Public,
 *   Médaille du Tournoi, Pièce Mythique, Ticket Légendaire).
 *
 * Le Cadeau du Roi (caisse Vote) n'est volontairement pas vendu : il reste
 * la récompense gratuite du /vote et l'entrée de la chaîne d'ascension.
 */
import type { ItemRarity } from "./items-data";

export type ShopEntryKind = "grade" | "vie" | "clef";

export type ShopRankId = "grade_aventurier" | "grade_vip" | "grade_goat";

export type ShopPerk = {
  label: string;
  value: string;
};

export type ShopRank = {
  kind: "grade";
  id: ShopRankId;
  name: string;
  /** Nom du grade en jeu (enum PlayerRank du plugin). */
  inGameName: string;
  tagline: string;
  priceEur: number;
  recurring: "monthly";
  featured: boolean;
  /** Avantages réels, affichés ligne à ligne sur la carte. */
  perks: ShopPerk[];
};

export type ShopItem = {
  kind: "vie" | "clef";
  id: string;
  name: string;
  tagline: string;
  /** Rareté d'affichage — alignée sur le registre des items (/items). */
  rarity: ItemRarity;
  priceEur: number;
  /** Prix unitaire affiché (« 1,80 € / vie »). */
  unitLabel?: string;
  /** Remise affichée (« -10 % »). */
  savingLabel?: string;
  featured?: boolean;
};

export type ShopEntry = ShopRank | ShopItem;

/** Garde-fous de validation du panier (checkout). */
export const SHOP_MAX_LINES = 16;
export const SHOP_MAX_QUANTITY_PER_LINE = 99;

/* ─── Rangs ──────────────────────────────────────────────────────────── */

export const SHOP_RANKS: readonly ShopRank[] = [
  {
    kind: "grade",
    id: "grade_aventurier",
    name: "Aventurier",
    inGameName: "Aventurier",
    tagline: "Le premier palier : de quoi tenir la semaine sans trembler.",
    priceEur: 2.99,
    recurring: "monthly",
    featured: false,
    perks: [
      { label: "Vies mensuelles", value: "1 item Vie — clic-droit, +1 vie hardcore" },
      { label: "Bonus quotidien", value: "2 500 Cantox à la première connexion du jour" },
      { label: "Anti-AFK", value: "30 minutes avant expulsion (au lieu de 10)" },
      { label: "Coffre privé", value: "/pc élargi à 54 slots (au lieu de 27)" },
      { label: "Homes", value: "5 (au lieu de 3)" },
      { label: "Hôtel des ventes", value: "5 ventes simultanées au /ah (au lieu de 3)" },
    ],
  },
  {
    kind: "grade",
    id: "grade_vip",
    name: "VIP",
    inGameName: "VIP",
    tagline: "Le confort de faction : second coffre, /feed et vol en claims.",
    priceEur: 6.99,
    recurring: "monthly",
    featured: false,
    perks: [
      { label: "Vies mensuelles", value: "2 items Vie" },
      { label: "Bonus quotidien", value: "10 000 Cantox à la première connexion du jour" },
      { label: "Statio-Lytra", value: "1 par mois — vol créatif dans les claims de ta faction" },
      { label: "Anti-AFK", value: "1 heure avant expulsion" },
      { label: "Commande /feed", value: "faim et saturation restaurées — cooldown 3 min" },
      { label: "Coffres privés", value: "/pc + /pc2 — 108 slots au total" },
      { label: "Homes", value: "10" },
      { label: "Hôtel des ventes", value: "12 ventes simultanées au /ah" },
      { label: "Inclus", value: "Tous les avantages Aventurier" },
    ],
  },
  {
    kind: "grade",
    id: "grade_goat",
    name: "GØAT",
    inGameName: "Chèvre",
    tagline: "Le grade ultime : vol illimité, téléportation sans cooldown, trois coffres.",
    priceEur: 13.99,
    recurring: "monthly",
    featured: true,
    perks: [
      { label: "Vies mensuelles", value: "3 items Vie" },
      { label: "Bonus quotidien", value: "100 000 Cantox à la première connexion du jour" },
      { label: "Vol créatif", value: "illimité dans les claims — sans Statio-Lytra" },
      { label: "Anti-AFK", value: "illimité — jamais expulsé pour inactivité" },
      { label: "Commande /feed", value: "cooldown réduit à 1 min" },
      { label: "Coffres privés", value: "/pc + /pc2 + /pc3 — 162 slots au total" },
      { label: "Ender chest", value: "élargi à 54 slots (au lieu de 27)" },
      { label: "Homes", value: "illimités" },
      { label: "Téléportation", value: "aucun cooldown sur /home, /warp, /spawn" },
      { label: "Hôtel des ventes", value: "20 ventes simultanées au /ah" },
      { label: "Inclus", value: "Tous les avantages VIP" },
    ],
  },
];

/** Comparatif ligne à ligne des trois rangs (tableau sous les cartes). */
export const RANK_COMPARISON: readonly { label: string; values: [string, string, string] }[] = [
  { label: "Prix", values: ["2,99 € / mois", "6,99 € / mois", "13,99 € / mois"] },
  { label: "Items Vie par mois", values: ["1", "2", "3"] },
  { label: "Bonus Cantox quotidien", values: ["2 500", "10 000", "100 000"] },
  { label: "Statio-Lytra par mois", values: ["—", "1", "1"] },
  { label: "Vol créatif dans les claims", values: ["—", "—", "Illimité"] },
  { label: "Anti-AFK avant expulsion", values: ["30 min", "1 h", "Illimité"] },
  { label: "Commande /feed", values: ["—", "Cooldown 3 min", "Cooldown 1 min"] },
  {
    label: "Coffres privés",
    values: ["/pc — 54 slots", "/pc + /pc2 — 108 slots", "/pc + /pc2 + /pc3 — 162 slots"],
  },
  { label: "Ender chest", values: ["27 slots", "27 slots", "54 slots"] },
  { label: "Homes", values: ["5", "10", "Illimités"] },
  { label: "Ventes simultanées /ah", values: ["5", "12", "20"] },
  { label: "Cooldown de téléportation", values: ["Standard", "Standard", "Aucun"] },
];

/* ─── Items à l'unité ────────────────────────────────────────────────── */

export const SHOP_ITEMS: readonly ShopItem[] = [
  // Vies — rareté mythique, cohérente avec la fiche « Vie » du registre.
  {
    kind: "vie",
    id: "vie_1",
    name: "1 Vie",
    tagline: "À l'unité — clic-droit, +1 vie hardcore.",
    rarity: "mythique",
    priceEur: 2,
    unitLabel: "2,00 € / vie",
  },
  {
    kind: "vie",
    id: "vie_5",
    name: "5 Vies",
    tagline: "Pack petit — de quoi survivre à une mauvaise semaine.",
    rarity: "mythique",
    priceEur: 9,
    unitLabel: "1,80 € / vie",
    savingLabel: "-10 %",
  },
  {
    kind: "vie",
    id: "vie_10",
    name: "10 Vies",
    tagline: "Pack moyen — la réserve des réguliers.",
    rarity: "mythique",
    priceEur: 16,
    unitLabel: "1,60 € / vie",
    savingLabel: "-20 %",
  },
  {
    kind: "vie",
    id: "vie_30",
    name: "30 Vies",
    tagline: "Pack grand — une faction tient plus longtemps.",
    rarity: "mythique",
    priceEur: 42,
    unitLabel: "1,40 € / vie",
    savingLabel: "-30 %",
  },
  {
    kind: "vie",
    id: "vie_50",
    name: "50 Vies",
    tagline: "Pack méga — la saison sans angoisse.",
    rarity: "mythique",
    priceEur: 60,
    unitLabel: "1,20 € / vie",
    savingLabel: "-40 %",
  },
  {
    kind: "vie",
    id: "vie_100",
    name: "100 Vies",
    tagline: "Pack ultime — le meilleur prix à l'unité.",
    rarity: "mythique",
    priceEur: 100,
    unitLabel: "1,00 € / vie",
    savingLabel: "-50 %",
    featured: true,
  },
  // Clés de caisse — noms RP exacts du plugin (CrateType), rareté = palier
  // de la caisse. Le Cadeau du Roi (Vote) reste gratuit via /vote.
  {
    kind: "clef",
    id: "clef_tresor_public",
    name: "Trésor Public",
    tagline: "Clé de la caisse Rare — s'ouvre au coffre du spawn.",
    rarity: "rare",
    priceEur: 1.99,
  },
  {
    kind: "clef",
    id: "clef_medaille_tournoi",
    name: "Médaille du Tournoi",
    tagline: "Caisse Épique — à consacrer sur l'autel (balise ou table d'enchantement).",
    rarity: "epique",
    priceEur: 3.49,
  },
  {
    kind: "clef",
    id: "clef_piece_mythique",
    name: "Pièce Mythique",
    tagline: "Caisse Mythique — à jeter dans la fontaine du spawn.",
    rarity: "mythique",
    priceEur: 5.99,
  },
  {
    kind: "clef",
    id: "clef_ticket_legendaire",
    name: "Ticket Légendaire",
    tagline: "Caisse Légendaire — audience royale : l'item de ton choix, via ticket Discord.",
    rarity: "legendaire",
    priceEur: 9.99,
  },
];

/** Tout le catalogue, rangs compris — liste blanche du checkout. */
export const SHOP_CATALOG: readonly ShopEntry[] = [...SHOP_RANKS, ...SHOP_ITEMS];

export function findShopEntry(id: string): ShopEntry | undefined {
  return SHOP_CATALOG.find((entry) => entry.id === id);
}

/** « 2,99 € » / « 9 € » — formatage stable, identique serveur et client. */
export function formatPriceEur(value: number): string {
  const rounded = Math.round(value * 100) / 100;
  const text = Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(2).replace(".", ",");
  return `${text} €`;
}
