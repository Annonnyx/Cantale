import { getFactionByMemberUuid } from "@/server/repo/factions";
import {
  enqueueFactionAction,
  getApplicationById,
  resolveApplication,
} from "@/server/repo/faction-actions";
import { readJsonBody, requireFactionLeader } from "../../../../faction-guard";

export const dynamic = "force-dynamic";

/**
 * POST /api/factions/[slug]/applications/[id]/resolve — décision du leader.
 *
 * accept : la candidature passe à "accepted" (garde atomique anti-double-clic)
 *   puis une action join est enfilée pour le plugin — réponse { ok, actionId },
 *   le client polle le statut bridge. Le candidat est revérifié sans faction
 *   en DB fraîche avant l'acceptation.
 * refuse : la candidature passe à "refused", sans action de jeu.
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ slug: string; id: string }> },
) {
  try {
    const { slug, id } = await params;

    const applicationId = Number(id);
    if (!Number.isInteger(applicationId) || applicationId <= 0) {
      return Response.json({ error: "Candidature inconnue." }, { status: 404 });
    }

    const check = await requireFactionLeader(slug);
    if (!check.ok) return check.response;
    const { faction } = check;

    const body = await readJsonBody(request);
    if (!body) {
      return Response.json({ error: "Requête illisible." }, { status: 400 });
    }
    const decision = body.decision;
    if (decision !== "accept" && decision !== "refuse") {
      return Response.json(
        { error: "Décision invalide. Valeurs : accept, refuse." },
        { status: 400 },
      );
    }

    const application = await getApplicationById(applicationId);
    if (!application || application.factionId !== faction.id) {
      return Response.json({ error: "Candidature inconnue." }, { status: 404 });
    }
    if (application.status !== "pending") {
      return Response.json(
        { error: "Cette candidature a déjà été traitée." },
        { status: 409 },
      );
    }

    if (decision === "accept") {
      // Le candidat a pu rejoindre une autre faction entre-temps : état frais.
      const membership = await getFactionByMemberUuid(application.applicantUuid);
      if (membership) {
        return Response.json(
          { error: "Ce joueur a rejoint une faction entre-temps — refuse sa candidature." },
          { status: 409 },
        );
      }

      // Garde atomique : un seul accept concurrent passe, les autres → 409.
      const resolved = await resolveApplication(application.id, "accepted");
      if (!resolved) {
        return Response.json(
          { error: "Cette candidature a déjà été traitée." },
          { status: 409 },
        );
      }

      const actionId = await enqueueFactionAction(
        "join",
        faction.id,
        application.applicantUuid,
        null,
      );
      return Response.json({ ok: true, actionId });
    }

    const resolved = await resolveApplication(application.id, "refused");
    if (!resolved) {
      return Response.json(
        { error: "Cette candidature a déjà été traitée." },
        { status: 409 },
      );
    }
    return Response.json({ ok: true });
  } catch (error) {
    console.error("[api/factions/applications/resolve] Échec :", error);
    return Response.json(
      { error: "Action impossible pour l'instant. Réessaie dans un instant." },
      { status: 500 },
    );
  }
}
