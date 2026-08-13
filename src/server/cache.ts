import { unstable_cache } from "next/cache";
import { cache as reactCache } from "react";

/**
 * Cache inter-requêtes (Vercel Data Cache / Full Route Cache).
 * TTL court : les pages publiques restent « live » sans re-taper MySQL
 * à chaque cold start serverless.
 *
 * La fonction `fn` ne doit pas lire cookies/headers — uniquement des
 * arguments serialisables déjà inclus dans `keyParts`.
 */
export function cachedQuery<T>(
  keyParts: string[],
  ttlSeconds: number,
  fn: () => Promise<T>,
): Promise<T> {
  return unstable_cache(fn, keyParts, { revalidate: ttlSeconds })();
}

/**
 * Déduplique les lectures identiques dans un même rendu RSC
 * (ex. generateMetadata + page).
 */
export { reactCache };
