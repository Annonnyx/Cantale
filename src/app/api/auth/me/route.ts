import { getSessionUser } from "@/server/session";

export const dynamic = "force-dynamic";

/**
 * Résumé public de la session, consommé par le header côté client.
 * Ne renvoie que le nom d'affichage Discord et l'état de liaison du compte
 * Minecraft — jamais d'identifiant ni d'uuid.
 */
export async function GET() {
  const { tier, discordUser } = await getSessionUser();

  if (tier === "anonymous" || !discordUser) {
    return Response.json(
      { connected: false },
      { headers: { "Cache-Control": "no-store" } },
    );
  }

  return Response.json(
    {
      connected: true,
      username: discordUser.globalName ?? discordUser.username,
      linked: tier === "linked" || tier === "leader",
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}
