/**
 * Comptes exclus des classements publics et des agrégats de circulation
 * (Cantox / vies / records / tops). Liste centrale — à réutiliser dans tous
 * les repos SQL publics, jamais en dur dans un composant UI.
 *
 * Matching : username case-insensitive (LOWER). UUID optionnel si le pseudo change.
 */
export const PUBLIC_RANKING_EXCLUDED_USERNAMES = ["Anox26"] as const;

/** Remplir quand l'UUID offline est connu — plus durable qu'un pseudo. */
export const PUBLIC_RANKING_EXCLUDED_UUIDS = [] as const;

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
