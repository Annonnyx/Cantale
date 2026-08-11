import {
  fetchMinecraftAvatarPng,
  isValidMinecraftId,
  pngResponse,
} from "@/server/minecraft-textures";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

/**
 * GET /api/minecraft/avatar/[id]?size=160
 * Proxy same-origin de l'avatar tête 2D. Résolu côté serveur (crafthead → mc-heads).
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
  if (!png) {
    return new Response("Avatar introuvable", { status: 404 });
  }
  return pngResponse(png.body, png.contentType);
}
