import { getFactionByMemberUuid, getFactionBySlug } from "@/server/repo/factions";
import { getFactionSettings } from "@/server/repo/faction-settings";
import { createApplication } from "@/server/repo/faction-actions";
import { requireLinked } from "@/server/session";
import { readJsonBody } from "../../faction-guard";

export const dynamic = "force-dynamic";

const MESSAGE_MAX = 500;

/**
 * POST /api/factions/[slug]/apply — dépôt d'une candidature.
 *
 * Tout est revérifié ici, état frais en DB : session liée, absence de faction
 * (rôle Discord ET table faction_members), recrutement ouvert, message ≤ 500.
 * 200 succès · 400 message invalide · 401 non connecté · 403 non lié / recrutement
 * fermé · 404 faction inconnue · 409 déjà membre / candidature déjà en attente.
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  try {
    const { slug } = await params;

    const check = await requireLinked();
    if (!check.ok) return check.response;
    const { user } = check;
    const mc = user.mc;
    if (!mc) {
      return Response.json({ error: "Compte Minecraft non lié." }, { status: 403 });
    }

    const body = await readJsonBody(request);
    if (!body) {
      return Response.json({ error: "Requête illisible." }, { status: 400 });
    }
    const message = typeof body.message === "string" ? body.message.trim() : "";
    if (!message) {
      return Response.json({ error: "Écris quelques mots de motivation avant d'envoyer." }, { status: 400 });
    }
    if (message.length > MESSAGE_MAX) {
      return Response.json(
        { error: `Le message ne doit pas dépasser ${MESSAGE_MAX} caractères.` },
        { status: 400 },
      );
    }

    if (user.capabilities.hasFaction) {
      return Response.json({ error: "Tu as déjà une faction." }, { status: 409 });
    }

    // Inconnue ou secrète : même réponse, rien ne fuite.
    const faction = await getFactionBySlug(slug);
    if (!faction) {
      return Response.json({ error: "Faction inconnue." }, { status: 404 });
    }

    // Vérité DB fraîche — le rôle Discord seul ne suffit pas.
    const membership = await getFactionByMemberUuid(mc.uuid);
    if (membership) {
      return Response.json({ error: "Tu as déjà une faction." }, { status: 409 });
    }

    const settings = await getFactionSettings(faction.id);
    if (!settings.recruitmentOpen) {
      return Response.json(
        { error: "Cette faction ne recrute pas pour l'instant." },
        { status: 403 },
      );
    }

    const created = await createApplication(faction.id, mc.uuid, message);
    if (!created.ok) {
      return Response.json({ error: created.reason }, { status: 409 });
    }

    return Response.json({ ok: true });
  } catch (error) {
    console.error("[api/factions/apply] Échec :", error);
    return Response.json(
      { error: "Action impossible pour l'instant. Réessaie dans un instant." },
      { status: 500 },
    );
  }
}
