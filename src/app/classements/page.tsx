import type { Metadata } from "next";
import { getSessionIdentity } from "@/server/session";
import {
  getLeaderboard,
  isLeaderboardMetric,
  LEADERBOARD_DEFAULT_LIMIT,
  type LeaderboardResult,
} from "@/server/repo/leaderboards";
import { isLeaderboardPeriod } from "@/server/repo/snapshots";
import { ClassementsClient } from "./classements-client";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Classements",
  description:
    "Les classements officiels de CANTALE — Cantox, kills, séries, temps de jeu, votes. Depuis toujours, ou sur le jour, la semaine, le mois.",
};

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

function first(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

/**
 * Classements publics, pilotés par l'URL (?metric=kills&periode=semaine) pour
 * rester partageables. Les données sont lues côté serveur via le repo — pas de
 * fetch interne. La base peut être injoignable : la page dégrade sans casser.
 */
export default async function ClassementsPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const metricParam = first(params.metric);
  const periodParam = first(params.periode);
  const metric = isLeaderboardMetric(metricParam) ? metricParam : "cantox";
  const period = isLeaderboardPeriod(periodParam) ? periodParam : "total";

  // Session (pour « ta position ») — facultative : une panne Discord ne bloque pas la page.
  let viewerUuid: string | null = null;
  try {
    const identity = await getSessionIdentity();
    viewerUuid = identity.mc?.uuid ?? null;
  } catch {
    viewerUuid = null;
  }

  let result: LeaderboardResult | null = null;
  try {
    result = await getLeaderboard({
      metric,
      period,
      limit: LEADERBOARD_DEFAULT_LIMIT,
      viewerUuid,
    });
  } catch {
    result = null;
  }

  return (
    <main className="mx-auto w-full max-w-7xl px-5 pb-24 pt-28 sm:px-8 sm:pt-32">
      <header className="flex flex-col gap-4 pb-14">
        <span className="font-tech text-[10px] uppercase tracking-[0.3em] text-ember-glow">
          Le registre des vivants
        </span>
        <h1 className="font-display text-4xl font-semibold leading-[1.05] text-bone sm:text-5xl">
          Classements
        </h1>
        <p className="max-w-2xl text-base leading-relaxed text-steel">
          Cantox amassés, kills signés, heures brûlées : le registre ordonne les faits,
          rien de plus. Choisis une métrique, une période — et mesure-toi aux noms
          qui tiennent le haut du tableau.
        </p>
      </header>

      {result ? (
        <ClassementsClient
          metric={metric}
          period={period}
          result={result}
          viewerUuid={viewerUuid}
        />
      ) : (
        <div className="flex flex-col items-start gap-4 border border-iron-line bg-iron p-8 sm:p-10">
          <p className="font-display text-xl font-semibold text-bone">
            Les archives ne répondent pas.
          </p>
          <p className="max-w-xl text-sm leading-relaxed text-steel">
            Le registre est momentanément illisible — maintenance ou archive fermée.
            Reviens dans quelques minutes : les classements reprennent dès que la
            base répond à nouveau.
          </p>
        </div>
      )}
    </main>
  );
}
