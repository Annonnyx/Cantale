"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import type { CatalogItem, ItemCategory, ItemRarity } from "@/lib/items-data";
import { CATEGORY_LABELS, RARITY_LABELS, RARITY_STYLES } from "@/lib/items-data";
import { ItemVisual } from "./item-visual";

type CategoryFilter = ItemCategory | "toutes";
type RarityFilter = ItemRarity | "toutes";

const CATEGORY_FILTERS: CategoryFilter[] = ["toutes", "outil", "arme", "armure", "consommable"];
const RARITY_FILTERS: RarityFilter[] = ["toutes", "rare", "epique", "mythique", "legendaire"];

function filterLabel(filter: CategoryFilter | RarityFilter): string {
  if (filter === "toutes") return "Toutes";
  if (filter in CATEGORY_LABELS) return CATEGORY_LABELS[filter as ItemCategory];
  return RARITY_LABELS[filter as ItemRarity];
}

export function ItemsCatalog({ items }: { items: CatalogItem[] }) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<CategoryFilter>("toutes");
  const [rarity, setRarity] = useState<RarityFilter>("toutes");

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return items.filter((item) => {
      if (category !== "toutes" && item.category !== category) return false;
      if (rarity !== "toutes" && item.rarity !== rarity) return false;
      if (!needle) return true;
      const haystack = [
        item.name,
        item.tagline,
        item.description,
        ...item.variants.map((variant) => variant.name),
      ]
        .join(" ")
        .toLowerCase();
      return haystack.includes(needle);
    });
  }, [items, query, category, rarity]);

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-5 border border-iron-line bg-iron p-5">
        <label className="flex flex-col gap-2">
          <span className="font-tech text-[10px] uppercase tracking-[0.24em] text-steel">
            Recherche
          </span>
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Pickantaxe, Cantalame, vie…"
            className="w-full border border-iron-line bg-ash-deep px-4 py-2.5 font-sans text-sm text-bone placeholder:text-steel/60 focus:border-ember focus:outline-none"
          />
        </label>

        <div className="grid gap-5 sm:grid-cols-2">
          <FilterGroup
            legend="Catégorie"
            filters={CATEGORY_FILTERS}
            active={category}
            onChange={(value) => setCategory(value as CategoryFilter)}
          />
          <FilterGroup
            legend="Rareté"
            filters={RARITY_FILTERS}
            active={rarity}
            onChange={(value) => setRarity(value as RarityFilter)}
          />
        </div>
      </div>

      <p aria-live="polite" className="font-tech text-[10px] uppercase tracking-[0.24em] text-steel">
        {filtered.length} artefact{filtered.length > 1 ? "s" : ""} recensé
        {filtered.length > 1 ? "s" : ""}
      </p>

      {filtered.length === 0 ? (
        <div className="flex flex-col items-start gap-4 border border-iron-line bg-iron p-8">
          <p className="font-display text-xl font-semibold text-bone">
            Aucun artefact ne correspond.
          </p>
          <p className="text-sm leading-relaxed text-steel">
            Le registre des forges est précis — essaie un autre nom ou élargis les filtres.
          </p>
          <button
            type="button"
            onClick={() => {
              setQuery("");
              setCategory("toutes");
              setRarity("toutes");
            }}
            className="pressable border border-iron-line px-4 py-2 font-tech text-[11px] uppercase tracking-[0.22em] text-steel hover:border-bone hover:text-bone"
          >
            Réinitialiser
          </button>
        </div>
      ) : (
        <div className="reveal reveal-stagger grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((item) => (
            <ItemCard key={item.slug} item={item} />
          ))}
        </div>
      )}
    </div>
  );
}

function FilterGroup({
  legend,
  filters,
  active,
  onChange,
}: {
  legend: string;
  filters: (CategoryFilter | RarityFilter)[];
  active: CategoryFilter | RarityFilter;
  onChange: (value: string) => void;
}) {
  return (
    <fieldset className="flex flex-col gap-2">
      <legend className="mb-2 font-tech text-[10px] uppercase tracking-[0.24em] text-steel">
        {legend}
      </legend>
      <div className="flex flex-wrap gap-2">
        {filters.map((filter) => {
          const isActive = filter === active;
          return (
            <button
              key={filter}
              type="button"
              aria-pressed={isActive}
              onClick={() => onChange(filter)}
              className={`chip border px-3 py-1.5 font-tech text-[10px] uppercase tracking-[0.2em] ${
                isActive
                  ? "border-ember text-ember-glow"
                  : "border-iron-line text-steel hover:border-steel hover:text-bone"
              }`}
            >
              {filterLabel(filter)}
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}

function ItemCard({ item }: { item: CatalogItem }) {
  const styles = RARITY_STYLES[item.rarity];
  return (
    <Link
      href={`/items/${item.slug}`}
      className={`card-lift group flex flex-col gap-4 border bg-iron p-5 hover:bg-iron-light ${styles.border}`}
    >
      <div className="flex items-start justify-between gap-3">
        <ItemVisual item={item} />
        <span
          className={`border px-2 py-1 font-tech text-[9px] uppercase tracking-[0.22em] ${styles.chip}`}
        >
          {RARITY_LABELS[item.rarity]}
        </span>
      </div>
      <div className="flex flex-col gap-1.5">
        <span className="font-display text-lg font-semibold text-steel-light transition-colors group-hover:text-bone">
          {item.name}
        </span>
        <span className="text-sm leading-relaxed text-steel">{item.tagline}</span>
      </div>
      <div className="mt-auto flex items-center justify-between border-t border-iron-line/60 pt-3">
        <span className="font-tech text-[9px] uppercase tracking-[0.22em] text-steel">
          {CATEGORY_LABELS[item.category]}
        </span>
        <span className="font-tech text-[10px] uppercase tracking-[0.25em] text-ember-glow">
          Fiche <span className="cta-arrow">→</span>
        </span>
      </div>
    </Link>
  );
}
