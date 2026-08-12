/**
 * Remplace Squaremap `tiles/players.json` derrière `/map-provider`.
 *
 * La carte `/carte` (Leaflet) n'affiche jamais les joueurs ; ce stub empêche
 * aussi le scrape / l'UI Squaremap proxifiée de divulguer positions, vies et
 * UUIDs via cantale.world.
 *
 * Ops (serveur MC) : désactiver aussi `player-tracker.enabled` dans Squaremap
 * config.yml pour couper la source — ce stub ne couvre que le proxy site.
 */
export const dynamic = "force-dynamic";

const EMPTY_PLAYERS = { max: 0, players: [] as const };

export async function GET() {
  return Response.json(EMPTY_PLAYERS, {
    headers: {
      "Cache-Control": "no-store",
      "X-Cantale-Map": "players-hidden",
    },
  });
}
