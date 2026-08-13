import type { Metadata } from "next";
import Link from "next/link";
import { getSessionIdentity } from "@/server/session";
import { getLastVotesBySite, getVoteStats, type VoteStats } from "@/server/repo/votes";
import { VOTE_SITES, matchVoteSite, nowUnixSeconds } from "./vote-sites";
import { VoteSiteCard } from "./vote-site-card";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Vote",
  description:
    "Vote pour CANTALE sur les sites partenaires et récolte des Cadeaux du Roi — minuteurs personnalisés, streak et paliers de récompenses.",
};

/** Mois courant au format YYYYMM en UTC — même convention que le plugin. */
function currentMonthKey(): number {
  const now = new Date();
  return now.getUTCFullYear() * 100 + (now.getUTCMonth() + 1);
}

const NUMBER_FORMATTER = new Intl.NumberFormat("fr-FR");

function Kicker({ children }: { children: React.ReactNode }) {
  return (
    <span className="font-tech text-[10px] uppercase tracking-[0.3em] text-ember-glow">
      {children}
    </span>
  );
}

/* ——— Statistiques personnelles (compte lié uniquement) ——— */
function PersonalStats({ stats, username }: { stats: VoteStats; username: string }) {
  const monthlyVotes = stats.lastMonth === currentMonthKey() ? stats.monthlyVotes : 0;
  const entries = [
    { label: "Votes au total", value: NUMBER_FORMATTER.format(stats.totalVotes) },
    {
      label: "Série en cours",
      value: `${NUMBER_FORMATTER.format(stats.streakDays)} jour${stats.streakDays > 1 ? "s" : ""}`,
    },
    { label: "Votes ce mois-ci", value: NUMBER_FORMATTER.format(monthlyVotes) },
  ];

  return (
    <section
      aria-labelledby="vote-stats"
      className="border border-iron-line bg-iron p-6 sm:p-8"
    >
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <h2 id="vote-stats" className="font-display text-2xl font-semibold text-bone">
          Ton registre de vote
        </h2>
        <span className="font-tech text-[10px] uppercase tracking-[0.24em] text-steel">
          {username}
        </span>
      </div>
      <dl className="mt-6 grid grid-cols-1 gap-px border border-iron-line bg-iron-line sm:grid-cols-3">
        {entries.map((entry) => (
          <div key={entry.label} className="flex flex-col gap-1 bg-iron px-4 py-4">
            <dt className="font-tech text-[10px] uppercase tracking-[0.22em] text-steel">
              {entry.label}
            </dt>
            <dd className="font-display text-xl font-semibold text-bone">{entry.value}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

/* ——— Récompenses globales : fidèle à la config du plugin ——— */
function GlobalRewards() {
  return (
    <section
      aria-labelledby="vote-recompenses"
      className="border-t border-iron-line/60 pt-14"
    >
      <Kicker>Au-delà du vote</Kicker>
      <h2
        id="vote-recompenses"
        className="mt-3 font-display text-3xl font-semibold text-bone"
      >
        Récompenses du registre
      </h2>
      <div className="mt-8 grid gap-4 lg:grid-cols-3">
        <div className="flex flex-col gap-3 border border-iron-line bg-iron p-6">
          <span className="font-tech text-[10px] uppercase tracking-[0.24em] text-ember-glow">
            Vote Party
          </span>
          <p className="text-sm leading-relaxed text-steel">
            Quand le serveur atteint{" "}
            <span className="text-bone">50 votes dans la journée</span>, un joueur en
            ligne est tiré au sort et reçoit{" "}
            <span className="text-gold">1× Cadeau du Roi</span>. Chaque vote rapproche
            tout le monde du compteur.
          </p>
        </div>
        <div className="flex flex-col gap-3 border border-iron-line bg-iron p-6">
          <span className="font-tech text-[10px] uppercase tracking-[0.24em] text-ember-glow">
            Paliers individuels
          </span>
          <p className="text-sm leading-relaxed text-steel">
            Des bonus à vie, obtenus une seule fois :{" "}
            <span className="text-bone">10 votes</span> →{" "}
            <span className="text-gold">2× Cadeaux du Roi</span>,{" "}
            <span className="text-bone">50 votes</span> →{" "}
            <span className="text-gold">1× Trésor Public</span>,{" "}
            <span className="text-bone">100 votes</span> →{" "}
            <span className="text-gold">1× Médaille Épique</span>.
          </p>
        </div>
        <div className="flex flex-col gap-3 border border-iron-line bg-iron p-6">
          <span className="font-tech text-[10px] uppercase tracking-[0.24em] text-ember-glow">
            Classement mensuel
          </span>
          <p className="text-sm leading-relaxed text-steel">
            Le compteur repart à zéro chaque 1er du mois. Les trois premiers reçoivent :{" "}
            <span className="text-gold">1× Ticket Légendaire</span> (1er),{" "}
            <span className="text-gold">1× Pièce Mythique</span> (2e),{" "}
            <span className="text-gold">1× Médaille Épique</span> (3e).
          </p>
        </div>
      </div>
    </section>
  );
}

export default async function VotePage() {
  const identity = await getSessionIdentity();
  const mc = identity.mc;
  const linked = mc !== null;

  /* Base injoignable : on retombe sur des cartes simples, sans erreur. */
  let lastVoteBySiteId: Map<string, number> | null = null;
  let stats: VoteStats | null = null;
  if (mc !== null) {
    try {
      const [lastVotes, voteStats] = await Promise.all([
        getLastVotesBySite(mc.uuid),
        getVoteStats(mc.uuid),
      ]);
      const map = new Map<string, number>();
      for (const vote of lastVotes) {
        const site = matchVoteSite(vote.site);
        if (!site) continue;
        const known = map.get(site.id);
        if (known === undefined || vote.votedAt > known) map.set(site.id, vote.votedAt);
      }
      lastVoteBySiteId = map;
      stats = voteStats;
    } catch {
      lastVoteBySiteId = null;
      stats = null;
    }
  }

  const personalized = linked && lastVoteBySiteId !== null;
  const serverNow = nowUnixSeconds();

  return (
    <main className="mx-auto w-full max-w-7xl px-5 pb-24 pt-28 sm:px-8 sm:pt-32">
      <header className="flex flex-col gap-4 pb-14">
        <Kicker>Registre — Soutien</Kicker>
        <h1 className="font-display text-4xl font-semibold leading-[1.05] text-bone sm:text-5xl">
          Vote
        </h1>
        <p className="max-w-2xl text-base leading-relaxed text-steel">
          Trois sites, trois liens, et des Cadeaux du Roi à chaque passage. Voter fait
          vivre le serveur — le registre compte chaque voix, et la tienne pèse double
          quand la série s&apos;installe.
        </p>
      </header>

      <div className="flex flex-col gap-14">
        {mc !== null && stats && (
          <PersonalStats stats={stats} username={mc.username ?? stats.playerName} />
        )}

        <section aria-labelledby="vote-sites">
          <h2 id="vote-sites" className="sr-only">
            Sites de vote
          </h2>
          <div className="reveal reveal-stagger grid gap-4 md:grid-cols-3">
            {VOTE_SITES.map((site) => (
              <VoteSiteCard
                key={site.id}
                displayName={site.displayName}
                url={site.url}
                cooldownHours={site.cooldownHours}
                crates={site.crates}
                lastVoteAt={lastVoteBySiteId?.get(site.id) ?? null}
                personalized={personalized}
                serverNow={serverNow}
              />
            ))}
          </div>
          {!linked && (
            <p className="mt-6 border border-iron-line bg-iron px-5 py-4 text-sm leading-relaxed text-steel">
              <Link
                href="/connexion"
                className="text-steel-light underline decoration-iron-line underline-offset-4 transition-colors hover:text-bone"
              >
                Connecte-toi avec Discord
              </Link>{" "}
              et lie ton compte Minecraft pour suivre tes minuteurs de vote, ta série et
              tes statistiques directement ici.
            </p>
          )}
        </section>

        <GlobalRewards />
      </div>
    </main>
  );
}
