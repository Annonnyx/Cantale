import { query, type SqlValue } from "../db";

/**
 * Table `web_faction_settings` — réglages WEB des factions.
 *
 * Ces données n'existent pas côté plugin (recrutement ouvert/fermé,
 * description personnalisée) : elles vivent uniquement ici, en web-only.
 * La table est créée paresseusement (CREATE TABLE IF NOT EXISTS) au premier
 * accès — pattern migrate idempotent, partagé par une promesse unique.
 *
 * `updated_at` est en unix secondes, comme toutes les tables du projet.
 */

const CREATE_SETTINGS_TABLE = `
  CREATE TABLE IF NOT EXISTS web_faction_settings (
    faction_id INT NOT NULL,
    recruitment_open TINYINT(1) NOT NULL DEFAULT 0,
    custom_description TEXT NULL,
    updated_at INT NOT NULL,
    PRIMARY KEY (faction_id)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
`;

let settingsTableReady: Promise<void> | null = null;

/** Crée la table si besoin. En cas d'échec, la promesse est réinitialisée pour réessayer. */
function ensureSettingsTable(): Promise<void> {
  if (!settingsTableReady) {
    settingsTableReady = query(CREATE_SETTINGS_TABLE)
      .then(() => undefined)
      .catch((error) => {
        settingsTableReady = null;
        throw error;
      });
  }
  return settingsTableReady;
}

export type FactionSettings = {
  factionId: number;
  /** Recrutement ouvert — fermé par défaut tant que le leader ne l'ouvre pas. */
  recruitmentOpen: boolean;
  /** Description web personnalisée ; null → on affiche la description du plugin. */
  customDescription: string | null;
  /** unix secondes, 0 si la faction n'a encore jamais eu de réglages. */
  updatedAt: number;
};

type SettingsRow = {
  faction_id: number;
  recruitment_open: number;
  custom_description: string | null;
  updated_at: number;
};

function toSettings(row: SettingsRow): FactionSettings {
  return {
    factionId: Number(row.faction_id),
    recruitmentOpen: Number(row.recruitment_open) === 1,
    customDescription: row.custom_description,
    updatedAt: Number(row.updated_at),
  };
}

/** Réglages par défaut quand la faction n'a pas encore de ligne web. */
export function defaultFactionSettings(factionId: number): FactionSettings {
  return { factionId, recruitmentOpen: false, customDescription: null, updatedAt: 0 };
}

/** Réglages d'une faction — les valeurs par défaut si aucune ligne n'existe. */
export async function getFactionSettings(factionId: number): Promise<FactionSettings> {
  await ensureSettingsTable();
  const rows = await query<SettingsRow>(
    `SELECT faction_id, recruitment_open, custom_description, updated_at
     FROM web_faction_settings
     WHERE faction_id = :factionId
     LIMIT 1`,
    { factionId },
  );
  const row = rows[0];
  return row ? toSettings(row) : defaultFactionSettings(factionId);
}

/**
 * Réglages d'un lot de factions (annuaire) — une seule requête.
 * Les factions sans ligne sont absentes de la map : le défaut s'applique au rendu.
 */
export async function getFactionSettingsMap(
  factionIds: number[],
): Promise<Map<number, FactionSettings>> {
  const ids = [...new Set(factionIds)].filter((id) => Number.isInteger(id) && id > 0);
  if (ids.length === 0) return new Map();
  await ensureSettingsTable();
  // Placeholders nommés générés — jamais d'interpolation de valeurs.
  const keys = ids.map((_, i) => `:id${i}`);
  const params: Record<string, SqlValue> = {};
  ids.forEach((id, i) => {
    params[`id${i}`] = id;
  });
  const rows = await query<SettingsRow>(
    `SELECT faction_id, recruitment_open, custom_description, updated_at
     FROM web_faction_settings
     WHERE faction_id IN (${keys.join(", ")})`,
    params,
  );
  return new Map(rows.map((row) => [Number(row.faction_id), toSettings(row)]));
}

export type FactionSettingsPatch = {
  recruitmentOpen?: boolean;
  /** Chaîne vide acceptée : elle est normalisée en NULL (repli sur la description plugin). */
  customDescription?: string;
};

/**
 * Upsert partiel des réglages : seules les clés présentes dans le patch sont
 * écrites, les autres colonnes conservent leur valeur. Description vide → NULL.
 */
export async function updateFactionSettings(
  factionId: number,
  patch: FactionSettingsPatch,
): Promise<void> {
  if (patch.recruitmentOpen === undefined && patch.customDescription === undefined) return;
  await ensureSettingsTable();

  const customDescription =
    patch.customDescription === undefined ? null : patch.customDescription.trim() || null;

  const sets: string[] = [];
  if (patch.recruitmentOpen !== undefined) sets.push("recruitment_open = :recruitmentOpen");
  if (patch.customDescription !== undefined) sets.push("custom_description = :customDescription");

  await query(
    `INSERT INTO web_faction_settings (faction_id, recruitment_open, custom_description, updated_at)
     VALUES (:factionId, :insertRecruitmentOpen, :insertCustomDescription, UNIX_TIMESTAMP())
     ON DUPLICATE KEY UPDATE ${sets.join(", ")}, updated_at = UNIX_TIMESTAMP()`,
    {
      factionId,
      recruitmentOpen: patch.recruitmentOpen === undefined ? 0 : patch.recruitmentOpen ? 1 : 0,
      customDescription,
      insertRecruitmentOpen: patch.recruitmentOpen === undefined ? 0 : patch.recruitmentOpen ? 1 : 0,
      insertCustomDescription: customDescription,
    },
  );
}

/* ——— Complément de roster : vies des membres ———
 * factions.ts (hors périmètre ici) ne sélectionne pas `lives` ; on lit la
 * table players du plugin en une requête groupée pour les LifeNotches. */

export async function getLivesByUuids(uuids: string[]): Promise<Record<string, number>> {
  const unique = [...new Set(uuids)].filter(Boolean);
  if (unique.length === 0) return {};
  const keys = unique.map((_, i) => `:u${i}`);
  const params: Record<string, SqlValue> = {};
  unique.forEach((uuid, i) => {
    params[`u${i}`] = uuid;
  });
  const rows = await query<{ uuid: string; lives: number }>(
    `SELECT uuid, lives FROM players WHERE uuid IN (${keys.join(", ")})`,
    params,
  );
  return Object.fromEntries(rows.map((row) => [row.uuid, Number(row.lives)]));
}
