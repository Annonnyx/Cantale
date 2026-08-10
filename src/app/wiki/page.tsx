import type { Metadata } from "next";
import Link from "next/link";
import {
  WIKI_CATEGORIES,
  getAllArticles,
  getArticleHref,
  getFeaturedArticles,
} from "@/lib/wiki-content";
import { WikiSearch } from "./wiki-search";

export const metadata: Metadata = {
  title: "Wiki",
  description:
    "Le registre complet du serveur CANTALE : commandes, factions, économie, vies, événements et items forgés.",
};

export default function WikiPage() {
  const featured = getFeaturedArticles();
  const totalArticles = getAllArticles().length;

  return (
    <main className="mx-auto w-full max-w-7xl px-5 pb-24 pt-28 sm:px-8 sm:pt-32">
      <header className="flex flex-col gap-4 pb-12">
        <span className="font-tech text-[10px] uppercase tracking-[0.3em] text-ember-glow">
          Le registre du serveur
        </span>
        <h1 className="font-display text-4xl font-semibold leading-[1.05] text-bone sm:text-5xl">
          Wiki
        </h1>
        <p className="max-w-2xl text-base leading-relaxed text-steel">
          Tout ce que le registre consigne : commandes exactes, mécaniques des trois vies,
          factions et claims, économie Cantox, événements et items forgés.{" "}
          {totalArticles} articles, zéro rumeur.
        </p>
        <div className="mt-4 max-w-xl">
          <WikiSearch />
        </div>
      </header>

      <section aria-labelledby="wiki-categories" className="border-t border-iron-line/60 py-14">
        <span className="font-tech text-[10px] uppercase tracking-[0.3em] text-ember-glow">
          01 — Catégories
        </span>
        <h2 id="wiki-categories" className="mt-3 font-display text-3xl font-semibold text-bone">
          Parcourir le registre
        </h2>
        <div className="reveal reveal-stagger mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {WIKI_CATEGORIES.map((category, index) => (
            <Link
              key={category.slug}
              href={`/wiki/${category.slug}`}
              className="card-lift group flex flex-col gap-3 border border-iron-line bg-iron p-6 hover:border-ember"
            >
              <div className="flex items-baseline justify-between gap-4">
                <span className="font-tech text-[10px] uppercase tracking-[0.24em] text-steel">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <span className="font-tech text-[10px] uppercase tracking-[0.2em] text-ember-glow">
                  {category.articles.length} article{category.articles.length > 1 ? "s" : ""}
                </span>
              </div>
              <span className="font-display text-xl font-semibold text-steel-light transition-colors group-hover:text-bone motion-reduce:transition-none">
                {category.name}
              </span>
              <span className="font-tech text-[10px] uppercase tracking-[0.22em] text-gold">
                {category.tagline}
              </span>
              <span className="text-sm leading-relaxed text-steel">{category.description}</span>
              <span className="mt-auto pt-2 font-tech text-[10px] uppercase tracking-[0.25em] text-ember-glow">
                Ouvrir <span className="cta-arrow">→</span>
              </span>
            </Link>
          ))}
        </div>
      </section>

      <section aria-labelledby="wiki-featured" className="border-t border-iron-line/60 py-14">
        <span className="font-tech text-[10px] uppercase tracking-[0.3em] text-ember-glow">
          02 — À la une
        </span>
        <h2 id="wiki-featured" className="mt-3 font-display text-3xl font-semibold text-bone">
          Articles mis en avant
        </h2>
        <div className="reveal reveal-stagger mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {featured.map((ref) => (
            <Link
              key={ref.article.slug}
              href={getArticleHref(ref)}
              className="card-lift group flex flex-col gap-3 border border-iron-line bg-iron p-6 hover:border-ember"
            >
              <span className="font-tech text-[10px] uppercase tracking-[0.24em] text-ember-glow">
                {ref.category.name}
              </span>
              <span className="font-display text-lg font-semibold text-steel-light transition-colors group-hover:text-bone motion-reduce:transition-none">
                {ref.article.title}
              </span>
              <span className="text-sm leading-relaxed text-steel">{ref.article.summary}</span>
              <span className="mt-auto pt-2 font-tech text-[10px] uppercase tracking-[0.25em] text-ember-glow">
                Lire <span className="cta-arrow">→</span>
              </span>
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
}
