import { getActionStatus } from "@/server/repo/faction-actions";
import { requireLinked } from "@/server/session";

export const dynamic = "force-dynamic";

/**
 * GET /api/factions/actions/[id] — statut d'une action bridge, pour le polling
 * client (le plugin traite la file en ~15 s puis renseigne status/result).
 *
 * Lecture autorisée uniquement au joueur concerné par l'action ou au leader
 * actuel de la faction (leader_uuid en DB). Réponse : { id, status, result,
 * processedAt } — jamais de stack trace, jamais plus que le nécessaire.
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;

    const actionId = Number(id);
    if (!Number.isInteger(actionId) || actionId <= 0) {
      return Response.json({ error: "Action inconnue." }, { status: 404 });
    }

    const check = await requireLinked();
    if (!check.ok) return check.response;
    const mc = check.user.mc;
    if (!mc) {
      return Response.json({ error: "Compte Minecraft non lié." }, { status: 403 });
    }

    const action = await getActionStatus(actionId);
    if (!action) {
      return Response.json({ error: "Action inconnue." }, { status: 404 });
    }

    if (mc.uuid !== action.playerUuid && mc.uuid !== action.leaderUuid) {
      return Response.json(
        { error: "Cette action ne te concerne pas." },
        { status: 403 },
      );
    }

    return Response.json(
      {
        id: action.id,
        status: action.status,
        result: action.result,
        processedAt: action.processedAt,
      },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    console.error("[api/factions/actions] Échec :", error);
    return Response.json(
      { error: "Statut indisponible pour l'instant." },
      { status: 500 },
    );
  }
}
