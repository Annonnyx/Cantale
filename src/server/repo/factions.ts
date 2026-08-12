import { query } from "../db";
import { publicRankingExcludeFactionSql } from "../public-ranking-exclusions";

/**
 * Tables `factions`, `faction_members`, `claims` du plugin CANTALE — lecture seule.
 *
 * RÈGLE ABSOLUE : toute requête exclut au niveau SQL les factions en mode
 * /f secret (`secret_until > UNIX_TIMESTAMP()`, unix secondes — voir
 * Faction.isSecret() côté plugin). Aucune fuite vers le client.
 *
 * Classements / annuaire trié : factions listées dans
 * PUBLIC_RANKING_EXCLUDED_FACTION_NAMES (ex. Ø) sont aussi exclues ici.
 * getFactionBySlug reste accessible si l'URL est connue.
 */
const NOT_SECRET = "COALESCE(f.secret_until, 0) <= UNIX_TIMESTAMP()";
const NOT_RANKING_EXCLUDED = publicRankingExcludeFactionSql("f.name", "f.tag");

/** Rangs de faction, miroir de FactionRank.java (colonne VARCHAR libre). */
const FACTION_RANKS = ["LEADER", "OFFICER", "VETERAN", "MEMBER", "RECRUIT"] as const;

export type FactionRank = (typeof FACTION_RANKS)[number];

export type Faction = {
  id: number;
  name: string;
  tag: string;
  description: string | null;
  leaderUuid: string;
  balance: number;
  power: number;
  /** "normal" par défaut côté plugin. */
  type: string;
  /** unix secondes. */
  createdAt: number;
};

export type FactionSummary = Faction & {
  memberCount: number;
  claimCount: number;
};

export type FactionMember = {
  uuid: string;
  /** Null si le joueur n'a jamais rejoint depuis la création de la table players. */
  username: string | null;
  rank: FactionRank;
  /** unix secondes, 0 si inconnu. */
  joinedAt: number;
};

type FactionRow = {
  id: number;
  name: string;
  tag: string;
  description: string | null;
  leader_uuid: string;
  balance: number;
  power: number;
  type: string | null;
  created_at: number;
  member_count: number;
  claim_count: number;
};

const FACTION_SELECT =
  "f.id, f.name, f.tag, f.description, f.leader_uuid, f.balance, f.power, f.type, f.created_at";

const FACTION_COUNTS = `COUNT(DISTINCT fm.player_uuid) AS member_count,
       (SELECT COUNT(*) FROM claims c WHERE c.faction_id = f.id) AS claim_count`;

/**
 * Whitelist stricte des tris — jamais d'interpolation libre.
 * `members` / `claims` trient sur les alias d'agrégats, le reste sur les colonnes.
 */
const FACTION_SORTS = {
  power: "f.power DESC",
  balance: "f.balance DESC",
  members: "member_count DESC",
  claims: "claim_count DESC",
  created: "f.created_at DESC",
  name: "f.name ASC",
} as const;

export type FactionSort = keyof typeof FACTION_SORTS;

/** Tri SQL des rangs, du leader vers la recrue (valeurs inconnues en fin). */
const RANK_ORDER = `CASE UPPER(fm.rank)
       WHEN 'LEADER' THEN 0
       WHEN 'OFFICER' THEN 1
       WHEN 'VETERAN' THEN 2
       WHEN 'MEMBER' THEN 3
       ELSE 4 END`;

function toFactionSummary(row: FactionRow): FactionSummary {
  return {
    id: Number(row.id),
    name: row.name,
    tag: row.tag,
    description: row.description,
    leaderUuid: row.leader_uuid,
    balance: Number(row.balance),
    power: Number(row.power),
    type: row.type ?? "normal",
    createdAt: Number(row.created_at),
    memberCount: Number(row.member_count),
    claimCount: Number(row.claim_count),
  };
}

/** Le schéma historique mélange 'recruit' (défaut SQL) et 'RECRUIT' (enum Java). */
function normalizeRank(rank: string | null): FactionRank {
  const upper = (rank ?? "").toUpperCase();
  return (FACTION_RANKS as readonly string[]).includes(upper) ? (upper as FactionRank) : "RECRUIT";
}

/** Entier borné, sûr à inliner dans un LIMIT (jamais d'entrée brute). */
function clampLimit(limit: number, fallback = 50, max = 200): number {
  if (!Number.isFinite(limit)) return fallback;
  return Math.max(1, Math.min(max, Math.floor(limit)));
}

/** Annuaire public des factions — secrètes + exclus des classements filtrés en SQL. */
export async function listFactions(sort: FactionSort = "power", limit = 50): Promise<FactionSummary[]> {
  const orderBy = FACTION_SORTS[sort];
  const safeLimit = clampLimit(limit);
  const rows = await query<FactionRow>(
    `SELECT ${FACTION_SELECT}, ${FACTION_COUNTS}
     FROM factions f
     LEFT JOIN faction_members fm ON fm.faction_id = f.id
     WHERE ${NOT_SECRET}
       AND ${NOT_RANKING_EXCLUDED}
     GROUP BY f.id
     ORDER BY ${orderBy}, f.name ASC
     LIMIT ${safeLimit}`,
  );
  return rows.map(toFactionSummary);
}

/**
 * Recherche par tag ou nom normalisé (slug : minuscules, espaces → tirets).
 * Une faction secrète renvoie null — comme si elle n'existait pas.
 */
export async function getFactionBySlug(slug: string): Promise<FactionSummary | null> {
  const normalized = slug.trim().toLowerCase();
  if (!normalized) return null;
  const rows = await query<FactionRow>(
    `SELECT ${FACTION_SELECT}, ${FACTION_COUNTS}
     FROM factions f
     LEFT JOIN faction_members fm ON fm.faction_id = f.id
     WHERE ${NOT_SECRET}
       AND (
         LOWER(f.tag) = :slug
         OR LOWER(f.name) = :slug
         OR LOWER(REPLACE(f.name, ' ', '-')) = :slug
       )
     GROUP BY f.id
     LIMIT 1`,
    { slug: normalized },
  );
  const row = rows[0];
  return row ? toFactionSummary(row) : null;
}

/**
 * Roster d'une faction (membres + rang + pseudo via jointure players).
 * Faction secrète → roster vide, sans exception.
 */
export async function getFactionRoster(factionId: number): Promise<FactionMember[]> {
  const rows = await query<MemberRow>(
    `SELECT fm.player_uuid, p.username, fm.rank, fm.joined_at
     FROM faction_members fm
     INNER JOIN factions f ON f.id = fm.faction_id AND ${NOT_SECRET}
     LEFT JOIN players p ON p.uuid = fm.player_uuid
     WHERE fm.faction_id = :factionId
     ORDER BY ${RANK_ORDER}, p.username ASC`,
    { factionId },
  );
  return rows.map((row) => ({
    uuid: row.player_uuid,
    username: row.username,
    rank: normalizeRank(row.rank),
    joinedAt: Number(row.joined_at),
  }));
}

type MemberRow = {
  player_uuid: string;
  username: string | null;
  rank: string | null;
  joined_at: number;
};

/**
 * Faction d'un joueur donné, avec son rang — pour les pages de profil.
 * Une faction secrète renvoie null, comme partout ailleurs.
 */
export async function getFactionByMemberUuid(
  uuid: string,
): Promise<(FactionSummary & { memberRank: FactionRank }) | null> {
  const rows = await query<FactionRow & { member_rank: string | null }>(
    `SELECT ${FACTION_SELECT},
       (SELECT COUNT(*) FROM faction_members c WHERE c.faction_id = f.id) AS member_count,
       (SELECT COUNT(*) FROM claims c WHERE c.faction_id = f.id) AS claim_count,
       fm.rank AS member_rank
     FROM faction_members fm
     INNER JOIN factions f ON f.id = fm.faction_id AND ${NOT_SECRET}
     WHERE fm.player_uuid = :uuid
     LIMIT 1`,
    { uuid },
  );
  const row = rows[0];
  if (!row) return null;
  return { ...toFactionSummary(row), memberRank: normalizeRank(row.member_rank) };
}
