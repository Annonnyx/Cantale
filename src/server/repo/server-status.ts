import { cachedQuery } from "../cache";
import { query } from "../db";

export type ServerStatus = {
  online: number;
  max: number | null;
  updatedAt: string;
};

type Row = {
  online_count: number;
  max_players: number | null;
  updated_at: Date;
};

/**
 * Dernier statut connu du serveur, alimenté par ServerStatusTask côté plugin.
 * Renvoie null si la table n'existe pas encore ou si la donnée est stale (> 3 min).
 */
export async function getServerStatus(): Promise<ServerStatus | null> {
  try {
    return await cachedQuery(["server-status"], 15, async () => {
      const rows = await query<Row>(
        "SELECT online_count, max_players, updated_at FROM server_status ORDER BY updated_at DESC LIMIT 1",
      );
      const row = rows[0];
      if (!row) return null;
      const updatedAt = new Date(row.updated_at);
      if (Date.now() - updatedAt.getTime() > 3 * 60_000) return null;
      return { online: row.online_count, max: row.max_players, updatedAt: updatedAt.toISOString() };
    });
  } catch {
    return null;
  }
}
