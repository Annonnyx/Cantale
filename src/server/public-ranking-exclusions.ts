/**
 * Comptes / factions exclus des classements publics et des agrégats de circulation
 * (Cantox / vies / records / tops). Liste centrale — à réutiliser dans tous
 * les repos SQL publics, jamais en dur dans un composant UI.
 *
 * Matching : username / nom de faction case-insensitive (LOWER).
 * UUID joueur optionnel si le pseudo change.
 *
 * Factions : exclusion des tops (pouvoir / richesse / membres) uniquement —
 * la faction reste en jeu et accessible par slug si connue.
 */
export const PUBLIC_RANKING_EXCLUDED_USERNAMES = ["Anox26"] as const;

/** Remplir quand l'UUID offline est connu — plus durable qu'un pseudo. */
export const PUBLIC_RANKING_EXCLUDED_UUIDS = [] as const;

/**
 * Noms de factions exclus des classements publics.
 * Inclut Ø (unicode), o latin, et ∅ (ensemble vide) — le nom en jeu peut varier.
 */
export const PUBLIC_RANKING_EXCLUDED_FACTION_NAMES: readonly string[] = ["Ø", "O", "∅"];

function sqlStringLiterals(values: readonly string[]): string {
  return values
    .map((value) => `'${value.replace(/\\/g, "\\\\").replace(/'/g, "''")}'`)
    .join(", ");
}

/**
 * Clause SQL (sans WHERE/AND) excluant les comptes listés.
 * @param usernameColumn ex. `p.username`, `username`, `player_name`
 * @param uuidColumn ex. `p.uuid`, `uuid`, `player_uuid` — null pour ignorer les UUID
 */
export function publicRankingExcludeSql(
  usernameColumn: string,
  uuidColumn: string | null = "uuid",
): string {
  const parts: string[] = [];

  if (PUBLIC_RANKING_EXCLUDED_USERNAMES.length > 0) {
    const lowered = PUBLIC_RANKING_EXCLUDED_USERNAMES.map((name) => name.toLowerCase());
    parts.push(`LOWER(${usernameColumn}) NOT IN (${sqlStringLiterals(lowered)})`);
  }

  if (uuidColumn && PUBLIC_RANKING_EXCLUDED_UUIDS.length > 0) {
    parts.push(`${uuidColumn} NOT IN (${sqlStringLiterals(PUBLIC_RANKING_EXCLUDED_UUIDS)})`);
  }

  return parts.length > 0 ? parts.join(" AND ") : "1=1";
}

/**
 * Clause SQL (sans WHERE/AND) excluant les factions listées (nom et/ou tag).
 * @param nameColumn ex. `f.name`, `name`
 * @param tagColumn  ex. `f.tag`, `tag` — null pour ignorer le tag
 */
export function publicRankingExcludeFactionSql(
  nameColumn: string,
  tagColumn: string | null = "tag",
): string {
  if (PUBLIC_RANKING_EXCLUDED_FACTION_NAMES.length === 0) return "1=1";

  const lowered = PUBLIC_RANKING_EXCLUDED_FACTION_NAMES.map((name) => name.toLowerCase());
  const list = sqlStringLiterals(lowered);
  const parts = [`LOWER(${nameColumn}) NOT IN (${list})`];

  if (tagColumn) {
    parts.push(`LOWER(${tagColumn}) NOT IN (${list})`);
  }

  return parts.join(" AND ");
}

/** Préfixe `WHERE …` ou `AND …` selon qu'une clause WHERE existe déjà. */
export function publicRankingExcludeWhere(
  usernameColumn: string,
  uuidColumn: string | null = "uuid",
  alreadyHasWhere = false,
): string {
  const clause = publicRankingExcludeSql(usernameColumn, uuidColumn);
  if (clause === "1=1") return "";
  return alreadyHasWhere ? ` AND ${clause}` : ` WHERE ${clause}`;
}
