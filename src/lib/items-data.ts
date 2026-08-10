/**
 * Catalogue des items custom de CANTALE.
 *
 * Source de vérité : `src/main/java/fr/cantale/plugin/custom/CustomItemType.java`
 * (enum du plugin) + `CustomItemManager.java` (lores & enchantements),
 * `CantalameManager.java` (paliers), `CrateRewardTable.java` (obtentions).
 *
 * Choix de raretés — cohérents avec la puissance réelle en jeu :
 * - Cantalame = légendaire : épée évolutive unique, 100 kills uniques au sommet.
 * - Armure du Garde = mythique : set netherite sur-enchanté + bonus d'attributs,
 *   distribué uniquement par le staff.
 * - Vie = mythique : redonne une vie sur trois — le bien le plus précieux du
 *   serveur, mais renouvelable (récompense mensuelle de grade, caisses).
 * - Netherite = mythique pour les familles d'outils (Efficacité X, incassable).
 * - Diamant = épique, Fer = rare pour les Pickantaxes / Multi-Cantools.
 * - Cantaxes = épiques (abattage d'un arbre entier en un coup), sauf la
 *   Netherite, mythique (sommet de la famille, caisse Mythique).
 * - Rune de Fortification = épique : utilitaire de faction puissant mais
 *   défensif, avec un coût journalier en Cantox.
 *
 * Note : la Rune de Fortification est bien présente dans l'enum du plugin et
 * son listener est enregistré (CantalePlugin.java) — la ligne TODO.md
 * « suppression » correspond à l'ancienne version, remplacée par la refonte
 * « 1 rune = 1 chunk ». Les Statio-Lytras, eux, n'existent plus nulle part
 * comme item (simple mention texte dans les avantages de grade) : exclus.
 */

export type ItemCategory = "arme" | "outil" | "consommable" | "armure";

export type ItemRarity = "rare" | "epique" | "mythique" | "legendaire";

export type ItemVariant = {
  /** Nom exact en jeu (displayName du plugin). */
  name: string;
  note?: string;
};

export type ItemStat = {
  label: string;
  value: string;
};

export type CatalogItem = {
  slug: string;
  name: string;
  category: ItemCategory;
  rarity: ItemRarity;
  /** Résumé court affiché sur la carte. */
  tagline: string;
  /** Description complète, page détail. */
  description: string;
  stats: ItemStat[];
  /** Méthodes d'obtention réelles (caisses, grades, staff). */
  obtention: string[];
  variants: ItemVariant[];
  /** Zones de minage disponibles (1, 3, 5, 7) — pilote le visuel grille. */
  zones?: number[];
  /** Monogramme affiché quand il n'y a pas de grille de zone. */
  monogram: string;
};

export const CATEGORY_LABELS: Record<ItemCategory, string> = {
  arme: "Arme",
  outil: "Outil",
  consommable: "Consommable",
  armure: "Armure",
};

export const RARITY_LABELS: Record<ItemRarity, string> = {
  rare: "Rare",
  epique: "Épique",
  mythique: "Mythique",
  legendaire: "Légendaire",
};

/** Classes littérales — Tailwind doit les voir en clair pour les générer. */
export const RARITY_STYLES: Record<
  ItemRarity,
  { border: string; text: string; bg: string; chip: string }
> = {
  rare: {
    border: "border-rare",
    text: "text-rare",
    bg: "bg-rare",
    chip: "border-rare/50 text-rare",
  },
  epique: {
    border: "border-epique",
    text: "text-epique",
    bg: "bg-epique",
    chip: "border-epique/50 text-epique",
  },
  mythique: {
    border: "border-mythique",
    text: "text-mythique",
    bg: "bg-mythique",
    chip: "border-mythique/50 text-mythique",
  },
  legendaire: {
    border: "border-legendaire",
    text: "text-legendaire",
    bg: "bg-legendaire",
    chip: "border-legendaire/50 text-legendaire",
  },
};

export const ITEMS: CatalogItem[] = [
  {
    slug: "pickantaxe-fer",
    name: "Pickantaxe Fer",
    category: "outil",
    rarity: "rare",
    tagline: "La pioche de zone d'entrée de gamme — jusqu'à 7×7 blocs par coup.",
    description:
      "La Pickantaxe creuse une zone entière au lieu d'un seul bloc : de 1×1 pour le travail de précision jusqu'à 7×7 pour défoncer une veine ou tailler une base. En fer, elle reste accessible tôt dans l'aventure et accepte les enchantements classiques — Fortune y est redoutable.",
    stats: [
      { label: "Zone de minage", value: "1×1, 3×3, 5×5 ou 7×7 selon la variante" },
      { label: "Enchantements", value: "Solidité V · Efficacité V" },
      { label: "Enchantable", value: "Fortune, Toucher de soie, Solidité" },
      { label: "Craft", value: "Non-craftable" },
    ],
    obtention: [
      "Caisse Trésor Public (Rare) — variante 1×1, récompense « Pic du Mineur »",
      "Ticket Légendaire — item au choix via ticket Discord",
    ],
    variants: [
      { name: "Pickantaxe Fer 1x1", note: "Un seul bloc — la précision avant tout" },
      { name: "Pickantaxe Fer 3x3", note: "9 blocs par coup" },
      { name: "Pickantaxe Fer 5x5", note: "25 blocs par coup" },
      { name: "Pickantaxe Fer 7x7", note: "49 blocs par coup" },
    ],
    zones: [1, 3, 5, 7],
    monogram: "PF",
  },
  {
    slug: "pickantaxe-diamant",
    name: "Pickantaxe Diamant",
    category: "outil",
    rarity: "epique",
    tagline: "La zone de minage en version diamant — plus rapide, plus durable.",
    description:
      "Même principe que la Pickantaxe Fer, montée en gamme : matériau diamant, Solidité VII et Efficacité VII. C'est l'outil des gros chantiers — carrières de faction, percement de défenses, préparation de zones contestées.",
    stats: [
      { label: "Zone de minage", value: "1×1, 3×3, 5×5 ou 7×7 selon la variante" },
      { label: "Enchantements", value: "Solidité VII · Efficacité VII" },
      { label: "Enchantable", value: "Fortune, Toucher de soie, Solidité" },
      { label: "Craft", value: "Non-craftable" },
    ],
    obtention: [
      "Caisse Médaille du Tournoi (Épique) — variante 1×1, récompense « Pic de Maître »",
      "Caisse Pièce Mythique (Mythique) — variante 3×3, récompense « Vœu de Puissance »",
      "Ticket Légendaire — item au choix via ticket Discord",
    ],
    variants: [
      { name: "Pickantaxe Diamant 1x1", note: "Un seul bloc" },
      { name: "Pickantaxe Diamant 3x3", note: "9 blocs par coup" },
      { name: "Pickantaxe Diamant 5x5", note: "25 blocs par coup" },
      { name: "Pickantaxe Diamant 7x7", note: "49 blocs par coup" },
    ],
    zones: [1, 3, 5, 7],
    monogram: "PD",
  },
  {
    slug: "pickantaxe-netherite",
    name: "Pickantaxe Netherite",
    category: "outil",
    rarity: "mythique",
    tagline: "Efficacité X, incassable : le sommet absolu du minage de zone.",
    description:
      "La Pickantaxe Netherite n'a pas de jauge de durabilité : elle ne se brise jamais. Avec Efficacité X et des zones allant jusqu'à 7×7, elle transforme une heure de minage en quelques minutes. On ne la croise pas par hasard — elle se gagne.",
    stats: [
      { label: "Zone de minage", value: "1×1, 3×3, 5×5 ou 7×7 selon la variante" },
      { label: "Enchantements", value: "Efficacité X" },
      { label: "Durabilité", value: "Incassable — aucune usure" },
      { label: "Craft", value: "Non-craftable" },
    ],
    obtention: [
      "Caisse Pièce Mythique (Mythique) — variante 5×5, récompense « Vœu Suprême »",
      "Ticket Légendaire — item au choix via ticket Discord",
    ],
    variants: [
      { name: "Pickantaxe Netherite 1x1", note: "Un seul bloc" },
      { name: "Pickantaxe Netherite 3x3", note: "9 blocs par coup" },
      { name: "Pickantaxe Netherite 5x5", note: "25 blocs par coup" },
      { name: "Pickantaxe Netherite 7x7", note: "49 blocs par coup" },
    ],
    zones: [1, 3, 5, 7],
    monogram: "PN",
  },
  {
    slug: "cantaxe-fer",
    name: "Cantaxe Fer",
    category: "outil",
    rarity: "epique",
    tagline: "Un coup, un arbre entier. La déforestation en un geste.",
    description:
      "La Cantaxe abat n'importe quel arbre d'un seul coup : le premier bloc frappé emporte tout le tronc. Elle taille aussi vite qu'une hache à efficacité maximale sur le reste. Indispensable pour bâtir grand sans y passer la nuit.",
    stats: [
      { label: "Abattage", value: "Un arbre entier en un coup" },
      { label: "Vitesse", value: "Équivalent efficacité maximale" },
      { label: "Enchantements", value: "Efficacité V" },
      { label: "Enchantable", value: "Toucher de soie, Solidité" },
    ],
    obtention: [
      "Caisse Trésor Public (Rare) — récompense « Bénédiction Rare »",
      "Caisse Médaille du Tournoi (Épique) — récompense « Mérite du Combattant »",
    ],
    variants: [{ name: "Cantaxe Fer" }],
    monogram: "CF",
  },
  {
    slug: "cantaxe-diamant",
    name: "Cantaxe Diamant",
    category: "outil",
    rarity: "epique",
    tagline: "L'abattage intégral, la longévité du diamant.",
    description:
      "La Cantaxe Diamant combine l'abattage d'un arbre entier en un coup avec la solidité et la vitesse du diamant (Efficacité VII). L'outil des bâtisseurs de faction qui mesurent le bois en coffres, pas en stacks.",
    stats: [
      { label: "Abattage", value: "Un arbre entier en un coup" },
      { label: "Vitesse", value: "Équivalent efficacité maximale" },
      { label: "Enchantements", value: "Efficacité VII" },
      { label: "Enchantable", value: "Toucher de soie, Solidité" },
    ],
    obtention: [
      "Caisse Médaille du Tournoi (Épique) — récompense « Bénédiction Épique »",
      "Caisse Pièce Mythique (Mythique) — récompense « Vœu de Vol »",
    ],
    variants: [{ name: "Cantaxe Diamant" }],
    monogram: "CD",
  },
  {
    slug: "cantaxe-netherite",
    name: "Cantaxe Netherite",
    category: "outil",
    rarity: "mythique",
    tagline: "Efficacité X sur un arbre entier — le dernier mot des haches.",
    description:
      "Le sommet de la famille : abattage intégral, Efficacité X, matériau netherite. La Cantaxe Netherite ne se contente pas de couper du bois, elle rase des forêts. Réservée aux caisses les plus rares.",
    stats: [
      { label: "Abattage", value: "Un arbre entier en un coup" },
      { label: "Vitesse", value: "Équivalent efficacité maximale" },
      { label: "Enchantements", value: "Efficacité X" },
      { label: "Enchantable", value: "Toucher de soie, Solidité" },
    ],
    obtention: [
      "Caisse Pièce Mythique (Mythique) — récompense « Vœu Légendaire »",
      "Ticket Légendaire — item au choix via ticket Discord",
    ],
    variants: [{ name: "Cantaxe Netherite" }],
    monogram: "CN",
  },
  {
    slug: "multi-cantool-fer",
    name: "Multi-Cantool Fer",
    category: "outil",
    rarity: "rare",
    tagline: "Pioche, hache, pelle et cisailles dans une seule main.",
    description:
      "Le Multi-Cantool s'adapte tout seul au bloc visé : pioche sur la pierre, hache sur le bois, pelle sur la terre, cisailles sur la laine et les feuilles — avec une vitesse ajustée nativement, sans à-coup. La variante standard casse en zone 3×3 et abat les arbres entiers ; la variante 1×1 reste chirurgicale.",
    stats: [
      { label: "Outils réunis", value: "Pioche + Hache + Pelle + Cisailles" },
      { label: "Modes", value: "1×1 (bloc unique) ou zone 3×3 / arbres entiers" },
      { label: "Enchantements", value: "Solidité V · Efficacité V" },
      { label: "Minage", value: "Vitesse adaptée au bloc, casse instantanée des blocs minables" },
    ],
    obtention: [
      "Caisse Cadeau du Roi (Vote) — variante 1×1, récompense « Coffre de Lames »",
      "Caisse Trésor Public (Rare) — variante 1×1",
    ],
    variants: [
      { name: "Multi-Cantool Fer 1x1", note: "Un seul bloc — précision" },
      { name: "Multi-Cantool Fer", note: "Zone 3×3 et arbres entiers" },
    ],
    zones: [1, 3],
    monogram: "MF",
  },
  {
    slug: "multi-cantool-diamant",
    name: "Multi-Cantool Diamant",
    category: "outil",
    rarity: "epique",
    tagline: "L'outil quatre-en-un en version diamant.",
    description:
      "Toutes les fonctions du Multi-Cantool avec la robustesse du diamant : Solidité VII, Efficacité VII. Un seul slot de barre d'action pour tout un atelier — l'outil que les bâtisseurs ne lâchent plus.",
    stats: [
      { label: "Outils réunis", value: "Pioche + Hache + Pelle + Cisailles" },
      { label: "Modes", value: "1×1 (bloc unique) ou zone 3×3 / arbres entiers" },
      { label: "Enchantements", value: "Solidité VII · Efficacité VII" },
      { label: "Minage", value: "Vitesse adaptée au bloc, casse instantanée des blocs minables" },
    ],
    obtention: [
      "Caisse Trésor Public (Rare) — récompense « Légende Rapprochée »",
      "Caisse Médaille du Tournoi (Épique) — récompense « Multi-Outil Épique »",
    ],
    variants: [
      { name: "Multi-Cantool Diamant 1x1", note: "Un seul bloc — précision" },
      { name: "Multi-Cantool Diamant", note: "Zone 3×3 et arbres entiers" },
    ],
    zones: [1, 3],
    monogram: "MD",
  },
  {
    slug: "multi-cantool-netherite",
    name: "Multi-Cantool Netherite",
    category: "outil",
    rarity: "mythique",
    tagline: "Quatre outils en un, Efficacité X, incassable.",
    description:
      "La version définitive : le Multi-Cantool Netherite ne s'use jamais et travaille à Efficacité X. Pioche, hache, pelle, cisailles — tout y passe, pour toujours. L'outil qu'on lègue à ses successeurs de faction.",
    stats: [
      { label: "Outils réunis", value: "Pioche + Hache + Pelle + Cisailles" },
      { label: "Modes", value: "1×1 (bloc unique) ou zone 3×3 / arbres entiers" },
      { label: "Enchantements", value: "Efficacité X" },
      { label: "Durabilité", value: "Incassable — aucune usure" },
    ],
    obtention: [
      "Caisse Médaille du Tournoi (Épique) — récompense « Victoire Épique »",
      "Caisse Pièce Mythique (Mythique) — récompenses « Vœu de Vol » et « Vœu Suprême »",
      "Ticket Légendaire — item au choix via ticket Discord",
    ],
    variants: [
      { name: "Multi-Cantool Netherite 1x1", note: "Un seul bloc — précision" },
      { name: "Multi-Cantool Netherite", note: "Zone 3×3 et arbres entiers" },
    ],
    zones: [1, 3],
    monogram: "MN",
  },
  {
    slug: "cantalame",
    name: "Cantalame",
    category: "arme",
    rarity: "legendaire",
    tagline: "L'épée qui grandit avec chaque victime — 100 kills uniques au sommet.",
    description:
      "La Cantalame est une épée en netherite évolutive : chaque joueur unique qu'elle terrasse la renforce définitivement. De « Débutant » à « Surpuissant », ses paliers empilent Tranchant, Pillage, Aura de feu, Balayage et Solidité jusqu'à une lame sans équivalent. Chaque kill dépose la tête du vaincu au sol — le registre se souvient, et la lame aussi.",
    stats: [
      { label: "Progression", value: "1 palier par kill unique, 100 maximum" },
      { label: "Dès 5 kills", value: "Tranchant I — la lame s'éveille" },
      { label: "25 kills", value: "Tranchant V · Pillage III · Aura de feu I" },
      { label: "75 kills", value: "Tranchant X · Recul II" },
      { label: "100 kills", value: "Tranchant X · Pillage V · Aura de feu III · Balayage X · Solidité X" },
      { label: "Trophée", value: "La tête du vaincu est déposée au sol" },
      { label: "Craft", value: "Non-craftable" },
    ],
    obtention: [
      "Toutes les caisses — de 0,5 % (Cadeau du Roi) aux récompenses majeures des caisses Épique et Mythique",
      "Ticket Légendaire — item au choix via ticket Discord",
    ],
    variants: [{ name: "Cantalame", note: "Épée en netherite évolutive" }],
    monogram: "CL",
  },
  {
    slug: "vie",
    name: "Vie",
    category: "consommable",
    rarity: "mythique",
    tagline: "Une encoche de plus. Sur CANTALE, rien ne vaut plus cher.",
    description:
      "Sur un serveur où trois morts signifient le bannissement, cet item est le plus précieux qui existe : un clic-droit restaure une vie, dans la limite des trois encoches. Il se consume aussitôt. Les grades le reçoivent chaque mois ; les caisses le glissent parfois entre les Cantox.",
    stats: [
      { label: "Effet", value: "+1 vie au clic-droit (3 maximum)" },
      { label: "Consommation", value: "Disparaît après usage" },
      { label: "Craft", value: "Non-craftable" },
    ],
    obtention: [
      "Récompense mensuelle de grade",
      "Caisses Cadeau du Roi (Vote), Trésor Public (Rare), Médaille du Tournoi (Épique) et Pièce Mythique (Mythique)",
      "Ticket Légendaire — item au choix via ticket Discord",
    ],
    variants: [{ name: "Vie", note: "Totem consommable" }],
    monogram: "VI",
  },
  {
    slug: "rune-de-fortification",
    name: "Rune de Fortification",
    category: "consommable",
    rarity: "epique",
    tagline: "Un chunk imprenable pour ta faction — tant que la taxe est payée.",
    description:
      "Plantée d'un clic-droit dans un claim de ta faction, la rune fortifie le chunk entier : seuls les membres de la faction peuvent y casser des blocs, et les explosions n'y font aucun dégât. Chaque chunk fortifié coûte 50 Cantox par jour en taxe de territoire — une faction qui ne paie plus perd ses runes. Sneak + clic-droit retire la fortification et rend la rune.",
    stats: [
      { label: "Effet", value: "Fortifie un chunk entier d'un claim" },
      { label: "Protection", value: "Casse réservée aux membres, explosions sans effet" },
      { label: "Coût", value: "50 Cantox / jour / chunk fortifié" },
      { label: "Récupération", value: "Sneak + clic-droit rend la rune" },
      { label: "Craft", value: "Non-craftable" },
    ],
    obtention: ["Distribuée par le staff lors d'événements"],
    variants: [{ name: "Rune de Fortification", note: "1 rune = 1 chunk fortifié" }],
    monogram: "RF",
  },
  {
    slug: "armure-du-garde",
    name: "Armure du Garde",
    category: "armure",
    rarity: "mythique",
    tagline: "Quatre pièces de netherite sur-enchantées, un bonus de set brutal.",
    description:
      "L'équipement de ceux qui montent la garde sur CANTALE. Chaque pièce en netherite porte Protection IX, Épines V, Solidité X et Raccommodage, plus des extras propres à l'emplacement. Surtout, chaque pièce portée ajoute +1,5 cœur, +7,5 % de vitesse et +6,25 % de saut : le set complet couronné donne +6 cœurs, +30 % de vitesse et +25 % de saut.",
    stats: [
      { label: "Enchantements", value: "Protection IX · Épines V · Solidité X · Raccommodage" },
      { label: "Casque", value: "Respiration III · Affinité aquatique" },
      { label: "Jambières", value: "Pas furtifs III" },
      { label: "Bottes", value: "Chute amortie IV · Depth Strider III · Soul Speed III" },
      { label: "Bonus par pièce", value: "+1,5 cœur · +7,5 % vitesse · +6,25 % saut" },
      { label: "Set complet", value: "+6 cœurs · +30 % vitesse · +25 % saut" },
      { label: "Craft", value: "Non-craftable" },
    ],
    obtention: ["Distribuée par le staff lors d'événements"],
    variants: [
      { name: "Casque du Garde" },
      { name: "Plastron du Garde" },
      { name: "Jambières du Garde" },
      { name: "Bottes du Garde" },
    ],
    monogram: "AG",
  },
];

export function getItemBySlug(slug: string): CatalogItem | undefined {
  return ITEMS.find((item) => item.slug === slug);
}
