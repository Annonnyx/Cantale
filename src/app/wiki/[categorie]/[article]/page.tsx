import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  WIKI_CATEGORIES,
  getAllArticles,
  getArticle,
  getArticleHref,
  getRelatedArticles,
  type WikiSection,
} from "@/lib/wiki-content";

export const dynamicParams = false;

export function generateStaticParams() {
  return getAllArticles().map(({ category, article }) => ({
    categorie: category.slug,
    article: article.slug,
  }));
}

interface ArticlePageProps {
  params: Promise<{ categorie: string; article: string }>;
}

export async function generateMetadata({ params }: ArticlePageProps): Promise<Metadata> {
  const { categorie, article: articleSlug } = await params;
  const ref = getArticle(categorie, articleSlug);
  if (!ref) return {};
  return {
    title: ref.article.title,
    description: ref.article.summary,
  };
}

function SectionBody({ section }: { section: WikiSection }) {
  return (
    <section aria-labelledby={section.id} className="flex flex-col gap-5">
      <h2
        id={section.id}
        className="scroll-mt-28 font-display text-2xl font-semibold text-bone"
      >
        {section.title}
      </h2>
      {section.paragraphs?.map((paragraph, index) => (
        <p key={index} className="max-w-3xl text-base leading-relaxed text-steel">
          {paragraph}
        </p>
      ))}
      {section.list && (
        <ul className="flex max-w-3xl flex-col gap-2.5">
          {section.list.map((item, index) => (
            <li key={index} className="flex gap-3 text-base leading-relaxed text-steel">
              <span aria-hidden="true" className="shrink-0 text-ember-glow">
                —
              </span>
              <span>{item}</span>
            </li>
          ))}
        </ul>
      )}
      {section.tables?.map((table, tableIndex) => (
        <div key={tableIndex} className="max-w-4xl overflow-x-auto">
          {table.caption && (
            <p className="mb-2 font-tech text-[10px] uppercase tracking-[0.22em] text-gold">
              {table.caption}
            </p>
          )}
          <table className="w-full min-w-[28rem] border-collapse border border-iron-line text-left text-sm">
            <thead>
              <tr className="bg-iron">
                {table.headers.map((header) => (
                  <th
                    key={header}
                    className="border border-iron-line px-3 py-2.5 font-tech text-[10px] uppercase tracking-[0.18em] text-ember-glow"
                  >
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {table.rows.map((row, rowIndex) => (
                <tr key={rowIndex} className="bg-ash-deep/40">
                  {row.map((cell, cellIndex) => (
                    <td
                      key={cellIndex}
                      className="border border-iron-line px-3 py-2.5 align-top leading-relaxed text-steel"
                    >
                      {cell}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ))}
      {section.commands && (
        <div className="flex flex-col gap-3">
          {section.commands.map((command) => (
            <div
              key={command.syntax}
              className="border border-iron-line bg-ash-deep px-4 py-3.5"
            >
              <code className="block font-tech text-sm leading-snug text-ember-glow">
                {command.syntax}
              </code>
              <p className="mt-1.5 text-sm leading-relaxed text-steel">
                {command.description}
              </p>
              {command.note && (
                <p className="mt-2 font-tech text-[10px] uppercase tracking-[0.2em] text-gold">
                  {command.note}
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

export default async function WikiArticlePage({ params }: ArticlePageProps) {
  const { categorie, article: articleSlug } = await params;
  const ref = getArticle(categorie, articleSlug);
  if (!ref) notFound();

  const { category, article } = ref;
  const related = getRelatedArticles(article);

  return (
    <main className="mx-auto w-full max-w-7xl px-5 pb-24 pt-28 sm:px-8 sm:pt-32">
      <nav aria-label="Fil d'Ariane" className="pb-8">
        <ol className="flex flex-wrap items-center gap-x-3 gap-y-1 font-tech text-[10px] uppercase tracking-[0.25em] text-steel">
          <li>
            <Link
              href="/wiki"
              className="transition-colors hover:text-bone motion-reduce:transition-none"
            >
              Wiki
            </Link>
          </li>
          <li aria-hidden="true">/</li>
          <li>
            <Link
              href={`/wiki/${category.slug}`}
              className="transition-colors hover:text-bone motion-reduce:transition-none"
            >
              {category.name}
            </Link>
          </li>
          <li aria-hidden="true">/</li>
          <li aria-current="page" className="text-ember-glow">
            {article.title}
          </li>
        </ol>
      </nav>

      <div className="lg:grid lg:grid-cols-[240px_minmax(0,1fr)] lg:gap-14">
        <aside className="mb-12 lg:mb-0">
          <nav
            aria-label="Navigation du wiki"
            className="border border-iron-line bg-iron p-5 lg:sticky lg:top-24 lg:max-h-[calc(100vh-7rem)] lg:overflow-y-auto"
          >
            <span className="font-tech text-[10px] uppercase tracking-[0.3em] text-ember-glow">
              Sommaire du registre
            </span>
            <ul className="mt-4 flex flex-col gap-4">
              {WIKI_CATEGORIES.map((entry) => (
                <li key={entry.slug}>
                  <Link
                    href={`/wiki/${entry.slug}`}
                    className={`font-tech text-[11px] uppercase tracking-[0.22em] transition-colors motion-reduce:transition-none ${
                      entry.slug === category.slug
                        ? "text-bone"
                        : "text-steel hover:text-bone"
                    }`}
                  >
                    {entry.name}
                  </Link>
                  {entry.slug === category.slug && (
                    <ul className="mt-2 flex flex-col gap-1.5 border-l border-iron-line pl-3">
                      {entry.articles.map((entryArticle) => (
                        <li key={entryArticle.slug}>
                          <Link
                            href={`/wiki/${entry.slug}/${entryArticle.slug}`}
                            aria-current={
                              entryArticle.slug === article.slug ? "page" : undefined
                            }
                            className={`text-sm leading-snug transition-colors motion-reduce:transition-none ${
                              entryArticle.slug === article.slug
                                ? "text-ember-glow"
                                : "text-steel hover:text-bone"
                            }`}
                          >
                            {entryArticle.title}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  )}
                </li>
              ))}
            </ul>
          </nav>
        </aside>

        <article className="min-w-0">
          <header className="flex flex-col gap-4 border-b border-iron-line/60 pb-10">
            <span className="font-tech text-[10px] uppercase tracking-[0.3em] text-ember-glow">
              {category.name}
            </span>
            <h1 className="font-display text-4xl font-semibold leading-[1.05] text-bone sm:text-5xl">
              {article.title}
            </h1>
            <p className="max-w-2xl text-base leading-relaxed text-steel">{article.summary}</p>
          </header>

          <nav
            aria-label="Sommaire de l'article"
            className="mt-8 border border-iron-line bg-iron p-5"
          >
            <span className="font-tech text-[10px] uppercase tracking-[0.3em] text-gold">
              Dans cet article
            </span>
            <ul className="mt-3 flex flex-col gap-2">
              {article.sections.map((section, index) => (
                <li key={section.id}>
                  <a
                    href={`#${section.id}`}
                    className="group flex items-baseline gap-3 text-sm text-steel transition-colors hover:text-bone motion-reduce:transition-none"
                  >
                    <span className="font-tech text-[10px] tracking-[0.2em] text-ember-glow">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    <span className="transition-colors">
                      {section.title}
                    </span>
                  </a>
                </li>
              ))}
            </ul>
          </nav>

          <div className="mt-10 flex flex-col gap-12">
            {article.sections.map((section) => (
              <SectionBody key={section.id} section={section} />
            ))}
          </div>

          {related.length > 0 && (
            <section
              aria-labelledby="related-articles"
              className="mt-16 border-t border-iron-line/60 pt-10"
            >
              <span className="font-tech text-[10px] uppercase tracking-[0.3em] text-ember-glow">
                À lire ensuite
              </span>
              <h2 id="related-articles" className="sr-only">
                Articles liés
              </h2>
              <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {related.map((relatedRef) => (
                  <Link
                    key={relatedRef.article.slug}
                    href={getArticleHref(relatedRef)}
                    className="card-lift group flex flex-col gap-2 border border-iron-line bg-iron p-5"
                  >
                    <span className="font-tech text-[10px] uppercase tracking-[0.24em] text-ember-glow">
                      {relatedRef.category.name}
                    </span>
                    <span className="font-display text-base font-semibold text-steel-light transition-colors group-hover:text-bone motion-reduce:transition-none">
                      {relatedRef.article.title}
                    </span>
                    <span className="text-sm leading-relaxed text-steel">
                      {relatedRef.article.summary}
                    </span>
                  </Link>
                ))}
              </div>
            </section>
          )}
        </article>
      </div>
    </main>
  );
}
