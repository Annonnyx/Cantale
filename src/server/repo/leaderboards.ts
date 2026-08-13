import { cachedQuery } from "../cache";
import { query } from "../db";
import { publicRankingExcludeSql } from "../public-ranking-exclusions";
import {
  findClosestSnapshotDate,
  getPeriodBounds,
  SNAPSHOTS_TABLE,
  type LeaderboardPeriod,
} from "./snapshots";

/**
 * Classements publics — lecture seule sur `players` / `vote_stats` et sur la
 * table de snapshots du site (`web_snapshots_daily`).
 *
 * Les compteurs du plugin sont des CUMULS : seul le classement « total » lit
 * les colonnes en direct. Les périodes jour / semaine / mois sont calculées par
 * différence avec le snapshot quotidien le plus proche du début de période ;
 * sans snapshot exploitable, on retombe sur le total en le signalant
 * (`fallback: true`) plutôt que d'afficher des chiffres faux.
 *
 * Ce fichier héberge aussi les agrégats globaux de la page /stats (compteurs,
 * répartition des vies, records) — lectures publiques regroupées ici faute de
 * fichier repo dédié autorisé.
 */

// ——— Métriques ———————————————————————————————————————————————————————

export type LeaderboardUnit = "cantox" | "seconds" | "count";

type MetricDef = {
  label: string;
  /** Colonne cumulée de la table source (whitelist — jamais d'entrée brute). */
  column: string;
  /** Table source : players (défaut) ou vote_stats (jointe sur l'uuid). */
  source: "players" | "vote_stats";
  /** Colonne miroir dans web_snapshots_daily — null si la période est incalculable. */
  snapshotColumn: string | null;
  unit: LeaderboardUnit;
};

export const LEADERBOARD_METRICS = {
  cantox: { label: "Cantox", column: "balance", source: "players", snapshotColumn: "balance", unit: "cantox" },
  playtime: { label: "Temps de jeu", column: "playtime", source: "players", snapshotColumn: "playtime", unit: "seconds" },
  kills: { label: "Kills", column: "kills", source: "players", snapshotColumn: "kills", unit: "count" },
  deaths: { label: "Morts", column: "deaths", source: "players", snapshotColumn: "deaths", unit: "count" },
  kill_streak: { label: "Meilleure série", column: "kill_streak", source: "players", snapshotColumn: "kill_streak", unit: "count" },
  chat_reactions: { label: "Réactions", column: "chat_reactions", source: "players", snapshotColumn: "chat_reactions", unit: "count" },
  votes: { label: "Votes", column: "total_votes", source: "vote_stats", snapshotColumn: "total_votes", unit: "count" },
  // Les vies ne sont pas snapshotées : seul le cumul courant existe.
  lives: { label: "Vies", column: "lives", source: "players", snapshotColumn: null, unit: "count" },
} as const satisfies Record<string, MetricDef>;

export type LeaderboardMetric = keyof typeof LEADERBOARD_METRICS;

export const LEADERBOARD_METRIC_KEYS = Object.keys(LEADERBOARD_METRICS) as LeaderboardMetric[];

export function isLeaderboardMetric(value: unknown): value is LeaderboardMetric {
  return typeof value === "string" && value in LEADERBOARD_METRICS;
}

export type LeaderboardEntry = {
  rank: number;
  uuid: string;
  username: string;
  /** Valeur de la métrique sur la période (ou cumul en mode total). */
  value: number;
  /** Progression de la période précédente soustraite — null si incalculable. */
  evolution: number | null;
};

export type ViewerPosition = {
  rank: number;
  value: number;
  evolution: number | null;
};

export type LeaderboardResult = {
  metric: LeaderboardMetric;
  period: LeaderboardPeriod;
  /**
   * true quand la période demandée n'a pas de snapshot exploitable :
   * le classement total est renvoyé à la place, à signaler dans l'UI.
   */
  fallback: boolean;
  entries: LeaderboardEntry[];
  /** Position du joueur demandé, même hors du top — null si inconnu. */
  viewer: ViewerPosition | null;
};

export const LEADERBOARD_DEFAULT_LIMIT = 50;
export const LEADERBOARD_MAX_LIMIT = 100;

/** Entier borné, sûr à inliner dans un LIMIT (jamais d'entrée brute). */
export function clampLeaderboardLimit(limit: unknown): number {
  const parsed = typeof limit === "string" ? Number.parseInt(limit, 10) : Number(limit);
  if (!Number.isFinite(parsed)) return LEADERBOARD_DEFAULT_LIMIT;
  return Math.max(1, Math.min(LEADERBOARD_MAX_LIMIT, Math.floor(parsed)));
}

type LeaderboardRow = {
  uuid: string;
  username: string;
  value: number | string | null;
  prev_value: number | string | null;
};

type RankRow = { rank: number | string };

type ViewerRow = { value: number | string | null; prev_value: number | string | null };

function toNumber(value: number | string | null | undefined): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

/**
 * Classement d'une métrique sur une période.
 * `viewerUuid` (optionnel) renvoie la position du joueur même hors du top.
 * Remonte les erreurs SQL : à l'appelant (page/route) de dégrader gracieusement.
 *
 * Le tableau (sans visiteur) est mis en cache 30 s — partagé entre tous les
 * visiteurs. La position hors top est cachée à part, par UUID.
 */
export async function getLeaderboard(options: {
  metric: LeaderboardMetric;
  period: LeaderboardPeriod;
  limit?: number;
  viewerUuid?: string | null;
}): Promise<LeaderboardResult> {
  const { metric, period } = options;
  const safeLimit = clampLeaderboardLimit(options.limit ?? LEADERBOARD_DEFAULT_LIMIT);
  const viewerUuid = options.viewerUuid ?? null;

  const core = await cachedQuery(
    ["leaderboard-core", metric, period, String(safeLimit)],
    30,
    () => fetchLeaderboardCore(metric, period, safeLimit),
  );

  let viewer: ViewerPosition | null = null;
  if (viewerUuid) {
    const inTop = core.entries.find(
      (entry) => entry.uuid.toLowerCase() === viewerUuid.toLowerCase(),
    );
    if (inTop) {
      viewer = { rank: inTop.rank, value: inTop.value, evolution: inTop.evolution };
    } else {
      viewer = await cachedQuery(
        ["leaderboard-viewer", metric, period, viewerUuid.toLowerCase()],
        30,
        () => fetchViewerPosition(metric, period, viewerUuid),
      );
    }
  }

  return { ...core, viewer };
}

type LeaderboardCore = Omit<LeaderboardResult, "viewer">;

async function resolveSnapshots(
  metric: LeaderboardMetric,
  period: LeaderboardPeriod,
): Promise<{ startSnapshot: string | null; previousSnapshot: string | null; fallback: boolean }> {
  const def = LEADERBOARD_METRICS[metric];
  if (period === "total" || def.snapshotColumn === null) {
    return { startSnapshot: null, previousSnapshot: null, fallback: period !== "total" };
  }
  const bounds = getPeriodBounds(period);
  const [startSnapshot, previousSnapshot] = await Promise.all([
    findClosestSnapshotDate(bounds.startDate, bounds.toleranceDays),
    findClosestSnapshotDate(bounds.previousStartDate, bounds.toleranceDays, bounds.startDate),
  ]);
  return {
    startSnapshot,
    previousSnapshot: startSnapshot ? previousSnapshot : null,
    fallback: !startSnapshot,
  };
}

function leaderboardSql(metric: LeaderboardMetric, startSnapshot: string | null, previousSnapshot: string | null) {
  const def = LEADERBOARD_METRICS[metric];
  const votesJoin =
    def.source === "vote_stats" ? "LEFT JOIN vote_stats v ON v.player_uuid = p.uuid" : "";
  const snapshotJoins = startSnapshot
    ? `LEFT JOIN ${SNAPSHOTS_TABLE} s0
         ON s0.player_uuid = p.uuid AND s0.snapshot_date = :s0Date
       ${
         previousSnapshot
           ? `LEFT JOIN ${SNAPSHOTS_TABLE} s1
              ON s1.player_uuid = p.uuid AND s1.snapshot_date = :s1Date`
           : ""
       }`
    : "";
  const joins = `${votesJoin} ${snapshotJoins}`;
  const currentTotal =
    def.source === "vote_stats" ? "COALESCE(v.total_votes, 0)" : `p.${def.column}`;
  const valueExpr = startSnapshot
    ? `${currentTotal} - COALESCE(s0.${def.snapshotColumn}, 0)`
    : currentTotal;
  const prevExpr =
    startSnapshot && previousSnapshot
      ? `CASE
           WHEN s0.player_uuid IS NOT NULL AND s1.player_uuid IS NOT NULL
           THEN s0.${def.snapshotColumn} - s1.${def.snapshotColumn}
           ELSE NULL
         END`
      : "NULL";
  const params: Record<string, string | number> = {};
  if (startSnapshot) params.s0Date = startSnapshot;
  if (previousSnapshot) params.s1Date = previousSnapshot;
  const excludeSql = publicRankingExcludeSql("p.username", "p.uuid");
  const selectSql = `SELECT p.uuid, p.username, ${valueExpr} AS value, ${prevExpr} AS prev_value
     FROM players p ${joins}
     WHERE ${excludeSql}`;
  return { valueExpr, joins, params, excludeSql, selectSql };
}

function toEvolution(value: number, prev: number | string | null): number | null {
  return prev === null ? null : value - toNumber(prev);
}

async function fetchLeaderboardCore(
  metric: LeaderboardMetric,
  period: LeaderboardPeriod,
  safeLimit: number,
): Promise<LeaderboardCore> {
  const { startSnapshot, previousSnapshot, fallback } = await resolveSnapshots(metric, period);
  const { selectSql, params } = leaderboardSql(metric, startSnapshot, previousSnapshot);

  const rows = await query<LeaderboardRow>(
    `${selectSql} ORDER BY value DESC, p.username ASC LIMIT ${safeLimit}`,
    params,
  );

  const entries: LeaderboardEntry[] = rows.map((row, index) => {
    const value = toNumber(row.value);
    return {
      rank: index + 1,
      uuid: row.uuid,
      username: row.username,
      value,
      evolution: toEvolution(value, row.prev_value),
    };
  });

  return { metric, period, fallback, entries };
}

async function fetchViewerPosition(
  metric: LeaderboardMetric,
  period: LeaderboardPeriod,
  viewerUuid: string,
): Promise<ViewerPosition | null> {
  const { startSnapshot, previousSnapshot } = await resolveSnapshots(metric, period);
  const { selectSql, valueExpr, joins, params, excludeSql } = leaderboardSql(
    metric,
    startSnapshot,
    previousSnapshot,
  );

  const viewerRows = await query<ViewerRow>(`${selectSql} AND p.uuid = :viewerUuid LIMIT 1`, {
    ...params,
    viewerUuid,
  });
  const viewerRow = viewerRows[0];
  if (!viewerRow) return null;

  const viewerValue = toNumber(viewerRow.value);
  const rankRows = await query<RankRow>(
    `SELECT COUNT(*) + 1 AS rank FROM (
       SELECT ${valueExpr} AS value FROM players p ${joins}
       WHERE ${excludeSql}
     ) ranked
     WHERE ranked.value > :viewerValue`,
    { ...params, viewerValue },
  );
  return {
    rank: toNumber(rankRows[0]?.rank),
    value: viewerValue,
    evolution: toEvolution(viewerValue, viewerRow.prev_value),
  };
}

// ——— Agrégats globaux (page /stats) ———————————————————————————————————

export type GlobalCounters = {
  /** Somme des balances — la masse de Cantox en circulation. */
  cantoxInCirculation: number;
  /** Somme des vies positives (les bannis, à 0 ou moins, ne comptent plus). */
  livesInCirculation: number;
  /** Morts cumulées, tous joueurs confondus. */
  totalDeaths: number;
};

export async function getGlobalCounters(): Promise<GlobalCounters> {
  return cachedQuery(["global-counters"], 30, async () => {
    const rows = await query<{
      cantox: number | string | null;
      lives: number | string | null;
      deaths: number | string | null;
    }>(
      `SELECT COALESCE(SUM(balance), 0) AS cantox,
              COALESCE(SUM(GREATEST(lives, 0)), 0) AS lives,
              COALESCE(SUM(deaths), 0) AS deaths
       FROM players
       WHERE ${publicRankingExcludeSql("username", "uuid")}`,
    );
    const row = rows[0];
    return {
      cantoxInCirculation: toNumber(row?.cantox),
      livesInCirculation: toNumber(row?.lives),
      totalDeaths: toNumber(row?.deaths),
    };
  });
}

export type LivesDistribution = {
  three: number;
  two: number;
  one: number;
  /** Bannis — 0 vie restante (ou moins, selon l'historique du plugin). */
  zero: number;
};

export async function getLivesDistribution(): Promise<LivesDistribution> {
  return cachedQuery(["lives-distribution"], 30, async () => {
    const rows = await query<{
      three: number | string | null;
      two: number | string | null;
      one: number | string | null;
      zero: number | string | null;
    }>(
      `SELECT COALESCE(SUM(CASE WHEN lives >= 3 THEN 1 ELSE 0 END), 0) AS three,
              COALESCE(SUM(CASE WHEN lives = 2 THEN 1 ELSE 0 END), 0) AS two,
              COALESCE(SUM(CASE WHEN lives = 1 THEN 1 ELSE 0 END), 0) AS one,
              COALESCE(SUM(CASE WHEN lives <= 0 THEN 1 ELSE 0 END), 0) AS zero
       FROM players
       WHERE ${publicRankingExcludeSql("username", "uuid")}`,
    );
    const row = rows[0];
    return {
      three: toNumber(row?.three),
      two: toNumber(row?.two),
      one: toNumber(row?.one),
      zero: toNumber(row?.zero),
    };
  });
}

export type RecordHolder = {
  uuid: string;
  username: string;
  value: number;
} | null;

/** Record absolu de série de kills, et son détenteur. */
export async function getKillStreakRecord(): Promise<RecordHolder> {
  return cachedQuery(["kill-streak-record"], 30, async () => {
    const rows = await query<{ uuid: string; username: string; value: number | string }>(
      `SELECT uuid, username, kill_streak AS value FROM players
       WHERE ${publicRankingExcludeSql("username", "uuid")}
       ORDER BY kill_streak DESC, username ASC LIMIT 1`,
    );
    const row = rows[0];
    return row
      ? { uuid: row.uuid, username: row.username, value: toNumber(row.value) }
      : null;
  });
}

/** Plus grand nombre de morts, et son détenteur. */
export async function getDeathsRecord(): Promise<RecordHolder> {
  return cachedQuery(["deaths-record"], 30, async () => {
    const rows = await query<{ uuid: string; username: string; value: number | string }>(
      `SELECT uuid, username, deaths AS value FROM players
       WHERE ${publicRankingExcludeSql("username", "uuid")}
       ORDER BY deaths DESC, username ASC LIMIT 1`,
    );
    const row = rows[0];
    return row
      ? { uuid: row.uuid, username: row.username, value: toNumber(row.value) }
      : null;
  });
}
