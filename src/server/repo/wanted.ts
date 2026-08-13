import { cachedQuery } from "../cache";
import { query } from "../db";

/**
 * Table `wanted` du plugin CANTALE (primes) — lecture seule.
 * `issued_at` est en unix secondes.
 */
export type WantedBounty = {
  id: number;
  targetUuid: string;
  targetName: string;
  issuerUuid: string;
  issuerName: string;
  reward: number;
  reason: string | null;
  /** unix secondes. */
  issuedAt: number;
};

type WantedRow = {
  id: number;
  target_uuid: string;
  target_name: string;
  issuer_uuid: string;
  issuer_name: string;
  reward: number;
  reason: string | null;
  issued_at: number;
};

/** Primes actives, les plus grosses d'abord. */
export async function getActiveBounties(): Promise<WantedBounty[]> {
  return cachedQuery(["active-bounties"], 30, async () => {
    const rows = await query<WantedRow>(
      `SELECT id, target_uuid, target_name, issuer_uuid, issuer_name, reward, reason, issued_at
       FROM wanted
       WHERE active = 1
       ORDER BY reward DESC, issued_at DESC`,
    );
    return rows.map((row) => ({
      id: Number(row.id),
      targetUuid: row.target_uuid,
      targetName: row.target_name,
      issuerUuid: row.issuer_uuid,
      issuerName: row.issuer_name,
      reward: Number(row.reward),
      reason: row.reason,
      issuedAt: Number(row.issued_at),
    }));
  });
}
