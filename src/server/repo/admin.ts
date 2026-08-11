import type { ResultSetHeader } from "mysql2/promise";
import { query, type SqlValue } from "../db";
import { env, DISCORD_TICKET_CATEGORY } from "../env";

async function execute(sql: string, params: Record<string, SqlValue> = {}): Promise<ResultSetHeader> {
  return (await query<never>(sql, params)) as unknown as ResultSetHeader;
}

export type OnlinePlayer = { uuid: string; name: string };

export type AdminPlayerRow = {
  uuid: string;
  username: string;
  lives: number;
  balance: number;
  discordId: string | null;
};

export type AdminTicket = {
  id: string;
  name: string;
  topic: string | null;
  open: boolean;
  url: string;
};

export async function getOnlinePlayersFromStatus(): Promise<{
  online: number;
  max: number | null;
  updatedAt: string | null;
  players: OnlinePlayer[];
}> {
  type Row = {
    online_count: number;
    max_players: number | null;
    online_json: string | null;
    updated_at: Date | string;
  };
  const rows = await query<Row>(
    `SELECT online_count, max_players, online_json, updated_at
     FROM server_status ORDER BY updated_at DESC LIMIT 1`,
  );
  const row = rows[0];
  if (!row) return { online: 0, max: null, updatedAt: null, players: [] };

  let players: OnlinePlayer[] = [];
  if (row.online_json) {
    try {
      const parsed = JSON.parse(row.online_json) as OnlinePlayer[];
      if (Array.isArray(parsed)) {
        players = parsed.filter((p) => p && typeof p.uuid === "string" && typeof p.name === "string");
      }
    } catch {
      players = [];
    }
  }

  const updatedAt =
    row.updated_at instanceof Date
      ? row.updated_at.toISOString()
      : new Date(row.updated_at).toISOString();

  return {
    online: Number(row.online_count) || 0,
    max: row.max_players == null ? null : Number(row.max_players),
    updatedAt,
    players,
  };
}

export async function lookupPlayer(q: string): Promise<AdminPlayerRow | null> {
  const term = q.trim();
  if (!term) return null;
  const rows = await query<{
    uuid: string;
    username: string;
    lives: number | string;
    balance: number | string;
    discord_id: string | null;
  }>(
    `SELECT p.uuid, p.username, p.lives, p.balance, dl.discord_id
     FROM players p
     LEFT JOIN discord_links dl ON dl.uuid = p.uuid
     WHERE p.username = :term OR p.uuid = :term
     LIMIT 1`,
    { term },
  );
  const row = rows[0];
  if (!row) return null;
  return {
    uuid: row.uuid,
    username: row.username,
    lives: Number(row.lives) || 0,
    balance: Number(row.balance) || 0,
    discordId: row.discord_id,
  };
}

export async function enqueueAdminAction(input: {
  type: string;
  targetUuid: string | null;
  targetName: string | null;
  payload: string | null;
  actorDiscordId: string;
}): Promise<number> {
  const result = await execute(
    `INSERT INTO web_admin_actions
       (type, target_uuid, target_name, payload, actor_discord_id, status)
     VALUES (:type, :targetUuid, :targetName, :payload, :actorDiscordId, 'pending')`,
    {
      type: input.type,
      targetUuid: input.targetUuid,
      targetName: input.targetName,
      payload: input.payload,
      actorDiscordId: input.actorDiscordId,
    },
  );
  return Number(result.insertId ?? 0);
}

export async function getAdminActionStatus(id: number): Promise<{
  id: number;
  status: string;
  result: string | null;
} | null> {
  const rows = await query<{ id: number | string; status: string; result: string | null }>(
    `SELECT id, status, result FROM web_admin_actions WHERE id = :id LIMIT 1`,
    { id },
  );
  const row = rows[0];
  if (!row) return null;
  return { id: Number(row.id), status: row.status, result: row.result };
}

/** Liste les salons tickets Discord (catégorie support) via REST bot. */
export async function listDiscordTickets(): Promise<AdminTicket[]> {
  const token = env.discordBotToken;
  const guildId = env.discordGuildId;
  if (!token || !guildId) return [];

  const res = await fetch(`https://discord.com/api/v10/guilds/${guildId}/channels`, {
    headers: { Authorization: `Bot ${token}` },
    cache: "no-store",
  });
  if (!res.ok) return [];

  type Channel = {
    id: string;
    name: string;
    topic?: string | null;
    parent_id?: string | null;
    type: number;
  };
  const channels = (await res.json()) as Channel[];
  const categoryId = DISCORD_TICKET_CATEGORY;
  const closedCategory = "1513940161682211076";

  return channels
    .filter((ch) => ch.type === 0)
    .filter((ch) => ch.parent_id === categoryId || ch.parent_id === closedCategory)
    .filter((ch) => (ch.topic ?? "").startsWith("ticket:") || /^(open|closed)-/i.test(ch.name))
    .map((ch) => {
      const name = ch.name.toLowerCase();
      const open = !name.startsWith("closed-") && ch.parent_id !== closedCategory;
      return {
        id: ch.id,
        name: ch.name,
        topic: ch.topic ?? null,
        open,
        url: `https://discord.com/channels/${guildId}/${ch.id}`,
      };
    })
    .sort((a, b) => Number(b.open) - Number(a.open) || a.name.localeCompare(b.name));
}
