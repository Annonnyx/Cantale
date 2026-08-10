import { query } from "../db";

/**
 * Table `discord_links` du plugin CANTALE — lecture seule.
 * Alimentée par la commande Discord /link (SlashCommandManager.handleLink).
 */

export type MinecraftLink = {
  discordId: string;
  uuid: string;
  /** Pseudo Minecraft via jointure players — null si le joueur est inconnu. */
  username: string | null;
  /** unix secondes. */
  linkedAt: number;
};

type LinkRow = {
  discord_id: string;
  uuid: string;
  username: string | null;
  linked_at: number;
};

/** Liaison Discord → compte Minecraft, si elle existe. */
export async function getMinecraftLinkByDiscordId(discordId: string): Promise<MinecraftLink | null> {
  const rows = await query<LinkRow>(
    `SELECT dl.discord_id, dl.uuid, p.username, dl.linked_at
     FROM discord_links dl
     LEFT JOIN players p ON p.uuid = dl.uuid
     WHERE dl.discord_id = :discordId
     LIMIT 1`,
    { discordId },
  );
  const row = rows[0];
  if (!row) return null;
  return {
    discordId: row.discord_id,
    uuid: row.uuid,
    username: row.username,
    linkedAt: Number(row.linked_at),
  };
}
