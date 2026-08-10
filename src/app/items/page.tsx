import type { Metadata } from "next";
import { ITEMS } from "@/lib/items-data";
import { ItemsCatalog } from "./items-catalog";

export const metadata: Metadata = {
  title: "Items",
  description:
    "Le catalogue des items forgés de CANTALE : Pickantaxes, Cantaxes, Multi-Cantools, Cantalame, Vies, runes et armure du Garde — effets et obtention.",
};

export default function ItemsPage() {
  return (
    <main className="mx-auto w-full max-w-7xl px-5 pb-24 pt-28 sm:px-8 sm:pt-32">
      <header className="flex flex-col gap-4 pb-14">
        <span className="font-tech text-[10px] uppercase tracking-[0.3em] text-ember-glow">
          Le registre des forges
        </span>
        <h1 className="font-display text-4xl font-semibold leading-[1.05] text-bone sm:text-5xl">
          Items forgés
        </h1>
        <p className="max-w-2xl text-base leading-relaxed text-steel">
          Ces artefacts n&apos;existent que sur CANTALE. Aucun ne se crafte : ils se gagnent
          dans les caisses, au fil des grades ou lors d&apos;événements — et ils changent
          l&apos;équilibre d&apos;un fight comme d&apos;un chantier.
        </p>
      </header>

      <ItemsCatalog items={ITEMS} />
    </main>
  );
}
