import { discordAvatarUrl, listGuildMembersWithAnyRole, type GuildMemberSnapshot } from "../discord";
import { DISCORD_ROLES, env } from "../env";
import { query } from "../db";
import { listStaffFromPermissions, type StaffMcRole } from "./staff";

/**
 * Grades affichés sur /recrutement § Équipe.
 * Ordre = hiérarchie d'affichage (direction Discord avant grades MC).
 */
export type EquipeGrade =
  | "fondateur"
  | "coFondateur"
  | "directeur"
  | "owner"
  | "admin"
  | "modo"
  | "builder";

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
  admin: { label: "Admin", priority: 4 },
  modo: { label: "Modo", priority: 5 },
  builder: { label: "Builder", priority: 6 },
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

async function linksByDiscordIds(ids: string[]): Promise<Map<string, DiscordLinkLookup>> {
  const map = new Map<string, DiscordLinkLookup>();
  if (ids.length === 0) return map;

  // Placeholders nommés (mysql2) — liste bornée (staff Discord, pas tout le serveur).
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

function directionGradeFromRoles(roles: readonly string[]): EquipeGrade | null {
  if (roles.includes(DISCORD_ROLES.fondateur)) return "fondateur";
  if (roles.includes(DISCORD_ROLES.coFondateur)) return "coFondateur";
  if (roles.includes(DISCORD_ROLES.directeur)) return "directeur";
  return null;
}

function staffGradeFromRoles(
  roles: readonly string[],
  roleAdmin: string | null,
  roleModo: string | null,
  roleBuilder: string | null,
): EquipeGrade | null {
  const direction = directionGradeFromRoles(roles);
  if (direction) return direction;
  if (roleAdmin && roles.includes(roleAdmin)) return "admin";
  if (roleModo && roles.includes(roleModo)) return "modo";
  if (roleBuilder && roles.includes(roleBuilder)) return "builder";
  return null;
}

/**
 * Construit le roster public Équipe.
 * SoT principal : `player_permissions` (Owner / Admin / Modo).
 * Complément Discord : rôles direction (hardcodés comme le reste du site)
 * + rôles optionnels env (Admin / Modo / Builder).
 */
export async function getEquipeRoster(): Promise<EquipeGroup[]> {
  const roleAdmin = env.discordRoleAdmin;
  const roleModo = env.discordRoleModo;
  const roleBuilder = env.discordRoleBuilder;

  const discordRoleIds = [
    DISCORD_ROLES.fondateur,
    DISCORD_ROLES.coFondateur,
    DISCORD_ROLES.directeur,
    roleAdmin,
    roleModo,
    roleBuilder,
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
    const grade = staffGradeFromRoles(snap.roles, roleAdmin, roleModo, roleBuilder);
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

  // Dédupliquer : une entrée par personne (clé mc: ou discord: primaire).
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
