import type { ResultSetHeader } from "mysql2/promise";
import { query, type SqlValue } from "../db";

/**
 * Chat public / faction — `web_chat_messages` + `web_chat_outbox`.
 * faction_id NULL = global ; sinon chat de faction (membres uniquement côté API).
 */

export type ChatSource = "mc" | "discord" | "web" | "system" | "faction";

export type ChatMessage = {
  id: number;
  source: ChatSource;
  playerUuid: string | null;
  playerName: string;
  message: string;
  factionId: number | null;
  createdAt: string;
};

type MessageRow = {
  id: number | string;
  source: string;
  player_uuid: string | null;
  player_name: string;
  message: string;
  faction_id: number | string | null;
  created_at: Date | string;
};

const DEFAULT_LIMIT = 80;
const MAX_LIMIT = 150;

export const CHAT_MESSAGE_MAX_LENGTH = 256;

export function clampChatLimit(limit: unknown): number {
  const parsed = typeof limit === "string" ? Number.parseInt(limit, 10) : Number(limit);
  if (!Number.isFinite(parsed)) return DEFAULT_LIMIT;
  return Math.max(1, Math.min(MAX_LIMIT, Math.floor(parsed)));
}

async function execute(sql: string, params: Record<string, SqlValue>): Promise<ResultSetHeader> {
  return (await query<never>(sql, params)) as unknown as ResultSetHeader;
}

function toIso(value: Date | string): string {
  if (value instanceof Date) return value.toISOString();
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? new Date(0).toISOString() : parsed.toISOString();
}

function mapRow(row: MessageRow): ChatMessage {
  const source = row.source as ChatSource;
  const fid = row.faction_id == null ? null : Number(row.faction_id);
  return {
    id: Number(row.id),
    source: ["mc", "discord", "web", "system", "faction"].includes(source) ? source : "mc",
    playerUuid: row.player_uuid,
    playerName: row.player_name,
    message: row.message,
    factionId: fid !== null && Number.isFinite(fid) ? fid : null,
    createdAt: toIso(row.created_at),
  };
}

/** Chat global (faction_id IS NULL). */
export async function getRecentGlobalChat(limit = DEFAULT_LIMIT): Promise<ChatMessage[]> {
  const safeLimit = clampChatLimit(limit);
  const rows = await query<MessageRow>(
    `SELECT id, source, player_uuid, player_name, message, faction_id, created_at
     FROM web_chat_messages
     WHERE faction_id IS NULL
     ORDER BY id DESC
     LIMIT ${safeLimit}`,
  );
  return rows.map(mapRow).reverse();
}

export async function getGlobalChatAfter(afterId: number, limit = DEFAULT_LIMIT): Promise<ChatMessage[]> {
  const safeAfter = Number.isFinite(afterId) && afterId > 0 ? Math.floor(afterId) : 0;
  const safeLimit = clampChatLimit(limit);
  const rows = await query<MessageRow>(
    `SELECT id, source, player_uuid, player_name, message, faction_id, created_at
     FROM web_chat_messages
     WHERE faction_id IS NULL AND id > :afterId
     ORDER BY id ASC
     LIMIT ${safeLimit}`,
    { afterId: safeAfter },
  );
  return rows.map(mapRow);
}

export async function getRecentFactionChat(
  factionId: number,
  limit = DEFAULT_LIMIT,
): Promise<ChatMessage[]> {
  const safeLimit = clampChatLimit(limit);
  const rows = await query<MessageRow>(
    `SELECT id, source, player_uuid, player_name, message, faction_id, created_at
     FROM web_chat_messages
     WHERE faction_id = :factionId
     ORDER BY id DESC
     LIMIT ${safeLimit}`,
    { factionId },
  );
  return rows.map(mapRow).reverse();
}

export async function getFactionChatAfter(
  factionId: number,
  afterId: number,
  limit = DEFAULT_LIMIT,
): Promise<ChatMessage[]> {
  const safeAfter = Number.isFinite(afterId) && afterId > 0 ? Math.floor(afterId) : 0;
  const safeLimit = clampChatLimit(limit);
  const rows = await query<MessageRow>(
    `SELECT id, source, player_uuid, player_name, message, faction_id, created_at
     FROM web_chat_messages
     WHERE faction_id = :factionId AND id > :afterId
     ORDER BY id ASC
     LIMIT ${safeLimit}`,
    { factionId, afterId: safeAfter },
  );
  return rows.map(mapRow);
}

export async function enqueueChatMessage(input: {
  playerUuid: string;
  playerName: string;
  message: string;
  factionId?: number | null;
}): Promise<number> {
  const result = await execute(
    `INSERT INTO web_chat_outbox (player_uuid, player_name, message, faction_id, status)
     VALUES (:playerUuid, :playerName, :message, :factionId, 'pending')`,
    {
      playerUuid: input.playerUuid,
      playerName: input.playerName,
      message: input.message,
      factionId: input.factionId && input.factionId > 0 ? input.factionId : null,
    },
  );
  return Number(result.insertId ?? 0);
}

/** Faction du joueur lié (lecture seule). */
export async function getPlayerFactionId(playerUuid: string): Promise<number | null> {
  const rows = await query<{ faction_id: number | string }>(
    `SELECT faction_id FROM faction_members WHERE player_uuid = :playerUuid LIMIT 1`,
    { playerUuid },
  );
  if (!rows[0]) return null;
  const id = Number(rows[0].faction_id);
  return Number.isFinite(id) ? id : null;
}

export async function getFactionName(factionId: number): Promise<string | null> {
  const rows = await query<{ name: string }>(
    `SELECT name FROM factions WHERE id = :factionId LIMIT 1`,
    { factionId },
  );
  return rows[0]?.name ?? null;
}

/** @deprecated alias */
export const getRecentChatMessages = getRecentGlobalChat;
export const getChatMessagesAfter = getGlobalChatAfter;
