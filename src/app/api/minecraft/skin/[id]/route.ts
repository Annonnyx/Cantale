import {
  fetchMinecraftSkinPng,
  isValidMinecraftId,
  missingTextureResponse,
  pngResponse,
} from "@/server/minecraft-textures";

/** ISR + CDN : un skin ne change pas toutes les secondes. */
export const revalidate = 21_600;

type Ctx = { params: Promise<{ id: string }> };

/**
 * GET /api/minecraft/skin/[id]
 * Proxy same-origin du PNG skin (64×64). `id` = UUID (avec/sans tirets) ou pseudo.
 * Crafthead + mc-heads en parallèle, Mojang en repli.
 */
export async function GET(_request: Request, { params }: Ctx) {
  const { id: raw } = await params;
  const id = decodeURIComponent(raw ?? "").trim();
  if (!isValidMinecraftId(id)) {
    return new Response("Identifiant invalide", { status: 400 });
  }

  const png = await fetchMinecraftSkinPng(id);
  if (!png) return missingTextureResponse("skin");
  return pngResponse(png.body, png.contentType);
}
