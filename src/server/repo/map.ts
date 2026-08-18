import { cachedQuery } from "../cache";
import { query } from "../db";
import {
  SERVER_SPAWN_MARKER,
  isServerSpawnMarkerName,
  type MapClaim,
  type MapMarker,
} from "@/lib/map-utils";

/**
 * Tables `claims`, `factions` et `warps` du plugin CANTALE — lecture seule.
 *
 * RÈGLE /f secret (cf. repo/factions.ts) : une faction secrète reste visible
 * partout sur le site, mais ses CLAIMS ne doivent jamais transiter vers le
 * client — exclusion au niveau SQL via `NOT_SECRET`, même masqués. C'est le
 * seul endroit du site où le secret masque quelque chose (pas de notion de
 * membre côté site → claims cachés pour tous, comme la map in-game pour les
 * non-membres).
 *
 * Les deux lectures renvoient null si la base ne répond pas : la page /carte
 * et les routes API affichent alors un état gracieux plutôt qu'une 500.
 */
const NOT_SECRET = "COALESCE(f.secret_until, 0) <= UNIX_TIMESTAMP()";

type ClaimRow = {
  chunk_x: number;
  chunk_z: number;
  world: string;
  pasdic: number;
  faction_id: number;
  name: string;
  tag: string;
};

/**
 * Tous les claims des factions NON secrètes, avec le drapeau `pasdic`
 * (chunk protégé — voir ClaimListener.java / PasdicCommand.java).
 */
export async function getMapClaims(): Promise<MapClaim[] | null> {
  try {
    return await cachedQuery(["map-claims"], 30, async () => {
      const rows = await query<ClaimRow>(
        `SELECT c.chunk_x, c.chunk_z, c.world, c.pasdic,
                f.id AS faction_id, f.name, f.tag
         FROM claims c
         INNER JOIN factions f ON f.id = c.faction_id AND ${NOT_SECRET}
         ORDER BY c.world ASC, c.chunk_x ASC, c.chunk_z ASC`,
      );
      return rows.map((row) => ({
        x: Number(row.chunk_x),
        z: Number(row.chunk_z),
        world: row.world,
        pasdic: Number(row.pasdic) === 1,
        faction: {
          id: Number(row.faction_id),
          name: row.name,
          tag: row.tag,
        },
      }));
    });
  } catch (error) {
    console.error("[repo/map] getMapClaims — base injoignable :", error);
    return null;
  }
}

type WarpRow = {
  name: string;
  world: string;
  x: number;
  y: number;
  z: number;
  is_event: number;
};

/**
 * Warps affichables publiquement (colonnes confirmées dans WarpDAO.java :
 * name, world, x, y, z, yaw, pitch, is_event, is_active, created_at).
 *
 * Un warp est utilisable en jeu si c'est un warp permanent (`is_event = 0`)
 * ou un warp d'événement activé — miroir de WarpManager.teleportWarp().
 * Les warps d'événement désactivés sont donc exclus.
 *
 * Le spawn serveur n'est pas en table `warps` (monde Bukkit) : on l'injecte
 * en tête comme marqueur warp (`SERVER_SPAWN_MARKER`, −67 · −144) pour la
 * recherche `/carte` et `/api/map/markers`.
 */
export async function getMapWarps(): Promise<MapMarker[] | null> {
  try {
    return await cachedQuery(["map-warps"], 30, async () => {
      const rows = await query<WarpRow>(
        `SELECT name, world, x, y, z, is_event
         FROM warps
         WHERE is_event = 0 OR is_active = 1
         ORDER BY is_event ASC, name ASC`,
      );
      const fromDb = rows
        .map((row) => ({
          name: row.name,
          world: row.world,
          x: Number(row.x),
          y: Number(row.y),
          z: Number(row.z),
          kind: (Number(row.is_event) === 1 ? "event" : "warp") as MapMarker["kind"],
        }))
        .filter((marker) => !isServerSpawnMarkerName(marker.name));
      return [SERVER_SPAWN_MARKER, ...fromDb];
    });
  } catch (error) {
    console.error("[repo/map] getMapWarps — base injoignable :", error);
    return [SERVER_SPAWN_MARKER];
  }
}
