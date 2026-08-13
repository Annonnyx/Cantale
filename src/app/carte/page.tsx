import type { Metadata } from "next";
import { mapProviderPublicUrl, mapProviderTileBase } from "@/lib/map-provider";
import { getMapWarps } from "@/server/repo/map";
import { MapExplorer } from "./map-explorer";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Carte",
  description:
    "La carte des territoires de CANTALE : claims de factions, zones PASDIC protégées et warps publics sur le relief Squaremap.",
};

export default async function CartePage() {
  const warps = await getMapWarps();
  const providerUrl = mapProviderPublicUrl();
  const tileBase = mapProviderTileBase();
  const generatedAt = new Date().toISOString();

  return (
    <main className="mx-auto w-full max-w-7xl px-5 pb-24 pt-28 sm:px-8 sm:pt-32">
      <header className="flex flex-col gap-4 pb-10">
        <span className="font-tech text-[10px] uppercase tracking-[0.3em] text-ember-glow">
          Le registre des terres
        </span>
        <h1 className="font-display text-4xl font-semibold leading-[1.05] text-bone sm:text-5xl">
          Carte
        </h1>
        <p className="max-w-2xl text-base leading-relaxed text-steel">
          Relief live Squaremap et territoires du registre : claims, zones
          PASDIC protégées et warps publics — sans positions de joueurs. Les
          factions en /f secret n&apos;y figurent pas. Vue centrée sur le spawn
          (−67 · −144).
        </p>
      </header>

      <MapExplorer
        initialClaims={[]}
        initialMarkers={warps ?? []}
        generatedAt={generatedAt}
        providerUrl={providerUrl}
        tileBase={tileBase}
      />
    </main>
  );
}
