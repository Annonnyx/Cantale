/**
 * URLs de textures / avatars Minecraft (same-origin).
 *
 * Le navigateur ne parle plus aux CDN tiers (crafatar 521, CORS, adblock) :
 * `/api/minecraft/*` résout côté serveur Mojang → textures.minecraft.net,
 * avec repli crafthead puis mc-heads.
 */

/** Texture skin PNG (64×64) pour skinview3d — préférer l'UUID. */
export function minecraftSkinUrl(uuidOrName: string): string {
  return `/api/minecraft/skin/${encodeURIComponent(uuidOrName)}`;
}

/** Avatar tête 2D (repli si WebGL indisponible, classements, etc.). */
export function minecraftAvatarUrl(uuidOrName: string, size = 160): string {
  return `/api/minecraft/avatar/${encodeURIComponent(uuidOrName)}?size=${size}`;
}
