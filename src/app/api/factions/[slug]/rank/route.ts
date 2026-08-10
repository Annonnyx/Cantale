import { getFactionRoster, type FactionRank } from "@/server/repo/factions";
import { enqueueFactionAction } from "@/server/repo/faction-actions";
import { readJsonBody, requireFactionLeader } from "../../faction-guard";

export const dynamic = "force-dynamic";

/** Grades délégables au web — LEADER reste refusé, le plugin le bloquerait de toute façon. */
const ASSIGNABLE_RANKS: readonly FactionRank[] = ["RECRUIT", "MEMBER", "VETERAN", "OFFICER"];

const UUID_PATTERN =
  /^[0-9a-fA-F]{8}-?[0-9a-fA-F]{4}-?[0-9a-fA-F]{4}-?[0-9a-fA-F]{4}-?[0-9a-fA-F]{12}$/;

/**
 * POST /api/factions/[slug]/rank — promote/demote d'un membre.
 * Leader uniquement, cible membre fraîche de la faction (roster relu en DB),
 * jamais le leader lui-même. L'action est enfilée dans web_faction_actions ;
 * le client polle /api/factions/actions/[id] pour connaître l'issue (~15 s).
 * Réponse : { ok: true, actionId }.
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

    const playerUuid = typeof body.playerUuid === "string" ? body.playerUuid.trim() : "";
    if (!UUID_PATTERN.test(playerUuid)) {
      return Response.json({ error: "Joueur invalide." }, { status: 400 });
    }

    const rank = typeof body.rank === "string" ? body.rank.toUpperCase() : "";
    if (!(ASSIGNABLE_RANKS as readonly string[]).includes(rank)) {
      return Response.json(
        { error: "Grade invalide. Valeurs : RECRUIT, MEMBER, VETERAN, OFFICER." },
        { status: 400 },
      );
    }

    const roster = await getFactionRoster(faction.id);
    const target = roster.find((member) => member.uuid === playerUuid);
    if (!target) {
      return Response.json(
        { error: "Ce joueur n'est pas membre de ta faction." },
        { status: 404 },
      );
    }
    if (target.rank === "LEADER" || target.uuid === faction.leaderUuid) {
      return Response.json(
        { error: "Le grade du leader ne se change que en jeu." },
        { status: 400 },
      );
    }
    if (target.rank === rank) {
      return Response.json({ error: "Ce joueur a déjà ce grade." }, { status: 400 });
    }

    const actionId = await enqueueFactionAction("set_rank", faction.id, target.uuid, rank);
    return Response.json({ ok: true, actionId });
  } catch (error) {
    console.error("[api/factions/rank] Échec :", error);
    return Response.json(
      { error: "Action impossible pour l'instant. Réessaie dans un instant." },
      { status: 500 },
    );
  }
}
