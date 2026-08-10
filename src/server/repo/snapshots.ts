import { query } from "../db";

/**
 * Table `web_snapshots_daily` — propriété du site (seule table où le site écrit).
 *
 * Les compteurs du plugin (players, vote_stats) sont des CUMULS sans historique :
 * impossible d'en déduire une progression par période. Cette table photographie
 * les cumuls de chaque joueur une fois par jour, ce qui permet de calculer
 * « jour / semaine / mois » par différence avec le snapshot de référence.
 *
 * Dates au format SQL DATE, calées sur le calendrier de Paris (fuseau du serveur
 * de jeu) pour rester cohérentes avec les bornes de périodes du site.
 */

export const SNAPSHOTS_TABLE = "web_snapshots_daily";

/** Périodes de classement — `total` lit les cumuls directs, sans snapshot. */
export type LeaderboardPeriod = "total" | "jour" | "semaine" | "mois";

export const LEADERBOARD_PERIODS = ["total", "jour", "semaine", "mois"] as const;

export function isLeaderboardPeriod(value: unknown): value is LeaderboardPeriod {
  return (
    typeof value === "string" &&
    (LEADERBOARD_PERIODS as readonly string[]).includes(value)
  );
}

/** Tolérance (en jours) entre le début de période et le snapshot retenu. */
const PERIOD_TOLERANCE_DAYS: Record<Exclude<LeaderboardPeriod, "total">, number> = {
  jour: 1,
  semaine: 3,
  mois: 15,
};

// ——— Dates de Paris ————————————————————————————————————————————————

const PARIS_DATE_FORMATTER = new Intl.DateTimeFormat("en-CA", {
  timeZone: "Europe/Paris",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

/** Date calendaire de Paris au format SQL DATE (YYYY-MM-DD). */
export function parisDateString(date: Date = new Date()): string {
  return PARIS_DATE_FORMATTER.format(date);
}

/** ± jours sur une date YYYY-MM-DD (arithmétique calendaire, sans heure). */
function shiftDays(dateStr: string, days: number): string {
  const [year, month, day] = dateStr.split("-").map(Number);
  const shifted = new Date(Date.UTC(year, month - 1, day) + days * 86_400_000);
  const y = shifted.getUTCFullYear();
  const m = String(shifted.getUTCMonth() + 1).padStart(2, "0");
  const d = String(shifted.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/** Premier jour du mois, ± mois, sur une date YYYY-MM-DD. */
function shiftMonthsToFirst(dateStr: string, months: number): string {
  const [year, month] = dateStr.split("-").map(Number);
  const shifted = new Date(Date.UTC(year, month - 1 + months, 1));
  const y = shifted.getUTCFullYear();
  const m = String(shifted.getUTCMonth() + 1).padStart(2, "0");
  return `${y}-${m}-01`;
}

export type PeriodBounds = {
  /** Date de début de la période courante (YYYY-MM-DD, calendrier de Paris). */
  startDate: string;
  /** Date de début de la période précédente. */
  previousStartDate: string;
  /** Distance maximale acceptée entre startDate et le snapshot retenu (jours). */
  toleranceDays: number;
};

/**
 * Bornes calendaires d'une période glissante alignée sur Paris :
 * - jour    → aujourd'hui (minuit), veille = hier ;
 * - semaine → lundi de la semaine ISO courante, veille = lundi - 7 j ;
 * - mois    → 1er du mois courant, veille = 1er du mois précédent.
 */
export function getPeriodBounds(
  period: Exclude<LeaderboardPeriod, "total">,
  now: Date = new Date(),
): PeriodBounds {
  const today = parisDateString(now);
  const toleranceDays = PERIOD_TOLERANCE_DAYS[period];

  if (period === "jour") {
    return { startDate: today, previousStartDate: shiftDays(today, -1), toleranceDays };
  }

  if (period === "semaine") {
    const [year, month, day] = today.split("-").map(Number);
    // Jour de semaine de la date calendaire de Paris (0 = dimanche).
    const dayOfWeek = new Date(Date.UTC(year, month - 1, day)).getUTCDay();
    const sinceMonday = (dayOfWeek + 6) % 7;
    const monday = shiftDays(today, -sinceMonday);
    return { startDate: monday, previousStartDate: shiftDays(monday, -7), toleranceDays };
  }

  const first = shiftMonthsToFirst(today, 0);
  return { startDate: first, previousStartDate: shiftMonthsToFirst(today, -1), toleranceDays };
}

// ——— Écriture (cron) ————————————————————————————————————————————————

/**
 * Schéma idempotent — appelé par la route cron avant chaque upsert.
 * PK composée (player_uuid, snapshot_date) : un seul relevé par joueur et par jour,
 * un second appel le même jour écrase proprement le premier.
 */
export async function ensureSnapshotsTable(): Promise<void> {
  await query<never>(
    `CREATE TABLE IF NOT EXISTS ${SNAPSHOTS_TABLE} (
       player_uuid VARCHAR(36) NOT NULL,
       snapshot_date DATE NOT NULL,
       balance DOUBLE NOT NULL DEFAULT 0,
       kills INT NOT NULL DEFAULT 0,
       deaths INT NOT NULL DEFAULT 0,
       kill_streak INT NOT NULL DEFAULT 0,
       playtime BIGINT NOT NULL DEFAULT 0,
       chat_reactions INT NOT NULL DEFAULT 0,
       total_votes INT NOT NULL DEFAULT 0,
       PRIMARY KEY (player_uuid, snapshot_date)
     ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,
  );
}

export type SnapshotRunResult = {
  /** Date calendaire du relevé (YYYY-MM-DD, Paris). */
  snapshotDate: string;
  /** Nombre de lignes présentes pour cette date après l'upsert. */
  players: number;
};

/**
 * Photographie les cumuls courants de tous les joueurs pour la date du jour
 * (Paris). Idempotent : un appel répété le même jour met à jour la même ligne.
 */
export async function runDailySnapshot(now: Date = new Date()): Promise<SnapshotRunResult> {
  const snapshotDate = parisDateString(now);
  await ensureSnapshotsTable();
  await query<never>(
    `INSERT INTO ${SNAPSHOTS_TABLE}
       (player_uuid, snapshot_date, balance, kills, deaths, kill_streak, playtime, chat_reactions, total_votes)
     SELECT p.uuid, :snapshotDate, p.balance, p.kills, p.deaths, p.kill_streak, p.playtime, p.chat_reactions,
            COALESCE(v.total_votes, 0)
     FROM players p
     LEFT JOIN vote_stats v ON v.player_uuid = p.uuid
     ON DUPLICATE KEY UPDATE
       balance = VALUES(balance),
       kills = VALUES(kills),
       deaths = VALUES(deaths),
       kill_streak = VALUES(kill_streak),
       playtime = VALUES(playtime),
       chat_reactions = VALUES(chat_reactions),
       total_votes = VALUES(total_votes)`,
    { snapshotDate },
  );
  const rows = await query<{ total: number }>(
    `SELECT COUNT(*) AS total FROM ${SNAPSHOTS_TABLE} WHERE snapshot_date = :snapshotDate`,
    { snapshotDate },
  );
  return { snapshotDate, players: Number(rows[0]?.total ?? 0) };
}

// ——— Lecture (classements par période) ———————————————————————————————

type SnapshotDateRow = { snapshot_date: string };

/**
 * Snapshot le plus proche d'une date cible (distance en jours calendaires).
 * Refuse les relevés au-delà de `toleranceDays` — un snapshot trop lointain
 * produirait des différences sans rapport avec la période demandée.
 * `beforeDate` exclut les relevés postérieurs ou égaux à cette date (utilisé
 * pour la période précédente afin de ne pas retomber sur le même relevé).
 */
export async function findClosestSnapshotDate(
  targetDate: string,
  toleranceDays: number,
  beforeDate: string | null = null,
): Promise<string | null> {
  try {
    const rows = await query<SnapshotDateRow>(
      `SELECT DATE_FORMAT(snapshot_date, '%Y-%m-%d') AS snapshot_date
       FROM ${SNAPSHOTS_TABLE}
       WHERE ABS(DATEDIFF(snapshot_date, :targetDate)) <= :toleranceDays
         ${beforeDate ? "AND snapshot_date < :beforeDate" : ""}
       ORDER BY ABS(DATEDIFF(snapshot_date, :targetDate)) ASC, snapshot_date DESC
       LIMIT 1`,
      beforeDate
        ? { targetDate, toleranceDays, beforeDate }
        : { targetDate, toleranceDays },
    );
    return rows[0]?.snapshot_date ?? null;
  } catch {
    // Table absente (cron jamais exécuté) : aucune période calculable.
    return null;
  }
}
