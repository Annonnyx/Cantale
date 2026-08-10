import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { WIKI_CATEGORIES, getCategory } from "@/lib/wiki-content";
import { WikiSearch } from "../wiki-search";

export const dynamicParams = false;

export function generateStaticParams() {
  return WIKI_CATEGORIES.map((category) => ({ categorie: category.slug }));
}

interface CategoryPageProps {
  params: Promise<{ categorie: string }>;
}

export async function generateMetadata({ params }: CategoryPageProps): Promise<Metadata> {
  const { categorie } = await params;
  const category = getCategory(categorie);
  if (!category) return {};
  return {
    title: `Wiki — ${category.name}`,
    description: category.description,
  };
}

export default async function WikiCategoryPage({ params }: CategoryPageProps) {
  const { categorie } = await params;
  const category = getCategory(categorie);
  if (!category) notFound();

  return (
    <main className="mx-auto w-full max-w-7xl px-5 pb-24 pt-28 sm:px-8 sm:pt-32">
      <nav aria-label="Fil d'Ariane" className="pb-8">
        <Link
          href="/wiki"
          className="font-tech text-[10px] uppercase tracking-[0.25em] text-steel transition-colors hover:text-bone motion-reduce:transition-none"
        >
          ← Wiki
        </Link>
      </nav>

      <header className="flex flex-col gap-4 pb-12">
        <span className="font-tech text-[10px] uppercase tracking-[0.3em] text-ember-glow">
          {category.tagline}
        </span>
        <h1 className="font-display text-4xl font-semibold leading-[1.05] text-bone sm:text-5xl">
          {category.name}
        </h1>
        <p className="max-w-2xl text-base leading-relaxed text-steel">{category.description}</p>
        <div className="mt-4 max-w-xl">
          <WikiSearch />
        </div>
      </header>

      <section
        aria-labelledby="category-articles"
        className="border-t border-iron-line/60 py-14"
      >
        <span className="font-tech text-[10px] uppercase tracking-[0.3em] text-ember-glow">
          {category.articles.length} article{category.articles.length > 1 ? "s" : ""}
        </span>
        <h2 id="category-articles" className="sr-only">
          Articles de la catégorie {category.name}
        </h2>
        <div className="mt-8 flex flex-col gap-4">
          {category.articles.map((article) => (
            <Link
              key={article.slug}
              href={`/wiki/${category.slug}/${article.slug}`}
              className="card-lift group flex flex-col gap-3 border border-iron-line bg-iron p-6 hover:border-ember sm:flex-row sm:items-center sm:justify-between sm:gap-10"
            >
              <span className="flex flex-col gap-2">
                <span className="font-display text-xl font-semibold text-steel-light transition-colors group-hover:text-bone motion-reduce:transition-none">
                  {article.title}
                </span>
                <span className="max-w-2xl text-sm leading-relaxed text-steel">
                  {article.summary}
                </span>
              </span>
              <span className="shrink-0 font-tech text-[10px] uppercase tracking-[0.25em] text-ember-glow">
                Lire <span className="cta-arrow">→</span>
              </span>
            </Link>
          ))}
        </div>
      </section>

      <nav aria-label="Autres catégories" className="border-t border-iron-line/60 pt-10">
        <span className="font-tech text-[10px] uppercase tracking-[0.3em] text-steel">
          Autres catégories
        </span>
        <div className="mt-4 flex flex-wrap gap-x-6 gap-y-3">
          {WIKI_CATEGORIES.filter((entry) => entry.slug !== category.slug).map((entry) => (
            <Link
              key={entry.slug}
              href={`/wiki/${entry.slug}`}
              className="font-tech text-[11px] uppercase tracking-[0.22em] text-steel transition-colors hover:text-bone motion-reduce:transition-none"
            >
              {entry.name}
            </Link>
          ))}
        </div>
      </nav>
    </main>
  );
}
