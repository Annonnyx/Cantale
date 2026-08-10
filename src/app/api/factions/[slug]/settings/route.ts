import {
  updateFactionSettings,
  type FactionSettingsPatch,
} from "@/server/repo/faction-settings";
import { readJsonBody, requireFactionLeader } from "../../faction-guard";

export const dynamic = "force-dynamic";

const DESCRIPTION_MAX = 1000;

/**
 * POST /api/factions/[slug]/settings — réglages web de la faction.
 * Réservé au leader de CETTE faction (leader_uuid en DB, revérifié à chaque
 * appel). Corps : { recruitmentOpen?: boolean, description?: string } —
 * au moins une clé, description vide = retour à la description du plugin.
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  try {
    const { slug } = await params;

    const check = await requireFactionLeader(slug);
    if (!check.ok) return check.response;
    const { faction } = check;

    const body = await readJsonBody(request);
    if (!body) {
      return Response.json({ error: "Requête illisible." }, { status: 400 });
    }

    const patch: FactionSettingsPatch = {};

    if (body.recruitmentOpen !== undefined) {
      if (typeof body.recruitmentOpen !== "boolean") {
        return Response.json({ error: "recruitmentOpen doit être un booléen." }, { status: 400 });
      }
      patch.recruitmentOpen = body.recruitmentOpen;
    }

    if (body.description !== undefined) {
      if (typeof body.description !== "string") {
        return Response.json({ error: "description doit être une chaîne." }, { status: 400 });
      }
      const description = body.description.trim();
      if (description.length > DESCRIPTION_MAX) {
        return Response.json(
          { error: `La description ne doit pas dépasser ${DESCRIPTION_MAX} caractères.` },
          { status: 400 },
        );
      }
      patch.customDescription = description;
    }

    if (patch.recruitmentOpen === undefined && patch.customDescription === undefined) {
      return Response.json({ error: "Rien à enregistrer." }, { status: 400 });
    }

    await updateFactionSettings(faction.id, patch);
    return Response.json({ ok: true });
  } catch (error) {
    console.error("[api/factions/settings] Échec :", error);
    return Response.json(
      { error: "Action impossible pour l'instant. Réessaie dans un instant." },
      { status: 500 },
    );
  }
}
