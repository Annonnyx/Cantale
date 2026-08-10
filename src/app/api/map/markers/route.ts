import { getMapWarps } from "@/server/repo/map";
import type { MapMarkersPayload } from "@/lib/map-utils";

export const dynamic = "force-dynamic";

/**
 * GET /api/map/markers → { markers: [{ name, world, x, y, z, kind }],
 * generatedAt }
 *
 * Warps publics permanents + warps d'événement actifs. Pas de spawn : la
 * position du spawn n'est pas stockée en base (monde Bukkit), on ne l'invente
 * pas.
 */
export async function GET() {
  const markers = await getMapWarps();
  if (markers === null) {
    return Response.json(
      { error: "Le registre des repères est muet pour l'instant." },
      { status: 503 },
    );
  }
  const payload: MapMarkersPayload = { markers, generatedAt: new Date().toISOString() };
  return Response.json(payload, {
    headers: { "Cache-Control": "public, max-age=30" },
  });
}
