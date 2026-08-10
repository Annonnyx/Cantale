import { timingSafeEqual } from "node:crypto";
import { runDailySnapshot } from "@/server/repo/snapshots";

export const dynamic = "force-dynamic";

/**
 * GET /api/cron/snapshot — relevé quotidien des compteurs cumulés.
 *
 * Les tables du plugin ne stockent que des cumuls : sans cette photographie
 * quotidienne, les classements « jour / semaine / mois » sont incalculables.
 * La route crée la table `web_snapshots_daily` si besoin (idempotent) puis
 * upserte le relevé du jour (calendrier de Paris) pour tous les joueurs.
 *
 * Sécurité : header `Authorization: Bearer {CRON_SECRET}` obligatoire (401 sinon).
 * CRON_SECRET est une variable d'environnement du site — jamais exposée côté client.
 *
 * Déclenchement (au choix) :
 * - Vercel Cron — ajouter dans vercel.json :
 *     { "crons": [{ "path": "/api/cron/snapshot", "schedule": "0 4 * * *" }] }
 *   Vercel envoie automatiquement `Authorization: Bearer $CRON_SECRET`
 *   quand la variable CRON_SECRET existe dans le projet.
 * - Cron système / externe :
 *     curl -fsS -H "Authorization: Bearer $CRON_SECRET" https://<hote>/api/cron/snapshot
 *
 * Un appel entre minuit et 4 h du matin reste sans effet de bord : le relevé
 * du jour est simplement (ré)écrit à l'heure d'appel.
 */
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || !isAuthorized(request.headers.get("authorization"), secret)) {
    return Response.json({ error: "Non autorisé." }, { status: 401 });
  }

  try {
    const result = await runDailySnapshot();
    return Response.json(
      { ok: true, ...result },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    console.error("[cron/snapshot] Échec du relevé :", error);
    return Response.json(
      { ok: false, error: "Échec du relevé quotidien." },
      { status: 500 },
    );
  }
}

/** Comparaison à temps constant du jeton Bearer (même approche que session.ts). */
function isAuthorized(header: string | null, secret: string): boolean {
  if (!header) return false;
  const received = Buffer.from(header);
  const expected = Buffer.from(`Bearer ${secret}`);
  return received.length === expected.length && timingSafeEqual(received, expected);
}
