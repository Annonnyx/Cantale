import {
  fetchMinecraftAvatarPng,
  isValidMinecraftId,
  missingTextureResponse,
  pngResponse,
} from "@/server/minecraft-textures";

/** ISR + CDN : les avatars ne doivent pas re-proxy Mojang à chaque listing. */
export const revalidate = 21_600;

type Ctx = { params: Promise<{ id: string }> };

/**
 * GET /api/minecraft/avatar/[id]?size=160
 * Proxy same-origin de l'avatar tête 2D. Crafthead + mc-heads en parallèle.
 */
export async function GET(request: Request, { params }: Ctx) {
  const { id: raw } = await params;
  const id = decodeURIComponent(raw ?? "").trim();
  if (!isValidMinecraftId(id)) {
    return new Response("Identifiant invalide", { status: 400 });
  }

  const sizeParam = Number(new URL(request.url).searchParams.get("size") ?? "160");
  const size = Number.isFinite(sizeParam) ? sizeParam : 160;

  const png = await fetchMinecraftAvatarPng(id, size);
  if (!png) return missingTextureResponse("avatar");
  return pngResponse(png.body, png.contentType);
}
