import {
  fetchMinecraftSkinPng,
  isValidMinecraftId,
  pngResponse,
} from "@/server/minecraft-textures";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

/**
 * GET /api/minecraft/skin/[id]
 * Proxy same-origin du PNG skin (64×64). `id` = UUID (avec/sans tirets) ou pseudo.
 * Chaîne : Mojang textures → crafthead → mc-heads.
 */
export async function GET(_request: Request, { params }: Ctx) {
  const { id: raw } = await params;
  const id = decodeURIComponent(raw ?? "").trim();
  if (!isValidMinecraftId(id)) {
    return new Response("Identifiant invalide", { status: 400 });
  }

  const png = await fetchMinecraftSkinPng(id);
  if (!png) {
    return new Response("Skin introuvable", { status: 404 });
  }
  return pngResponse(png.body, png.contentType);
}
