import { getFactionBySlug, type FactionSummary } from "@/server/repo/factions";
import { requireLinked, type SessionUser } from "@/server/session";

/**
 * Garde commune des routes d'administration de faction.
 *
 * Chaîne complète à chaque appel : session liée → faction lisible (les
 * factions /f secret restent gérables par leur leader — seuls leurs claims
 * sont masqués, cf. repo/map.ts) → l'uuid Minecraft de la session est bien
 * le leader_uuid en DB — la vraie propriété, pas un rôle Discord.
 */
export type FactionLeaderCheck =
  | { ok: true; user: SessionUser; faction: FactionSummary }
  | { ok: false; response: Response };

export async function requireFactionLeader(slug: string): Promise<FactionLeaderCheck> {
  const check = await requireLinked();
  if (!check.ok) return check;

  const faction = await getFactionBySlug(slug);
  if (!faction) {
    return { ok: false, response: Response.json({ error: "Faction inconnue." }, { status: 404 }) };
  }

  if (check.user.mc?.uuid !== faction.leaderUuid) {
    return {
      ok: false,
      response: Response.json(
        { error: "Seul le leader de cette faction peut faire ça." },
        { status: 403 },
      ),
    };
  }

  return { ok: true, user: check.user, faction };
}

/** Parse le corps JSON d'une requête — null si illisible ou non-objet. */
export async function readJsonBody(request: Request): Promise<Record<string, unknown> | null> {
  try {
    const body = (await request.json()) as unknown;
    if (!body || typeof body !== "object" || Array.isArray(body)) return null;
    return body as Record<string, unknown>;
  } catch {
    return null;
  }
}
