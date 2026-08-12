import { env } from "@/server/env";
import { getSessionUser } from "@/server/session";
import {
  findShopEntry,
  SHOP_MAX_LINES,
  SHOP_MAX_QUANTITY_PER_LINE,
  type ShopEntry,
} from "@/lib/shop-catalog";

export const dynamic = "force-dynamic";

/**
 * Checkout de la boutique.
 *
 * Ordre des barrières, jamais contournable côté client :
 * 1. SHOP_ENABLED=false → 503, avant toute lecture de session ou de panier.
 * 2. Compte Discord lié à Minecraft requis → 401 sinon.
 * 3. Panier re-validé ligne à ligne contre src/lib/shop-catalog.ts — les
 *    prix envoyés par le client sont ignorés, seuls id + quantité sont lus.
 *
 * Tant que le prestataire de paiement n'est pas tranché (décision
 * cantale.store), un panier valide reçoit 501 « Paiement en cours
 * d'intégration » — aucune session de paiement n'est créée ici.
 */

type CartLine = { entry: ShopEntry; quantity: number };

function parseCart(body: unknown): { lines: CartLine[] } | { error: string } {
  if (!body || typeof body !== "object") return { error: "Requête illisible." };
  const rawLines = (body as { lines?: unknown }).lines;
  if (!Array.isArray(rawLines) || rawLines.length === 0) {
    return { error: "Le panier est vide." };
  }
  if (rawLines.length > SHOP_MAX_LINES) {
    return { error: "Le panier contient trop de lignes." };
  }

  const seen = new Set<string>();
  const lines: CartLine[] = [];
  for (const raw of rawLines) {
    if (!raw || typeof raw !== "object") return { error: "Ligne de panier invalide." };
    const { id, quantity } = raw as { id?: unknown; quantity?: unknown };
    if (typeof id !== "string") return { error: "Ligne de panier invalide." };
    const entry = findShopEntry(id);
    if (!entry) return { error: "Article inconnu du catalogue." };
    if (seen.has(entry.id)) return { error: "Article en double dans le panier." };
    seen.add(entry.id);
    if (
      typeof quantity !== "number" ||
      !Number.isInteger(quantity) ||
      quantity < 1 ||
      quantity > SHOP_MAX_QUANTITY_PER_LINE
    ) {
      return { error: "Quantité invalide." };
    }
    // Un rang est un abonnement : une seule unité par commande.
    lines.push({ entry, quantity: entry.kind === "grade" ? 1 : quantity });
  }
  return { lines };
}

export async function POST(request: Request) {
  if (!env.shopEnabled) {
    return Response.json(
      {
        error:
          "Boutique fermée — ouverture prévue pour la S1 après changement d'hébergeur.",
      },
      { status: 503 },
    );
  }

  const user = await getSessionUser().catch(() => null);
  if (!user || !user.mc) {
    return Response.json(
      { error: "Connecte-toi avec Discord et lie ton compte Minecraft pour commander." },
      { status: 401 },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Requête illisible." }, { status: 400 });
  }

  const cart = parseCart(body);
  if ("error" in cart) {
    return Response.json({ error: cart.error }, { status: 400 });
  }

  // Tarification 100 % serveur, à partir du catalogue.
  const totalEur =
    Math.round(
      cart.lines.reduce((sum, line) => sum + line.entry.priceEur * line.quantity, 0) * 100,
    ) / 100;

  return Response.json(
    {
      error: "Paiement en cours d'intégration",
      detail: {
        totalEur,
        lines: cart.lines.map((line) => ({
          id: line.entry.id,
          quantity: line.quantity,
          priceEur: line.entry.priceEur,
        })),
      },
    },
    { status: 501 },
  );
}
