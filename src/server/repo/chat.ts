import type { ResultSetHeader } from "mysql2/promise";
import { query, type SqlValue } from "../db";

/**
 * Chat public du jeu — tables `web_chat_messages` (lecture) et `web_chat_outbox`
 * (écriture site → plugin). Le site n'écrit jamais directement dans le chat MC.
 */

export type ChatSource = "mc" | "discord" | "web" | "system";

export type ChatMessage = {
  id: number;
  source: ChatSource;
  playerUuid: string | null;
  playerName: string;
  message: string;
  createdAt: string;
};

type MessageRow = {
  id: number | string;
  source: string;
  player_uuid: string | null;
  player_name: string;
  message: string;
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
  return {
    id: Number(row.id),
    source: ["mc", "discord", "web", "system"].includes(source) ? source : "mc",
    playerUuid: row.player_uuid,
    playerName: row.player_name,
    message: row.message,
    createdAt: toIso(row.created_at),
  };
}

/** Derniers messages, ordre chronologique croissant (affichage fil). */
export async function getRecentChatMessages(limit = DEFAULT_LIMIT): Promise<ChatMessage[]> {
  const safeLimit = clampChatLimit(limit);
  const rows = await query<MessageRow>(
    `SELECT id, source, player_uuid, player_name, message, created_at
     FROM web_chat_messages
     ORDER BY id DESC
     LIMIT ${safeLimit}`,
  );
  return rows.map(mapRow).reverse();
}

/** Messages strictement après un id (polling). */
export async function getChatMessagesAfter(afterId: number, limit = DEFAULT_LIMIT): Promise<ChatMessage[]> {
  const safeAfter = Number.isFinite(afterId) && afterId > 0 ? Math.floor(afterId) : 0;
  const safeLimit = clampChatLimit(limit);
  const rows = await query<MessageRow>(
    `SELECT id, source, player_uuid, player_name, message, created_at
     FROM web_chat_messages
     WHERE id > :afterId
     ORDER BY id ASC
     LIMIT ${safeLimit}`,
    { afterId: safeAfter },
  );
  return rows.map(mapRow);
}

/** Dépose un message dans la file consommée par WebChatBridge. */
export async function enqueueChatMessage(input: {
  playerUuid: string;
  playerName: string;
  message: string;
}): Promise<number> {
  const result = await execute(
    `INSERT INTO web_chat_outbox (player_uuid, player_name, message, status)
     VALUES (:playerUuid, :playerName, :message, 'pending')`,
    {
      playerUuid: input.playerUuid,
      playerName: input.playerName,
      message: input.message,
    },
  );
  return Number(result.insertId ?? 0);
}
