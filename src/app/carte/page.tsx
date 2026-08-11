import type { Metadata } from "next";
import { mapProviderPublicUrl, mapProviderTileBase } from "@/lib/map-provider";
import { getMapClaims, getMapWarps } from "@/server/repo/map";
import { MapExplorer } from "./map-explorer";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Carte",
  description:
    "La carte des territoires de CANTALE : claims de factions, zones PASDIC protégées et warps publics sur le relief Squaremap.",
};

export default async function CartePage() {
  const [claims, warps] = await Promise.all([getMapClaims(), getMapWarps()]);
  // HTTP → `/map-provider/index.html` (rewrite same-origin) pour éviter le mixed content.
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
          PASDIC protégées et warps publics. Les factions en /f secret n&apos;y
          figurent pas — le registre respecte la clandestinité. Vue centrée sur
          le spawn (−67 · −144).
        </p>
      </header>

      {claims === null ? (
        <>
          <div className="flex flex-col items-start gap-4 border border-iron-line bg-iron p-8 sm:p-10">
            <p className="font-display text-xl font-semibold text-bone">
              Le registre des territoires est muet pour l&apos;instant.
            </p>
            <p className="max-w-xl text-sm leading-relaxed text-steel">
              Les archives ne répondent pas. La carte se redressera dès que la
              base parlera à nouveau — sur CANTALE, même le silence est temporaire.
            </p>
          </div>
          {providerUrl && (
            <div className="mt-4 flex flex-col gap-3 border border-iron-line bg-iron p-6">
              <span className="font-tech text-[10px] uppercase tracking-[0.24em] text-steel">
                Carte Squaremap
              </span>
              <a
                href={providerUrl}
                target="_blank"
                rel="noreferrer"
                className="font-tech text-[10px] uppercase tracking-[0.25em] text-ember-glow transition-colors hover:text-bone"
              >
                Ouvrir la carte détaillée →
              </a>
            </div>
          )}
        </>
      ) : (
        <MapExplorer
          initialClaims={claims}
          initialMarkers={warps ?? []}
          generatedAt={generatedAt}
          providerUrl={providerUrl}
          tileBase={tileBase}
        />
      )}
    </main>
  );
}
