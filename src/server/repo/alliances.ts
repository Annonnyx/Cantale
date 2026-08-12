import { discordAvatarUrl, listGuildMembersWithAnyRole, type GuildMemberSnapshot } from "../discord";
import { env } from "../env";
import { query } from "../db";

/**
 * Rôles affichés sur /partenariats (pas sur /recrutement#equipe).
 */
export type AllianceGrade = "partenaire" | "creator";

export type AllianceMember = {
  key: string;
  grade: AllianceGrade;
  displayName: string;
  minecraftUsername: string | null;
  uuid: string | null;
  discordId: string;
  discordUsername: string | null;
  avatarUrl: string | null;
  avatarKind: "minecraft" | "discord" | "none";
};

export type AllianceGroup = {
  grade: AllianceGrade;
  label: string;
  members: AllianceMember[];
};

const GRADE_META: Record<AllianceGrade, { label: string; priority: number }> = {
  partenaire: { label: "Partenaires actifs", priority: 0 },
  creator: { label: "Creators", priority: 1 },
};

type DiscordLinkLookup = {
  discordId: string;
  uuid: string;
  username: string | null;
};

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

function betterGrade(a: AllianceGrade, b: AllianceGrade): AllianceGrade {
  return GRADE_META[a].priority <= GRADE_META[b].priority ? a : b;
}

function gradeFromRoles(
  roles: readonly string[],
  rolePartenaire: string,
  roleCreator: string,
): AllianceGrade | null {
  if (roles.includes(rolePartenaire)) return "partenaire";
  if (roles.includes(roleCreator)) return "creator";
  return null;
}

/**
 * Roster public partenariats : détenteurs réels des rôles Discord
 * Partenaires actifs + Creator (IDs défauts / env override).
 */
export async function getAlliancesRoster(): Promise<AllianceGroup[]> {
  const rolePartenaire = env.discordRolePartenaire;
  const roleCreator = env.discordRoleCreator;
  const discordRoleIds = [rolePartenaire, roleCreator].filter(Boolean);

  const members =
    discordRoleIds.length > 0
      ? await listGuildMembersWithAnyRole(discordRoleIds).catch(() => [] as GuildMemberSnapshot[])
      : [];

  const links = await linksByDiscordIds(members.map((m) => m.id));
  const byKey = new Map<string, AllianceMember>();

  for (const snap of members) {
    const grade = gradeFromRoles(snap.roles, rolePartenaire, roleCreator);
    if (!grade) continue;

    const link = links.get(snap.id);
    const key = link ? `mc:${link.uuid}` : `discord:${snap.id}`;
    const existing = byKey.get(key) ?? (link ? undefined : byKey.get(`discord:${snap.id}`));

    if (existing) {
      const merged: AllianceMember = {
        ...existing,
        grade: betterGrade(grade, existing.grade),
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
      continue;
    }

    const member: AllianceMember = {
      key,
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
  }

  const unique = new Map<string, AllianceMember>();
  for (const member of byKey.values()) {
    unique.set(member.key, member);
  }

  const groups = new Map<AllianceGrade, AllianceMember[]>();
  for (const member of unique.values()) {
    const list = groups.get(member.grade) ?? [];
    list.push(member);
    groups.set(member.grade, list);
  }

  const order = Object.keys(GRADE_META) as AllianceGrade[];
  return order
    .map((grade) => {
      const list = (groups.get(grade) ?? []).sort((a, b) =>
        a.displayName.localeCompare(b.displayName, "fr", { sensitivity: "base" }),
      );
      return { grade, label: GRADE_META[grade].label, members: list };
    })
    .filter((group) => group.members.length > 0);
}
