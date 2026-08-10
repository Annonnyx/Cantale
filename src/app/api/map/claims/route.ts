import { getMapClaims } from "@/server/repo/map";
import type { MapClaimsPayload } from "@/lib/map-utils";

export const dynamic = "force-dynamic";

/**
 * GET /api/map/claims → { claims: [{ x, z, world, faction: { id, name, tag },
 * pasdic }], generatedAt }
 *
 * Les factions en /f secret sont exclues en SQL par le repo — jamais ici.
 * Cache court (30 s) : les territoires changent au rythme du jeu.
 */
export async function GET() {
  const claims = await getMapClaims();
  if (claims === null) {
    return Response.json(
      { error: "Le registre des territoires est muet pour l'instant." },
      { status: 503 },
    );
  }
  const payload: MapClaimsPayload = { claims, generatedAt: new Date().toISOString() };
  return Response.json(payload, {
    headers: { "Cache-Control": "public, max-age=30" },
  });
}
