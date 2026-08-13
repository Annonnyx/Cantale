"use client";

/* Avatars via /api/minecraft/avatar (proxy serveur) : <img> natif. */
/* eslint-disable @next/next/no-img-element */

import Link from "next/link";
import type {
  LeaderboardMetric,
  LeaderboardResult,
  LeaderboardUnit,
} from "@/server/repo/leaderboards";
import type { LeaderboardPeriod } from "@/server/repo/snapshots";
import { PlayerLink } from "@/components/player/player-link";
import { minecraftAvatarUrl } from "@/lib/minecraft-skin";

const METRIC_TABS: { key: LeaderboardMetric; label: string; unit: LeaderboardUnit }[] = [
  { key: "cantox", label: "Cantox", unit: "cantox" },
  { key: "playtime", label: "Temps de jeu", unit: "seconds" },
  { key: "kills", label: "Kills", unit: "count" },
  { key: "deaths", label: "Morts", unit: "count" },
  { key: "kill_streak", label: "Meilleure série", unit: "count" },
  { key: "chat_reactions", label: "Réactions", unit: "count" },
  { key: "votes", label: "Votes", unit: "count" },
  { key: "lives", label: "Vies", unit: "count" },
];

const PERIOD_TABS: { key: LeaderboardPeriod; label: string }[] = [
  { key: "total", label: "Général" },
  { key: "jour", label: "Aujourd'hui" },
  { key: "semaine", label: "Cette semaine" },
  { key: "mois", label: "Ce mois-ci" },
];

const NUMBER_FORMATTER = new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 0 });

function formatNumber(value: number): string {
  return NUMBER_FORMATTER.format(value);
}

function formatPlaytime(seconds: number): string {
  if (seconds <= 0) return "0 min";
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  if (hours === 0) return `${minutes} min`;
  return `${formatNumber(hours)} h ${minutes} min`;
}

function formatValue(value: number, unit: LeaderboardUnit): string {
  return unit === "seconds" ? formatPlaytime(value) : formatNumber(value);
}

function avatarUrl(uuid: string): string {
  return minecraftAvatarUrl(uuid, 64);
}

/** Variation textuelle vs période précédente — ▲ / ▼, jamais d'emoji. */
function Evolution({ value, unit }: { value: number | null; unit: LeaderboardUnit }) {
  if (value === null || value === 0) {
    return <span className="text-steel">—</span>;
  }
  const up = value > 0;
  return (
    <span className={up ? "text-ember-glow" : "text-steel"}>
      {up ? "▲ +" : "▼ −"}
      {formatValue(Math.abs(value), unit)}
    </span>
  );
}

function buildHref(metric: LeaderboardMetric, period: LeaderboardPeriod): string {
  return `/classements?metric=${metric}&periode=${period}`;
}

type Props = {
  metric: LeaderboardMetric;
  period: LeaderboardPeriod;
  result: LeaderboardResult;
  viewerUuid: string | null;
};

export function ClassementsClient({ metric, period, result, viewerUuid }: Props) {
  const unit = METRIC_TABS.find((tab) => tab.key === metric)?.unit ?? "count";
  const metricLabel = METRIC_TABS.find((tab) => tab.key === metric)?.label ?? metric;
  const { entries, viewer, fallback } = result;

  const podium = entries.slice(0, 3);
  const rest = entries.slice(3);
  const viewerInEntries = viewerUuid !== null && entries.some((entry) => entry.uuid === viewerUuid);

  return (
    <div className="flex flex-col gap-10">
      <div className="flex flex-col gap-6 border border-iron-line bg-iron p-5 sm:p-6">
        <fieldset className="flex flex-col gap-2">
          <legend className="mb-2 font-tech text-[10px] uppercase tracking-[0.24em] text-steel">
            Métrique
          </legend>
          <div className="flex flex-wrap gap-2">
            {METRIC_TABS.map((tab) => (
              <Link
                key={tab.key}
                href={buildHref(tab.key, period)}
                scroll={false}
                aria-current={metric === tab.key ? "true" : undefined}
                className={`chip border px-3 py-1.5 font-tech text-[10px] uppercase tracking-[0.2em] ${
                  metric === tab.key
                    ? "border-ember text-ember-glow"
                    : "border-iron-line text-steel hover:border-steel hover:text-bone"
                }`}
              >
                {tab.label}
              </Link>
            ))}
          </div>
        </fieldset>

        <fieldset className="flex flex-col gap-2 border-t border-iron-line/60 pt-5">
          <legend className="mb-2 font-tech text-[10px] uppercase tracking-[0.24em] text-steel">
            Période
          </legend>
          <div className="flex flex-wrap gap-2">
            {PERIOD_TABS.map((tab) => (
              <Link
                key={tab.key}
                href={buildHref(metric, tab.key)}
                scroll={false}
                aria-current={period === tab.key ? "true" : undefined}
                className={`chip border px-3 py-1.5 font-tech text-[10px] uppercase tracking-[0.2em] ${
                  period === tab.key
                    ? "border-ember text-ember-glow"
                    : "border-iron-line text-steel hover:border-steel hover:text-bone"
                }`}
              >
                {tab.label}
              </Link>
            ))}
          </div>
        </fieldset>
      </div>

      {fallback && period !== "total" && (
        <p className="border border-iron-line bg-iron px-5 py-3.5 text-sm leading-relaxed text-steel">
          L&apos;historique de cette période n&apos;est pas encore alimenté — le relevé
          quotidien du registre vient seulement de commencer. Le classement général est
          affiché à la place.
        </p>
      )}

      {viewerUuid === null ? (
        <p className="font-tech text-[10px] uppercase tracking-[0.24em] text-steel">
          <Link
            href="/connexion"
            className="text-steel-light underline decoration-iron-line underline-offset-4 transition-colors hover:text-bone"
          >
            Connecte-toi
          </Link>{" "}
          et lie ton compte Minecraft pour suivre ta position.
        </p>
      ) : viewer !== null && !viewerInEntries ? (
        <aside className="flex flex-wrap items-center gap-5 border border-ember bg-iron p-5">
          <img
            src={avatarUrl(viewerUuid)}
            alt=""
            width={48}
            height={48}
            loading="lazy"
            className="h-12 w-12 border border-iron-line bg-ash-deep"
          />
          <div className="flex flex-col gap-1">
            <span className="font-tech text-[10px] uppercase tracking-[0.24em] text-ember-glow">
              Ta position
            </span>
            <span className="font-display text-lg font-semibold text-bone">
              #{viewer.rank} — {formatValue(viewer.value, unit)}
              <span className="ml-2 text-sm font-normal text-steel">{metricLabel}</span>
            </span>
          </div>
          <span className="ml-auto font-tech text-xs">
            <Evolution value={viewer.evolution} unit={unit} />
          </span>
        </aside>
      ) : viewer === null ? (
        <p className="border border-iron-line bg-iron px-5 py-3.5 text-sm leading-relaxed text-steel">
          Ton nom n&apos;est pas encore inscrit dans le registre — rejoins le serveur pour
          ouvrir ta page.
        </p>
      ) : null}

      {entries.length === 0 ? (
        <div className="border border-iron-line bg-iron p-8">
          <p className="font-display text-xl font-semibold text-bone">
            Aucun nom n&apos;est classé pour l&apos;instant.
          </p>
          <p className="mt-2 text-sm leading-relaxed text-steel">
            Le registre n&apos;a encore rien mesuré sur cette métrique — les premiers chiffres
            arrivent avec les premiers combats.
          </p>
        </div>
      ) : (
        <>
          <ol className="grid items-end gap-4 sm:grid-cols-3" aria-label="Podium">
            {podium.map((entry, index) => (
              <PodiumCard
                key={entry.uuid}
                entry={entry}
                place={(index + 1) as 1 | 2 | 3}
                unit={unit}
              />
            ))}
          </ol>

          {rest.length > 0 && (
            <div className="border border-iron-line bg-iron">
              <div
                aria-hidden
                className="hidden grid-cols-[4rem_1fr_10rem_9rem] gap-4 border-b border-iron-line px-5 py-3 font-tech text-[9px] uppercase tracking-[0.22em] text-steel lg:grid"
              >
                <span>Rang</span>
                <span>Joueur</span>
                <span className="text-right">{metricLabel}</span>
                <span className="text-right">Évolution</span>
              </div>
              <ol start={4}>
                {rest.map((entry) => {
                  const isViewer = entry.uuid === viewerUuid;
                  return (
                    <li
                      key={entry.uuid}
                      className={`border-b border-iron-line/60 last:border-b-0 ${
                        isViewer ? "border-l-2 border-l-ember bg-ember/5" : ""
                      }`}
                    >
                      <div className="grid grid-cols-[2.5rem_1fr_auto] items-center gap-4 px-5 py-3.5 lg:grid-cols-[4rem_1fr_10rem_9rem]">
                        <span className="font-tech text-xs text-steel">
                          {String(entry.rank).padStart(2, "0")}
                        </span>
                        <span className="flex min-w-0 items-center gap-3">
                          <img
                            src={avatarUrl(entry.uuid)}
                            alt=""
                            width={32}
                            height={32}
                            loading="lazy"
                            decoding="async"
                            className="h-8 w-8 shrink-0 border border-iron-line bg-ash-deep"
                          />
                          <PlayerLink
                            uuid={entry.uuid}
                            className="truncate font-display text-base font-semibold text-bone hover:text-ember-glow"
                          >
                            {entry.username}
                          </PlayerLink>
                          {isViewer && (
                            <span className="border border-ember px-1.5 py-0.5 font-tech text-[9px] uppercase tracking-[0.2em] text-ember-glow">
                              Toi
                            </span>
                          )}
                        </span>
                        <span className="text-right font-tech text-xs text-bone">
                          {formatValue(entry.value, unit)}
                        </span>
                        <span className="hidden text-right font-tech text-xs lg:block">
                          <Evolution value={entry.evolution} unit={unit} />
                        </span>
                      </div>
                    </li>
                  );
                })}
              </ol>
            </div>
          )}

          {period !== "total" && !fallback && (
            <p className="font-tech text-[10px] uppercase tracking-[0.24em] text-steel">
              Progression mesurée à partir des relevés quotidiens du registre.
            </p>
          )}
        </>
      )}
    </div>
  );
}

function PodiumCard({
  entry,
  place,
  unit,
}: {
  entry: LeaderboardResult["entries"][number];
  place: 1 | 2 | 3;
  unit: LeaderboardUnit;
}) {
  const styles = {
    1: {
      border: "border-gold",
      rank: "text-gold",
      avatar: "h-20 w-20",
      order: "sm:order-2",
      lift: "sm:-translate-y-4",
      label: "Premier",
    },
    2: {
      border: "border-ember",
      rank: "text-ember-glow",
      avatar: "h-16 w-16",
      order: "sm:order-1",
      lift: "",
      label: "Deuxième",
    },
    3: {
      border: "border-steel",
      rank: "text-steel",
      avatar: "h-16 w-16",
      order: "sm:order-3",
      lift: "",
      label: "Troisième",
    },
  }[place];

  return (
    <li
      className={`card-soft flex flex-col items-center gap-3 border bg-iron p-6 text-center ${styles.border} ${styles.order} ${styles.lift}`}
    >
      <span className={`font-display text-3xl font-semibold leading-none ${styles.rank}`}>
        {place}
      </span>
      <span className="sr-only">{styles.label}</span>
      <img
        src={avatarUrl(entry.uuid)}
        alt={`Avatar de ${entry.username}`}
        width={80}
        height={80}
        loading="lazy"
        className={`${styles.avatar} border border-iron-line bg-ash-deep`}
      />
      <PlayerLink
        uuid={entry.uuid}
        className="max-w-full truncate font-display text-lg font-semibold text-bone hover:text-ember-glow"
      >
        {entry.username}
      </PlayerLink>
      <span className="font-tech text-sm text-bone">{formatValue(entry.value, unit)}</span>
      <span className="font-tech text-xs">
        <Evolution value={entry.evolution} unit={unit} />
      </span>
    </li>
  );
}
