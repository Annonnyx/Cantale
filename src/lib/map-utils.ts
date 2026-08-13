/**
 * Carte des territoires — types partagés (repo, API, client) et helpers purs.
 *
 * Repères :
 * - un claim = un chunk Minecraft (16×16 blocs) ; les coordonnées chunk se
 *   convertissent en blocs par ×16 ;
 * - les couleurs de faction sont DÉTERMINISTES (dérivées de l'id) pour que la
 *   carte, la légende et la recherche parlent de la même teinte ;
 * - les constantes de teinte reprennent les tokens de globals.css (palette
 *   « Le Registre ») pour le rendu canvas, qui ne lit pas les classes Tailwind.
 */

export type MapFactionRef = {
  id: number;
  name: string;
  tag: string;
};

export type MapClaim = {
  /** Coordonnée chunk (colonne `chunk_x`). */
  x: number;
  /** Coordonnée chunk (colonne `chunk_z`). */
  z: number;
  world: string;
  faction: MapFactionRef;
  /**
   * Colonne `claims.pasdic` : chunk PASDIC = territoire PROTÉGÉ (destruction
   * interdite, mode Adventure forcé — voir ClaimListener.java / PasdicCommand.java).
   */
  pasdic: boolean;
};

export type MapMarker = {
  name: string;
  world: string;
  /** Coordonnées bloc (table `warps` : x/y/z en REAL). */
  x: number;
  y: number;
  z: number;
  /** "warp" = warp public permanent ; "event" = warp d'événement actif. */
  kind: "warp" | "event";
};

export type MapClaimsPayload = { claims: MapClaim[]; generatedAt: string };
export type MapMarkersPayload = { markers: MapMarker[]; generatedAt: string };

/** Clé unique d'un claim (monde + coords chunk). */
export function claimKey(world: string, x: number, z: number): string {
  return `${world}:${x}:${z}`;
}

export function claimKeyOf(claim: Pick<MapClaim, "world" | "x" | "z">): string {
  return claimKey(claim.world, claim.x, claim.z);
}

/* ——— Palette canvas (miroir des tokens de globals.css) ——— */
export const MAP_COLORS = {
  bg: "#0e0c09", // ash-deep
  grid: "#3a342c", // iron-line
  axis: "#756f63", // steel
  bone: "#eee7d8",
  ember: "#c6491f",
  emberGlow: "#e8703c",
  gold: "#d9a441",
} as const;

/* ——— Couleur déterministe de faction ——— */

/** Angle d'or : écarte les teintes même pour des ids séquentiels. */
const GOLDEN_ANGLE = 137.508;

export function factionHue(factionId: number): number {
  const hue = (factionId * GOLDEN_ANGLE) % 360;
  return hue < 0 ? hue + 360 : hue;
}

/**
 * Saturation et luminosité bornées : lisible sur fond ash (#15130f),
 * jamais criard ni boueux. Variation légère selon l'id pour départager
 * deux factions à teinte proche.
 */
export function factionHsl(factionId: number): { h: number; s: number; l: number } {
  return {
    h: factionHue(factionId),
    s: 60 + (factionId % 3) * 5, // 60–70 %
    l: 55 + (factionId % 2) * 6, // 55–61 %
  };
}

/** Remplissage des chunks (translucide, laisse passer la grille). */
export function factionFill(factionId: number, alpha = 0.55): string {
  const { h, s, l } = factionHsl(factionId);
  return `hsla(${h.toFixed(1)}, ${s}%, ${l}%, ${alpha})`;
}

/** Contour plein d'un chunk / pastille de légende. */
export function factionStroke(factionId: number): string {
  const { h, s, l } = factionHsl(factionId);
  return `hsl(${h.toFixed(1)}, ${s}%, ${Math.min(l + 8, 72)}%)`;
}

/* ——— Mondes ——— */

const WORLD_LABELS: Record<string, string> = {
  world: "Overworld",
  world_nether: "Nether",
  world_the_end: "L’End",
};

export function worldLabel(world: string): string {
  return WORLD_LABELS[world] ?? world.replace(/_/g, " ");
}

/* ——— Recherche ——— */

export type MapSearchTarget =
  | { type: "coords"; x: number; z: number }
  | { type: "text"; query: string };

const COORDS_PATTERN = /^\s*(-?\d+)\s[,;\s]\s*(-?\d+)\s*$/;

/** « 12 -40 » cible un chunk ; tout le reste est une recherche de faction. */
export function parseMapSearch(raw: string): MapSearchTarget | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;
  const coords = COORDS_PATTERN.exec(trimmed);
  if (coords) {
    return { type: "coords", x: Number(coords[1]), z: Number(coords[2]) };
  }
  return { type: "text", query: trimmed.toLowerCase() };
}

/* ——— Géométrie ——— */

export type MapBounds = { minX: number; minZ: number; maxX: number; maxZ: number };

export function claimsBounds(points: readonly { x: number; z: number }[]): MapBounds | null {
  if (points.length === 0) return null;
  let minX = Infinity;
  let minZ = Infinity;
  let maxX = -Infinity;
  let maxZ = -Infinity;
  for (const p of points) {
    if (p.x < minX) minX = p.x;
    if (p.z < minZ) minZ = p.z;
    if (p.x > maxX) maxX = p.x;
    if (p.z > maxZ) maxZ = p.z;
  }
  return { minX, minZ, maxX, maxZ };
}

/** Centre de gravité des chunks d'une faction (pour « cliquer pour centrer »). */
export function claimsCentroid(points: readonly { x: number; z: number }[]): { x: number; z: number } | null {
  if (points.length === 0) return null;
  let sumX = 0;
  let sumZ = 0;
  for (const p of points) {
    sumX += p.x + 0.5;
    sumZ += p.z + 0.5;
  }
  return { x: sumX / points.length, z: sumZ / points.length };
}

/** Bloc de départ d'un chunk (coin nord-ouest). */
export function chunkToBlock(chunk: number): number {
  return chunk * 16;
}

/**
 * Spawn serveur (`/spawn` → `world.getSpawnLocation()`).
 *
 * Non stocké en base warps : lu au runtime depuis le monde Bukkit.
 * Coordonnées X/Z alignées sur Squaremap prod
 * (`/tiles/minecraft_overworld/settings.json` → `spawn`, marqueur « Spawn »).
 * Si le `/setworldspawn` change en jeu, mettre à jour ici.
 */
export const SERVER_SPAWN_BLOCK = { x: -67, z: -144 } as const;

/** Y nominal pour le marqueur API (la carte n’utilise que X/Z). */
export const SERVER_SPAWN_Y = 64 as const;

/**
 * Spawn exposé comme warp public pour `/api/map/markers` et la recherche
 * `/carte` (groupe warps). Nom « Spawn » — `/spawn` matche via le slash.
 */
export const SERVER_SPAWN_MARKER: MapMarker = {
  name: "Spawn",
  world: "world",
  x: SERVER_SPAWN_BLOCK.x,
  y: SERVER_SPAWN_Y,
  z: SERVER_SPAWN_BLOCK.z,
  kind: "warp",
};

/** True si le nom désigne le spawn serveur (évite un doublon DB). */
export function isServerSpawnMarkerName(name: string): boolean {
  const n = name.trim().toLowerCase();
  return n === "spawn" || n === "/spawn";
}

/** Centre caméra carte (coords chunk continues = blocs / 16). */
export const SERVER_SPAWN_CHUNK = {
  x: SERVER_SPAWN_BLOCK.x / 16,
  z: SERVER_SPAWN_BLOCK.z / 16,
} as const;
