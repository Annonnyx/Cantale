import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getItemBySlug, ITEMS, CATEGORY_LABELS, RARITY_LABELS, RARITY_STYLES } from "@/lib/items-data";
import { ItemVisual } from "../item-visual";

type Params = { slug: string };

export function generateStaticParams(): Params[] {
  return ITEMS.map((item) => ({ slug: item.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { slug } = await params;
  const item = getItemBySlug(slug);
  if (!item) return { title: "Item introuvable" };
  return {
    title: item.name,
    description: `${item.tagline} — ${RARITY_LABELS[item.rarity]}, ${CATEGORY_LABELS[item.category].toLowerCase()} forgé sur CANTALE.`,
  };
}

export default async function ItemDetailPage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { slug } = await params;
  const item = getItemBySlug(slug);
  if (!item) notFound();

  const styles = RARITY_STYLES[item.rarity];

  return (
    <main className="mx-auto w-full max-w-7xl px-5 pb-24 pt-28 sm:px-8 sm:pt-32">
      <nav aria-label="Fil d'Ariane" className="pb-10">
        <Link
          href="/items"
          className="font-tech text-[10px] uppercase tracking-[0.25em] text-steel transition-colors hover:text-bone"
        >
          ← Tous les items
        </Link>
      </nav>

      <article className="flex flex-col gap-12">
        <header className="flex flex-col gap-6 sm:flex-row sm:items-start sm:gap-10">
          <ItemVisual item={item} size="lg" />
          <div className="flex flex-col gap-4">
            <div className="flex flex-wrap items-center gap-3">
              <span
                className={`border px-2.5 py-1 font-tech text-[10px] uppercase tracking-[0.24em] ${styles.chip}`}
              >
                {RARITY_LABELS[item.rarity]}
              </span>
              <span className="border border-iron-line px-2.5 py-1 font-tech text-[10px] uppercase tracking-[0.24em] text-steel">
                {CATEGORY_LABELS[item.category]}
              </span>
            </div>
            <h1 className={`font-display text-4xl font-semibold leading-[1.05] sm:text-5xl ${styles.text}`}>
              {item.name}
            </h1>
            <p className="max-w-2xl text-base leading-relaxed text-steel">{item.description}</p>
          </div>
        </header>

        <div className="grid gap-4 lg:grid-cols-2">
          <section
            aria-labelledby="item-effets"
            className="border border-iron-line bg-iron p-6 sm:p-8"
          >
            <h2
              id="item-effets"
              className="font-tech text-[10px] uppercase tracking-[0.3em] text-ember-glow"
            >
              Effets & caractéristiques
            </h2>
            <dl className="mt-6 flex flex-col">
              {item.stats.map((stat) => (
                <div
                  key={stat.label}
                  className="flex flex-col gap-1 border-b border-iron-line/60 py-3.5 last:border-b-0 sm:flex-row sm:items-baseline sm:justify-between sm:gap-6"
                >
                  <dt className="shrink-0 font-tech text-[10px] uppercase tracking-[0.2em] text-steel">
                    {stat.label}
                  </dt>
                  <dd className="text-sm leading-relaxed text-bone sm:text-right">{stat.value}</dd>
                </div>
              ))}
            </dl>
          </section>

          <div className="flex flex-col gap-4">
            <section
              aria-labelledby="item-obtention"
              className="border border-iron-line bg-iron p-6 sm:p-8"
            >
              <h2
                id="item-obtention"
                className="font-tech text-[10px] uppercase tracking-[0.3em] text-ember-glow"
              >
                Obtention
              </h2>
              <ul className="mt-6 flex flex-col gap-3">
                {item.obtention.map((source) => (
                  <li key={source} className="flex items-start gap-3 text-sm leading-relaxed text-bone">
                    <span aria-hidden className="mt-[7px] h-1.5 w-1.5 shrink-0 bg-gold" />
                    {source}
                  </li>
                ))}
              </ul>
            </section>

            <section
              aria-labelledby="item-variantes"
              className="border border-iron-line bg-iron p-6 sm:p-8"
            >
              <h2
                id="item-variantes"
                className="font-tech text-[10px] uppercase tracking-[0.3em] text-ember-glow"
              >
                {item.variants.length > 1 ? "Variantes" : "Variante"}
              </h2>
              <ul className="mt-6 flex flex-col">
                {item.variants.map((variant) => (
                  <li
                    key={variant.name}
                    className="flex flex-col gap-0.5 border-b border-iron-line/60 py-3 last:border-b-0 sm:flex-row sm:items-baseline sm:justify-between sm:gap-6"
                  >
                    <span className="font-display text-sm font-semibold text-bone">
                      {variant.name}
                    </span>
                    {variant.note && (
                      <span className="text-xs leading-relaxed text-steel sm:text-right">
                        {variant.note}
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            </section>
          </div>
        </div>
      </article>
    </main>
  );
}
