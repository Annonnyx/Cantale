import type { Metadata } from "next";
import type { ReactNode } from "react";
import { getServerStatus } from "@/server/repo/server-status";
import { getTotalVotes } from "@/server/repo/votes";
import { getActiveBounties } from "@/server/repo/wanted";
import { getTopPlayers, type Player } from "@/server/repo/players";
import {
  getDeathsRecord,
  getGlobalCounters,
  getKillStreakRecord,
  getLivesDistribution,
  type LivesDistribution,
} from "@/server/repo/leaderboards";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Statistiques",
  description:
    "Les chiffres officiels de CANTALE en temps réel — joueurs en ligne, Cantox en circulation, vies restantes, votes, primes et records du registre.",
};

/** Chaque lecture est isolée : une base injoignable éteint un widget, pas la page. */
async function safe<T>(read: () => Promise<T>): Promise<T | null> {
  try {
    return await read();
  } catch {
    return null;
  }
}

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

function Section({
  kicker,
  title,
  children,
}: {
  kicker: string;
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="border-t border-iron-line/60 py-14 first:border-t-0 first:pt-0">
      <span className="font-tech text-[10px] uppercase tracking-[0.3em] text-ember-glow">
        {kicker}
      </span>
      <h2 className="mt-3 font-display text-3xl font-semibold text-bone">{title}</h2>
      <div className="mt-8">{children}</div>
    </section>
  );
}

function Unavailable({ note = "Archive muette" }: { note?: string }) {
  return (
    <>
      <span className="font-tech text-2xl text-steel">—</span>
      <span className="font-tech text-[10px] uppercase tracking-[0.22em] text-steel">{note}</span>
    </>
  );
}

export default async function StatsPage() {
  const [status, counters, totalVotes, bounties, topPlaytime, topCantox, livesDist, streakRecord, deathsRecord] =
    await Promise.all([
      safe(() => getServerStatus()),
      safe(() => getGlobalCounters()),
      safe(() => getTotalVotes()),
      safe(() => getActiveBounties()),
      safe(() => getTopPlayers("playtime", 10)),
      safe(() => getTopPlayers("balance", 10)),
      safe(() => getLivesDistribution()),
      safe(() => getKillStreakRecord()),
      safe(() => getDeathsRecord()),
    ]);

  const bountyTotal = bounties?.reduce((sum, bounty) => sum + bounty.reward, 0) ?? 0;

  const liveCounters: {
    label: string;
    available: boolean;
    value: string | null;
    /** Complément affiché dans la valeur (ex. « / 100 ») ou en dessous (ex. Cantox promis). */
    suffix: string | null;
    suffixInline: boolean;
  }[] = [
    {
      label: "Joueurs en ligne",
      available: status !== null,
      value: status !== null ? String(status.online) : null,
      suffix: status?.max ? `/ ${status.max}` : null,
      suffixInline: true,
    },
    {
      label: "Cantox en circulation",
      available: counters !== null,
      value: counters ? formatNumber(counters.cantoxInCirculation) : null,
      suffix: null,
      suffixInline: false,
    },
    {
      label: "Vies en circulation",
      available: counters !== null,
      value: counters ? formatNumber(counters.livesInCirculation) : null,
      suffix: null,
      suffixInline: false,
    },
    {
      label: "Votes enregistrés",
      available: totalVotes !== null,
      value: totalVotes !== null ? formatNumber(totalVotes) : null,
      suffix: null,
      suffixInline: false,
    },
    {
      label: "Primes actives",
      available: bounties !== null,
      value: bounties ? formatNumber(bounties.length) : null,
      suffix: bounties && bounties.length > 0 ? `${formatNumber(bountyTotal)} Cantox promis` : null,
      suffixInline: false,
    },
  ];

  return (
    <main className="mx-auto w-full max-w-7xl px-5 pb-24 pt-28 sm:px-8 sm:pt-32">
      <header className="flex flex-col gap-4 pb-14">
        <span className="font-tech text-[10px] uppercase tracking-[0.3em] text-ember-glow">
          Observatoire
        </span>
        <h1 className="font-display text-4xl font-semibold leading-[1.05] text-bone sm:text-5xl">
          Statistiques
        </h1>
        <p className="max-w-2xl text-base leading-relaxed text-steel">
          Le pouls du serveur, relevé à l&apos;instant où tu lis ces lignes : la richesse
          en circulation, les vies encore debout, les heures accumulées. Le registre
          ne triche pas — il compte.
        </p>
      </header>

      <Section kicker="01 — Temps réel" title="Le pouls du serveur">
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
          {liveCounters.map((counter) => (
            <div
              key={counter.label}
              className="card-soft flex flex-col gap-2 border border-iron-line bg-iron p-5"
            >
              <span className="flex items-center gap-2 font-tech text-[10px] uppercase tracking-[0.22em] text-steel">
                {counter.available && (
                  <span
                    aria-hidden
                    className="live-dot inline-block h-2 w-2 rounded-full bg-ember"
                  />
                )}
                {counter.label}
              </span>
              {counter.available && counter.value !== null ? (
                <>
                  <span className="font-tech text-2xl text-bone">
                    {counter.value}
                    {counter.suffix && counter.suffixInline && (
                      <span className="text-sm text-steel"> {counter.suffix}</span>
                    )}
                  </span>
                  {counter.suffix && !counter.suffixInline && (
                    <span className="font-tech text-[10px] uppercase tracking-[0.22em] text-steel">
                      {counter.suffix}
                    </span>
                  )}
                </>
              ) : (
                <Unavailable />
              )}
            </div>
          ))}
        </div>
      </Section>

      <Section kicker="02 — Graphiques" title="Les chiffres du registre">
        <div className="grid gap-4 lg:grid-cols-2">
          <TopTenChart
            title="Temps de jeu"
            rows={topPlaytime}
            read={(player) => player.playtime}
            format={formatPlaytime}
          />
          <TopTenChart
            title="Cantox"
            rows={topCantox}
            read={(player) => player.balance}
            format={formatNumber}
          />
          <LivesChart distribution={livesDist} />
        </div>
      </Section>

      <Section kicker="03 — Records" title="Les limites du registre">
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="flex flex-col gap-2 border border-gold bg-iron p-6">
            <span className="font-tech text-[10px] uppercase tracking-[0.24em] text-gold">
              Meilleure série de kills
            </span>
            {streakRecord ? (
              <>
                <span className="font-tech text-3xl text-bone">{formatNumber(streakRecord.value)}</span>
                <span className="text-sm text-steel">par {streakRecord.username}</span>
              </>
            ) : (
              <Unavailable />
            )}
          </div>
          <div className="flex flex-col gap-2 border border-iron-line bg-iron p-6">
            <span className="font-tech text-[10px] uppercase tracking-[0.24em] text-steel">
              Plus grand nombre de morts
            </span>
            {deathsRecord ? (
              <>
                <span className="font-tech text-3xl text-bone">{formatNumber(deathsRecord.value)}</span>
                <span className="text-sm text-steel">par {deathsRecord.username}</span>
              </>
            ) : (
              <Unavailable />
            )}
          </div>
          <div className="flex flex-col gap-2 border border-iron-line bg-iron p-6">
            <span className="font-tech text-[10px] uppercase tracking-[0.24em] text-steel">
              Morts totales
            </span>
            {counters ? (
              <>
                <span className="font-tech text-3xl text-bone">{formatNumber(counters.totalDeaths)}</span>
                <span className="text-sm text-steel">tous joueurs confondus</span>
              </>
            ) : (
              <Unavailable />
            )}
          </div>
        </div>
      </Section>
    </main>
  );
}

/** Barres horizontales en CSS pur — largeur proportionnelle au leader, top 1 en or. */
function TopTenChart({
  title,
  rows,
  read,
  format,
}: {
  title: string;
  rows: Player[] | null;
  read: (player: Player) => number;
  format: (value: number) => string;
}) {
  const max = rows && rows.length > 0 ? Math.max(...rows.map(read)) : 0;
  return (
    <div className="flex flex-col gap-5 border border-iron-line bg-iron p-6">
      <span className="font-tech text-[10px] uppercase tracking-[0.24em] text-steel">
        Top 10 — {title}
      </span>
      {rows === null ? (
        <Unavailable note="Données indisponibles" />
      ) : rows.length === 0 || max <= 0 ? (
        <span className="text-sm text-steel">Aucune donnée mesurée pour l&apos;instant.</span>
      ) : (
        <ol className="flex flex-col gap-2.5">
          {rows.map((player, index) => {
            const value = read(player);
            const width = value > 0 ? Math.max(3, (value / max) * 100) : 0;
            return (
              <li
                key={player.uuid}
                className="grid grid-cols-[2rem_minmax(0,8rem)_1fr_auto] items-center gap-3"
              >
                <span className="font-tech text-[10px] text-steel">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <span className="truncate text-sm text-bone">{player.username}</span>
                <div aria-hidden className="h-3.5 w-full border border-iron-line/60 bg-ash-deep">
                  <div
                    className={`h-full ${index === 0 ? "bg-gold" : "bg-ember"}`}
                    style={{ width: `${width}%` }}
                  />
                </div>
                <span className="text-right font-tech text-xs text-bone">{format(value)}</span>
              </li>
            );
          })}
        </ol>
      )}
    </div>
  );
}

/** Répartition des vies restantes — colonnes verticales, hauteur proportionnelle. */
function LivesChart({ distribution }: { distribution: LivesDistribution | null }) {
  const columns = distribution
    ? ([
        { label: "3 vies", sublabel: "En vie", count: distribution.three, color: "bg-ember" },
        { label: "2 vies", sublabel: "Entamé", count: distribution.two, color: "bg-ember/70" },
        { label: "1 vie", sublabel: "Marqué", count: distribution.one, color: "bg-ember/40" },
        { label: "0 vie", sublabel: "Banni", count: distribution.zero, color: "bg-steel" },
      ] as const)
    : null;
  const max = columns ? Math.max(...columns.map((column) => column.count)) : 0;

  return (
    <div className="flex flex-col gap-5 border border-iron-line bg-iron p-6 lg:col-span-2">
      <span className="font-tech text-[10px] uppercase tracking-[0.24em] text-steel">
        Répartition des vies restantes
      </span>
      {columns === null ? (
        <Unavailable note="Données indisponibles" />
      ) : (
        <div className="mx-auto flex h-48 w-full max-w-2xl items-stretch gap-4 sm:gap-8">
          {columns.map((column) => {
            const height = max > 0 && column.count > 0 ? Math.max(3, (column.count / max) * 100) : 0;
            return (
              <div key={column.label} className="flex min-w-0 flex-1 flex-col items-center gap-2">
                <span className="font-tech text-xs text-bone">{formatNumber(column.count)}</span>
                <div
                  aria-hidden
                  className="flex w-full flex-1 items-end border border-iron-line/60 bg-ash-deep"
                >
                  <div className={`w-full ${column.color}`} style={{ height: `${height}%` }} />
                </div>
                <span className="font-tech text-[10px] uppercase tracking-[0.2em] text-steel">
                  {column.label}
                </span>
                <span className="-mt-2 text-[10px] text-steel">{column.sublabel}</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
