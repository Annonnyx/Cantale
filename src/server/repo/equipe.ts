import { discordAvatarUrl, listGuildMembersWithAnyRole, type GuildMemberSnapshot } from "../discord";
import { DISCORD_ROLES, env } from "../env";
import { query } from "../db";
import { listStaffFromPermissions, type StaffMcRole } from "./staff";

/**
 * Grades affichés sur /recrutement § Équipe (staff uniquement).
 * Partenaires / Creators → `/partenariats`.
 */
export type EquipeGrade =
  | "fondateur"
  | "coFondateur"
  | "directeur"
  | "owner"
  | "developpeur"
  | "admin"
  | "support"
  | "modo"
  | "builder"
  | "monteur"
  | "graphiste";

export type EquipeMember = {
  /** Clé stable pour React (uuid MC ou discord:<id>). */
  key: string;
  grade: EquipeGrade;
  displayName: string;
  /** Pseudo Minecraft si compte lié / staff in-game. */
  minecraftUsername: string | null;
  uuid: string | null;
  discordId: string | null;
  discordUsername: string | null;
  /** Avatar : skin MC si uuid, sinon avatar Discord. */
  avatarUrl: string | null;
  avatarKind: "minecraft" | "discord" | "none";
};

export type EquipeGroup = {
  grade: EquipeGrade;
  label: string;
  members: EquipeMember[];
};

const GRADE_META: Record<EquipeGrade, { label: string; priority: number }> = {
  fondateur: { label: "Fondateur", priority: 0 },
  coFondateur: { label: "Co-fondateur", priority: 1 },
  directeur: { label: "Directeur", priority: 2 },
  owner: { label: "Owner", priority: 3 },
  developpeur: { label: "Développeur", priority: 4 },
  admin: { label: "Admin", priority: 5 },
  support: { label: "Support", priority: 6 },
  modo: { label: "Modo", priority: 7 },
  builder: { label: "Builder", priority: 8 },
  monteur: { label: "Monteur", priority: 9 },
  graphiste: { label: "Graphiste", priority: 10 },
};

const MC_TO_GRADE: Record<StaffMcRole, EquipeGrade> = {
  OWNER: "owner",
  ADMIN: "admin",
  MODERATOR: "modo",
};

type DiscordLinkLookup = {
  discordId: string;
  uuid: string;
  username: string | null;
};

type ResolvedStaffRoles = {
  developpeur: string;
  admin: string;
  support: string;
  modo: string | null;
  builder: string;
  monteur: string;
  graphiste: string;
};

function resolveStaffRoles(): ResolvedStaffRoles {
  return {
    developpeur: env.discordRoleDeveloppeur,
    admin: env.discordRoleAdmin,
    support: env.discordRoleSupport,
    modo: env.discordRoleModo,
    builder: env.discordRoleBuilder,
    monteur: env.discordRoleMonteur,
    graphiste: env.discordRoleGraphiste,
  };
}

async function linksByDiscordIds(ids: string[]): Promise<Map<string, DiscordLinkLookup>> {
  const map = new Map<string, DiscordLinkLookup>();
  if (ids.length === 0) return map;

  const params: Record<string, string> = {};
  const placeholders = ids.map((id, i) => {
    const key = `id${i}`;
    params[key] = id;
    return `:${key}`;
  });

  try {
    const rows = await query<{
      discord_id: string;
      uuid: string;
      username: string | null;
    }>(
      `SELECT dl.discord_id, dl.uuid, p.username
       FROM discord_links dl
       LEFT JOIN players p ON p.uuid = dl.uuid
       WHERE dl.discord_id IN (${placeholders.join(", ")})`,
      params,
    );
    for (const row of rows) {
      map.set(row.discord_id, {
        discordId: row.discord_id,
        uuid: row.uuid,
        username: row.username,
      });
    }
  } catch {
    /* ignore */
  }
  return map;
}

function mcAvatarUrl(uuid: string): string {
  return `/api/minecraft/avatar/${encodeURIComponent(uuid)}?size=80`;
}

function discordMemberAvatar(member: GuildMemberSnapshot): string {
  return discordAvatarUrl(
    {
      id: member.id,
      username: member.username,
      globalName: member.globalName,
      avatar: member.avatar,
    },
    80,
  );
}

function betterGrade(a: EquipeGrade, b: EquipeGrade): EquipeGrade {
  return GRADE_META[a].priority <= GRADE_META[b].priority ? a : b;
}

function gradeFromDiscordRoles(
  roles: readonly string[],
  resolved: ResolvedStaffRoles,
): EquipeGrade | null {
  if (roles.includes(DISCORD_ROLES.fondateur)) return "fondateur";
  if (roles.includes(DISCORD_ROLES.coFondateur)) return "coFondateur";
  if (roles.includes(DISCORD_ROLES.directeur)) return "directeur";
  if (roles.includes(resolved.developpeur)) return "developpeur";
  if (roles.includes(resolved.admin)) return "admin";
  if (roles.includes(resolved.support)) return "support";
  if (resolved.modo && roles.includes(resolved.modo)) return "modo";
  if (roles.includes(resolved.builder)) return "builder";
  if (roles.includes(resolved.monteur)) return "monteur";
  if (roles.includes(resolved.graphiste)) return "graphiste";
  return null;
}

/**
 * Roster public Équipe (staff).
 * SoT MC : `player_permissions` (Owner / Admin / Modo).
 * Discord : direction + Développeur / Admin / Support / Builder / Monteur / Graphiste.
 */
export async function getEquipeRoster(): Promise<EquipeGroup[]> {
  const resolved = resolveStaffRoles();

  const discordRoleIds = [
    DISCORD_ROLES.fondateur,
    DISCORD_ROLES.coFondateur,
    DISCORD_ROLES.directeur,
    resolved.developpeur,
    resolved.admin,
    resolved.support,
    resolved.modo,
    resolved.builder,
    resolved.monteur,
    resolved.graphiste,
  ].filter((id): id is string => Boolean(id));

  const [mcStaff, discordStaff] = await Promise.all([
    listStaffFromPermissions(),
    discordRoleIds.length > 0
      ? listGuildMembersWithAnyRole(discordRoleIds).catch(() => [] as GuildMemberSnapshot[])
      : Promise.resolve([] as GuildMemberSnapshot[]),
  ]);

  const byKey = new Map<string, EquipeMember>();

  for (const row of mcStaff) {
    const grade = MC_TO_GRADE[row.role];
    const displayName =
      row.username?.trim() ||
      row.discordDisplayName?.trim() ||
      row.discordUsername?.trim() ||
      "Joueur inconnu";
    const member: EquipeMember = {
      key: `mc:${row.uuid}`,
      grade,
      displayName,
      minecraftUsername: row.username,
      uuid: row.uuid,
      discordId: row.discordId,
      discordUsername: row.discordDisplayName ?? row.discordUsername,
      avatarUrl: row.uuid ? mcAvatarUrl(row.uuid) : null,
      avatarKind: row.uuid ? "minecraft" : "none",
    };
    byKey.set(member.key, member);
    if (row.discordId) byKey.set(`discord:${row.discordId}`, member);
  }

  const discordIds = discordStaff.map((m) => m.id);
  const links = await linksByDiscordIds(discordIds);

  for (const snap of discordStaff) {
    const grade = gradeFromDiscordRoles(snap.roles, resolved);
    if (!grade) continue;

    const link = links.get(snap.id);
    const existing =
      (link ? byKey.get(`mc:${link.uuid}`) : undefined) ?? byKey.get(`discord:${snap.id}`);

    if (existing) {
      const mergedGrade = betterGrade(grade, existing.grade);
      const merged: EquipeMember = {
        ...existing,
        grade: mergedGrade,
        discordId: snap.id,
        discordUsername: snap.globalName ?? snap.username,
        displayName:
          existing.minecraftUsername?.trim() ||
          snap.globalName?.trim() ||
          snap.username ||
          existing.displayName,
      };
      byKey.set(existing.key, merged);
      byKey.set(`discord:${snap.id}`, merged);
      if (merged.uuid) byKey.set(`mc:${merged.uuid}`, merged);
      continue;
    }

    const member: EquipeMember = {
      key: link ? `mc:${link.uuid}` : `discord:${snap.id}`,
      grade,
      displayName: link?.username?.trim() || snap.globalName?.trim() || snap.username,
      minecraftUsername: link?.username ?? null,
      uuid: link?.uuid ?? null,
      discordId: snap.id,
      discordUsername: snap.globalName ?? snap.username,
      avatarUrl: link?.uuid ? mcAvatarUrl(link.uuid) : discordMemberAvatar(snap),
      avatarKind: link?.uuid ? "minecraft" : "discord",
    };
    byKey.set(member.key, member);
    byKey.set(`discord:${snap.id}`, member);
    if (member.uuid) byKey.set(`mc:${member.uuid}`, member);
  }

  const unique = new Map<string, EquipeMember>();
  for (const member of byKey.values()) {
    unique.set(member.key, member);
  }

  const groups = new Map<EquipeGrade, EquipeMember[]>();
  for (const member of unique.values()) {
    const list = groups.get(member.grade) ?? [];
    list.push(member);
    groups.set(member.grade, list);
  }

  const order = Object.keys(GRADE_META) as EquipeGrade[];
  return order
    .map((grade) => {
      const members = (groups.get(grade) ?? []).sort((a, b) =>
        a.displayName.localeCompare(b.displayName, "fr", { sensitivity: "base" }),
      );
      return { grade, label: GRADE_META[grade].label, members };
    })
    .filter((group) => group.members.length > 0);
}
