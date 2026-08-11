/**
 * Bridge Squaremap ↔ Leaflet pour la carte unifiée /carte.
 *
 * Squaremap (CRS.Simple) convertit les blocs Minecraft ainsi :
 *   scale = 1 / 2^maxZoom
 *   lat = (-z) * scale ,  lng = x * scale
 * Tuiles : `{base}/tiles/{world}/{z}/{x}_{y}.png` (tileSize 512).
 */

/** Mondes Bukkit (plugin / MySQL) → dossier tuiles Squaremap. */
export const BUKKIT_TO_SQUAREMAP: Record<string, string> = {
  world: "minecraft_overworld",
  world_nether: "minecraft_the_nether",
  world_the_end: "minecraft_the_end",
};

export const SQUAREMAP_TO_BUKKIT: Record<string, string> = {
  minecraft_overworld: "world",
  minecraft_the_nether: "world_nether",
  minecraft_the_end: "world_the_end",
};

export type SquaremapWorldSettings = {
  spawn: { x: number; z: number };
  zoom: { def: number; max: number; extra: number };
};

export const DEFAULT_SQUAREMAP_ZOOM: SquaremapWorldSettings["zoom"] = {
  def: 3,
  max: 3,
  extra: 2,
};

export function squaremapWorldForBukkit(bukkitWorld: string): string {
  return BUKKIT_TO_SQUAREMAP[bukkitWorld] ?? bukkitWorld;
}

export function bukkitWorldForSquaremap(squaremapWorld: string): string {
  return SQUAREMAP_TO_BUKKIT[squaremapWorld] ?? squaremapWorld;
}

/** Facteur Squaremap : 1 unité CRS = 2^maxZoom blocs. */
export function squaremapScale(maxZoom: number): number {
  return 1 / Math.pow(2, maxZoom);
}

/** Coordonnées bloc → LatLng Leaflet (CRS.Simple Squaremap). */
export function blockToLatLng(
  blockX: number,
  blockZ: number,
  maxZoom: number,
): [number, number] {
  const s = squaremapScale(maxZoom);
  return [(-blockZ) * s, blockX * s];
}

/** LatLng Leaflet → blocs Minecraft. */
export function latLngToBlock(
  lat: number,
  lng: number,
  maxZoom: number,
): { x: number; z: number } {
  const s = squaremapScale(maxZoom);
  return { x: lng / s, z: -lat / s };
}

/**
 * Base same-origin (ou HTTPS directe) pour les tuiles / settings Squaremap.
 * Toujours sans slash final.
 */
export function mapTileBase(providerPublicUrl: string | null): string | null {
  if (!providerPublicUrl) return null;
  if (providerPublicUrl.startsWith("/")) {
    return "/map-provider";
  }
  try {
    const url = new URL(providerPublicUrl);
    const path = url.pathname.replace(/\/index\.html$/i, "").replace(/\/+$/, "");
    return `${url.origin}${path}`;
  } catch {
    return null;
  }
}

export function squaremapTileUrlTemplate(
  tileBase: string,
  squaremapWorld: string,
): string {
  return `${tileBase}/tiles/${squaremapWorld}/{z}/{x}_{y}.png`;
}

export function squaremapSettingsUrl(
  tileBase: string,
  squaremapWorld: string,
): string {
  return `${tileBase}/tiles/${squaremapWorld}/settings.json`;
}
