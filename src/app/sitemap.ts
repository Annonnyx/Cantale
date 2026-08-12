import type { MetadataRoute } from "next";
import { ITEMS } from "@/lib/items-data";
import { getAllArticles, getArticleHref, WIKI_CATEGORIES } from "@/lib/wiki-content";

const BASE_URL = "https://cantale.world";

type ChangeFrequency = MetadataRoute.Sitemap[number]["changeFrequency"];

function entry(path: string, changeFrequency: ChangeFrequency, priority: number) {
  return { url: `${BASE_URL}${path}`, lastModified: new Date(), changeFrequency, priority };
}

/**
 * Sitemap des routes publiques. Les pages data (factions, classements, stats…)
 * sont listées même si dynamiques. /design (noindex) et /connexion restent hors
 * du plan — surface compte, pas vitrine SEO.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  return [
    entry("/", "weekly", 1),
    entry("/items", "weekly", 0.8),
    entry("/wiki", "weekly", 0.8),
    entry("/factions", "daily", 0.8),
    entry("/classements", "daily", 0.7),
    entry("/stats", "hourly", 0.7),
    entry("/carte", "hourly", 0.7),
    entry("/chat", "hourly", 0.7),
    entry("/vote", "weekly", 0.7),
    entry("/la-liste", "daily", 0.6),
    entry("/boutique", "weekly", 0.6),
    entry("/reglement", "monthly", 0.6),
    entry("/mentions-legales", "yearly", 0.3),
    entry("/confidentialite", "yearly", 0.3),
    entry("/cookies", "yearly", 0.3),
    entry("/recrutement", "monthly", 0.6),
    entry("/partenariats", "monthly", 0.5),
    ...WIKI_CATEGORIES.map((category) => entry(`/wiki/${category.slug}`, "monthly", 0.6)),
    ...getAllArticles().map((ref) => entry(getArticleHref(ref), "monthly", 0.7)),
    ...ITEMS.map((item) => entry(`/items/${item.slug}`, "monthly", 0.7)),
  ];
}
