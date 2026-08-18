import type { ResultSetHeader } from "mysql2/promise";
import { query, type SqlValue } from "../db";

/**
 * Pont web → plugin pour les actions de faction.
 *
 * Deux tables distinctes :
 *
 * - `web_faction_applications` (créée ici, web-only) : candidatures des
 *   joueurs, avec message de motivation et résolution par le leader.
 *
 * - `web_faction_actions` (créée et consommée par le PLUGIN — jamais créée
 *   ici) : file d'actions de jeu. Le site y INSERT uniquement ; le plugin
 *   traite en ~15 s puis renseigne status ('done'/'failed'), result
 *   (raison FR) et processed_at. Contrat :
 *     join    : payload NULL (entrée comme RECRUIT)
 *     leave   : payload NULL
 *     set_rank: payload = 'RECRUIT'|'MEMBER'|'VETERAN'|'OFFICER' (LEADER refusé)
 *     disband : player_uuid = uuid du leader
 *
 * `query()` ne distingue pas les ResultSetHeader : pour les écritures on
 * récupère insertId / affectedRows via un cast local documenté.
 */

async function execute(sql: string, params: Record<string, SqlValue>): Promise<ResultSetHeader> {
  // Pour INSERT/UPDATE, mysql2 retourne un ResultSetHeader (que query() type en T[]).
  return (await query<never>(sql, params)) as unknown as ResultSetHeader;
}

/* ——— Table des candidatures (web-only, migrate paresseux) ——— */

const CREATE_APPLICATIONS_TABLE = `
  CREATE TABLE IF NOT EXISTS web_faction_applications (
    id INT NOT NULL AUTO_INCREMENT,
    faction_id INT NOT NULL,
    applicant_uuid VARCHAR(36) NOT NULL,
    message VARCHAR(500) NOT NULL,
    status VARCHAR(10) NOT NULL DEFAULT 'pending',
    created_at INT NOT NULL,
    resolved_at INT NULL,
    PRIMARY KEY (id),
    INDEX idx_applications_faction_status (faction_id, status),
    INDEX idx_applications_applicant_status (applicant_uuid, status)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
`;

let applicationsTableReady: Promise<void> | null = null;

function ensureApplicationsTable(): Promise<void> {
  if (!applicationsTableReady) {
    applicationsTableReady = query(CREATE_APPLICATIONS_TABLE)
      .then(() => undefined)
      .catch((error) => {
        applicationsTableReady = null;
        throw error;
      });
  }
  return applicationsTableReady;
}

export type ApplicationStatus = "pending" | "accepted" | "refused";

export type FactionApplication = {
  id: number;
  factionId: number;
  applicantUuid: string;
  /** Pseudo via jointure players — null si le joueur est inconnu. */
  applicantUsername: string | null;
  message: string;
  status: ApplicationStatus;
  /** unix secondes. */
  createdAt: number;
  /** unix secondes, null tant que la candidature est en attente. */
  resolvedAt: number | null;
};

type ApplicationRow = {
  id: number;
  faction_id: number;
  applicant_uuid: string;
  username: string | null;
  message: string;
  status: string;
  created_at: number;
  resolved_at: number | null;
};

function toApplication(row: ApplicationRow): FactionApplication {
  const status = row.status === "accepted" || row.status === "refused" ? row.status : "pending";
  return {
    id: Number(row.id),
    factionId: Number(row.faction_id),
    applicantUuid: row.applicant_uuid,
    applicantUsername: row.username,
    message: row.message,
    status,
    createdAt: Number(row.created_at),
    resolvedAt: row.resolved_at === null ? null : Number(row.resolved_at),
  };
}

/**
 * Dépose une candidature. Refusée (sans écriture) si le joueur a déjà une
 * candidature en attente — peu importe la faction : on ne postule qu'à un
 * endroit à la fois.
 */
export async function createApplication(
  factionId: number,
  applicantUuid: string,
  message: string,
): Promise<{ ok: true; id: number } | { ok: false; reason: string }> {
  await ensureApplicationsTable();
  const existing = await query<{ id: number }>(
    `SELECT id FROM web_faction_applications
     WHERE applicant_uuid = :uuid AND status = 'pending'
     LIMIT 1`,
    { uuid: applicantUuid },
  );
  if (existing.length > 0) {
    return { ok: false, reason: "Tu as déjà une candidature en attente." };
  }
  const result = await execute(
    `INSERT INTO web_faction_applications (faction_id, applicant_uuid, message, status, created_at)
     VALUES (:factionId, :uuid, :message, 'pending', UNIX_TIMESTAMP())`,
    { factionId, uuid: applicantUuid, message },
  );
  return { ok: true, id: Number(result.insertId) };
}

/** Candidatures en attente d'une faction, les plus anciennes d'abord. */
export async function listPendingByFaction(factionId: number): Promise<FactionApplication[]> {
  await ensureApplicationsTable();
  const rows = await query<ApplicationRow>(
    `SELECT a.id, a.faction_id, a.applicant_uuid, p.username, a.message, a.status, a.created_at, a.resolved_at
     FROM web_faction_applications a
     LEFT JOIN players p ON p.uuid = a.applicant_uuid
     WHERE a.faction_id = :factionId AND a.status = 'pending'
     ORDER BY a.created_at ASC`,
    { factionId },
  );
  return rows.map(toApplication);
}

/** Candidature par id — pour la résolution (revérification complète côté route). */
export async function getApplicationById(id: number): Promise<FactionApplication | null> {
  await ensureApplicationsTable();
  const rows = await query<ApplicationRow>(
    `SELECT a.id, a.faction_id, a.applicant_uuid, p.username, a.message, a.status, a.created_at, a.resolved_at
     FROM web_faction_applications a
     LEFT JOIN players p ON p.uuid = a.applicant_uuid
     WHERE a.id = :id
     LIMIT 1`,
    { id },
  );
  const row = rows[0];
  return row ? toApplication(row) : null;
}

/**
 * Marque une candidature accepted/refused. Garde atomique sur status='pending'
 * (deux clics concurrents ne produisent qu'une seule résolution) :
 * renvoie false si elle était déjà résolue.
 */
export async function resolveApplication(
  id: number,
  decision: "accepted" | "refused",
): Promise<boolean> {
  await ensureApplicationsTable();
  const result = await execute(
    `UPDATE web_faction_applications
     SET status = :decision, resolved_at = UNIX_TIMESTAMP()
     WHERE id = :id AND status = 'pending'`,
    { id, decision },
  );
  return result.affectedRows > 0;
}

/* ——— File d'actions bridge (table du plugin, INSERT seulement) ——— */

export type FactionActionType = "join" | "leave" | "set_rank" | "disband";

/**
 * Enfile une action de jeu pour le plugin. Renvoie l'id de l'action,
 * à poller ensuite via getActionStatus.
 */
export async function enqueueFactionAction(
  type: FactionActionType,
  factionId: number,
  playerUuid: string,
  payload: string | null,
): Promise<number> {
  const result = await execute(
    `INSERT INTO web_faction_actions (type, faction_id, player_uuid, payload)
     VALUES (:type, :factionId, :playerUuid, :payload)`,
    { type, factionId, playerUuid, payload },
  );
  return Number(result.insertId);
}

export type FactionActionStatus = {
  id: number;
  type: string;
  factionId: number;
  playerUuid: string;
  /** 'pending' tant que le plugin n'a pas traité, puis 'done' / 'failed'. */
  status: string;
  /** Raison FR renseignée par le plugin en cas d'échec. */
  result: string | null;
  /** unix secondes, null tant que l'action n'est pas traitée. */
  processedAt: number | null;
  /** Leader actuel de la faction — pour l'autorisation du polling. */
  leaderUuid: string | null;
};

type ActionRow = {
  id: number;
  type: string;
  faction_id: number;
  player_uuid: string;
  status: string;
  result: string | null;
  processed_at: number | string | null;
  leader_uuid: string | null;
};

/**
 * Statut d'une action bridge, pour le polling client.
 * Jointure factions sans filtre secret : il ne s'agit pas d'affichage
 * de position mais d'autorisation (le leader d'une faction secrète doit
 * pouvoir suivre ses propres actions).
 */
export async function getActionStatus(id: number): Promise<FactionActionStatus | null> {
  const rows = await query<ActionRow>(
    `SELECT a.id, a.type, a.faction_id, a.player_uuid, a.status, a.result, a.processed_at,
            f.leader_uuid
     FROM web_faction_actions a
     LEFT JOIN factions f ON f.id = a.faction_id
     WHERE a.id = :id
     LIMIT 1`,
    { id },
  );
  const row = rows[0];
  if (!row) return null;
  const processed = Number(row.processed_at);
  return {
    id: Number(row.id),
    type: row.type,
    factionId: Number(row.faction_id),
    playerUuid: row.player_uuid,
    status: row.status,
    result: row.result,
    processedAt: Number.isFinite(processed) && row.processed_at !== null ? processed : null,
    leaderUuid: row.leader_uuid,
  };
}
