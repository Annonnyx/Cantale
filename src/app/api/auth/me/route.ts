import { getSessionIdentity } from "@/server/session";

export const dynamic = "force-dynamic";

/**
 * Résumé public de la session, consommé par le header côté client.
 * Cookie + liaison MC uniquement — pas d'appel Discord (rôles) : le header
 * de chaque page ne doit pas attendre l'API guild.
 */
export async function GET() {
  const { discordUser, mc } = await getSessionIdentity();

  if (!discordUser) {
    return Response.json(
      { connected: false },
      { headers: { "Cache-Control": "no-store" } },
    );
  }

  return Response.json(
    {
      connected: true,
      username: discordUser.globalName ?? discordUser.username,
      linked: Boolean(mc),
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}
