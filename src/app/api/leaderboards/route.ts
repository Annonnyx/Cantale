import {
  clampLeaderboardLimit,
  getLeaderboard,
  isLeaderboardMetric,
  LEADERBOARD_METRIC_KEYS,
} from "@/server/repo/leaderboards";
import { isLeaderboardPeriod, LEADERBOARD_PERIODS } from "@/server/repo/snapshots";

export const dynamic = "force-dynamic";

const UUID_PATTERN = /^[0-9a-fA-F]{8}-?[0-9a-fA-F]{4}-?[0-9a-fA-F]{4}-?[0-9a-fA-F]{4}-?[0-9a-fA-F]{12}$/;

/**
 * GET /api/leaderboards?metric=kills&period=semaine&limit=50&uuid=<uuid>
 *
 * - metric : cantox | playtime | kills | deaths | kill_streak | chat_reactions | votes | lives
 * - period : total | jour | semaine | mois
 *   Les périodes sont calculées par différence avec le snapshot quotidien le
 *   plus proche du début de période ; sans snapshot exploitable, la réponse
 *   retombe sur le cumul total avec `fallback: true`.
 * - limit  : 1..100 (défaut 50)
 * - uuid   : optionnel — ajoute `viewer` (rang + valeur du joueur, même hors top)
 *
 * Réponse : { metric, period, fallback, entries: [{ rank, uuid, username, value,
 * evolution }], viewer: { rank, value, evolution } | null }
 * `evolution` est la différence avec la progression de la période précédente,
 * null quand elle n'est pas calculable (pas de snapshot antérieur, mode total).
 */
export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;

  const metricParam = params.get("metric") ?? "cantox";
  if (!isLeaderboardMetric(metricParam)) {
    return Response.json(
      { error: `Métrique inconnue. Valeurs : ${LEADERBOARD_METRIC_KEYS.join(", ")}.` },
      { status: 400 },
    );
  }

  const periodParam = params.get("period") ?? "total";
  if (!isLeaderboardPeriod(periodParam)) {
    return Response.json(
      { error: `Période inconnue. Valeurs : ${LEADERBOARD_PERIODS.join(", ")}.` },
      { status: 400 },
    );
  }

  const uuidParam = params.get("uuid");
  if (uuidParam !== null && !UUID_PATTERN.test(uuidParam)) {
    return Response.json({ error: "uuid invalide." }, { status: 400 });
  }

  try {
    const result = await getLeaderboard({
      metric: metricParam,
      period: periodParam,
      limit: clampLeaderboardLimit(params.get("limit") ?? undefined),
      viewerUuid: uuidParam,
    });
    return Response.json(result, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("[api/leaderboards] Échec de lecture :", error);
    return Response.json({ error: "Classement indisponible." }, { status: 500 });
  }
}
