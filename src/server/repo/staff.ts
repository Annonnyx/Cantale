import { query } from "../db";

/**
 * Grades staff Minecraft (`player_permissions` / RankManager).
 * Pas de grade Builder en jeu — les builders passent par le rôle Discord optionnel.
 */
export type StaffMcRole = "OWNER" | "ADMIN" | "MODERATOR";

export type StaffMemberRow = {
  uuid: string;
  username: string | null;
  role: StaffMcRole;
  discordId: string | null;
  discordUsername: string | null;
  discordDisplayName: string | null;
};

type RawRow = {
  uuid: string;
  username: string | null;
  role: string;
  discord_id: string | null;
  discord_username: string | null;
  discord_display_name: string | null;
};

function toStaffRole(raw: string): StaffMcRole | null {
  const key = raw.trim().toUpperCase();
  if (key === "OWNER" || key === "FONDATEUR" || key === "FONDA") return "OWNER";
  if (key === "ADMIN" || key === "ADMINISTRATEUR") return "ADMIN";
  if (key === "MODERATOR" || key === "MODERATEUR" || key === "MOD" || key === "MODO") {
    return "MODERATOR";
  }
  return null;
}

export function isMcOwnerOrAdmin(role: StaffMcRole | null | undefined): boolean {
  return role === "OWNER" || role === "ADMIN";
}

/** Grade `player_permissions` d'un UUID Minecraft, ou null. */
export async function getStaffMcRoleByUuid(uuid: string): Promise<StaffMcRole | null> {
  const id = uuid.trim();
  if (!id) return null;
  try {
    const rows = await query<{ role: string }>(
      `SELECT UPPER(pp.role) AS role
       FROM player_permissions pp
       WHERE pp.uuid = :uuid
       LIMIT 1`,
      { uuid: id },
    );
    const raw = rows[0]?.role;
    return raw ? toStaffRole(raw) : null;
  } catch {
    return null;
  }
}

/**
 * Roster staff depuis la même source que `/rank` (player_permissions).
 * Jointure `players` + `discord_links` pour pseudo MC et identité Discord.
 * Échec DB → [] (la page Équipe reste affichable sans inventer de noms).
 */
export async function listStaffFromPermissions(): Promise<StaffMemberRow[]> {
  try {
    const rows = await query<RawRow>(
      `SELECT
         pp.uuid,
         p.username,
         UPPER(pp.role) AS role,
         dl.discord_id,
         dl.discord_username,
         dl.discord_display_name
       FROM player_permissions pp
       LEFT JOIN players p ON p.uuid = pp.uuid
       LEFT JOIN discord_links dl ON dl.uuid = pp.uuid
       WHERE UPPER(pp.role) IN (
         'OWNER', 'FONDATEUR', 'FONDA',
         'ADMIN', 'ADMINISTRATEUR',
         'MODERATOR', 'MODERATEUR', 'MOD', 'MODO'
       )
       ORDER BY
         FIELD(
           UPPER(pp.role),
           'OWNER', 'FONDATEUR', 'FONDA',
           'ADMIN', 'ADMINISTRATEUR',
           'MODERATOR', 'MODERATEUR', 'MOD', 'MODO'
         ),
         COALESCE(p.username, pp.uuid) ASC`,
    );

    const out: StaffMemberRow[] = [];
    for (const row of rows) {
      const role = toStaffRole(row.role);
      if (!role) continue;
      out.push({
        uuid: row.uuid,
        username: row.username,
        role,
        discordId: row.discord_id,
        discordUsername: row.discord_username,
        discordDisplayName: row.discord_display_name,
      });
    }
    return out;
  } catch {
    return [];
  }
}
