/* Avatars servis par mc-heads.net (tiers) : <img> natif — next/image exigerait
 * une entrée remotePatterns dans next.config, hors du périmètre de cette page. */
/* eslint-disable @next/next/no-img-element */

import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  getFactionByMemberUuid,
  getFactionBySlug,
  getFactionRoster,
  type FactionMember,
  type FactionRank,
  type FactionSummary,
} from "@/server/repo/factions";
import {
  defaultFactionSettings,
  getFactionSettings,
  getLivesByUuids,
} from "@/server/repo/faction-settings";
import { listPendingByFaction } from "@/server/repo/faction-actions";
import { getSessionUser } from "@/server/session";
import { LifeNotches } from "@/components/ui/life-notches";
import { Stamp } from "@/components/ui/stamp";
import { ApplyForm } from "./apply-form";
import { LeaderPanel } from "./leader-panel";

export const dynamic = "force-dynamic";

interface FactionPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: FactionPageProps): Promise<Metadata> {
  const { slug } = await params;
  const faction = await getFactionBySlug(slug).catch(() => null);
  if (!faction) return {};
  return {
    title: `Factions — ${faction.name}`,
    description:
      faction.description ??
      `La faction ${faction.name} [${faction.tag}] sur CANTALE : effectif, puissance, claims et Cantox.`,
  };
}

/** Grades : symbole + label texte, jamais la couleur seule. */
const RANK_DISPLAY: Record<FactionRank, { symbol: string; label: string; className: string }> = {
  LEADER: { symbol: "★", label: "Leader", className: "text-gold" },
  OFFICER: { symbol: "◆", label: "Officier", className: "text-ember-glow" },
  VETERAN: { symbol: "◆", label: "Vétéran", className: "text-ember-glow/70" },
  MEMBER: { symbol: "●", label: "Membre", className: "text-bone" },
  RECRUIT: { symbol: "○", label: "Recrue", className: "text-steel" },
};

const DATE_FORMATTER = new Intl.DateTimeFormat("fr-FR", {
  day: "numeric",
  month: "long",
  year: "numeric",
  timeZone: "Europe/Paris",
});

const NUMBER_FORMATTER = new Intl.NumberFormat("fr-FR");

function formatDate(unixSeconds: number): string {
  if (unixSeconds <= 0) return "—";
  return DATE_FORMATTER.format(new Date(unixSeconds * 1000));
}

function avatarUrl(uuid: string): string {
  return `https://mc-heads.net/avatar/${uuid}/64`;
}

function clampLives(lives: number): 0 | 1 | 2 | 3 {
  return Math.max(0, Math.min(3, Math.floor(lives))) as 0 | 1 | 2 | 3;
}

function StatCell({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-1 bg-iron px-4 py-3.5">
      <dt className="font-tech text-[10px] uppercase tracking-[0.22em] text-steel">{label}</dt>
      <dd className="font-display text-base font-semibold text-bone">{value}</dd>
    </div>
  );
}

function MemberRow({ member, lives }: { member: FactionMember; lives: number | undefined }) {
  const rank = RANK_DISPLAY[member.rank];
  return (
    <li className="flex items-center gap-4 border border-iron-line bg-iron px-4 py-3.5">
      <img
        src={avatarUrl(member.uuid)}
        alt={member.username ? `Avatar de ${member.username}` : "Avatar inconnu"}
        width={40}
        height={40}
        loading="lazy"
        className="h-10 w-10 shrink-0 border border-iron-line bg-ash-deep"
      />
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className="truncate font-display text-base font-semibold text-bone">
          {member.username ?? "Joueur inconnu"}
        </span>
        <span className={`font-tech text-[10px] uppercase tracking-[0.22em] ${rank.className}`}>
          <span aria-hidden="true">{rank.symbol} </span>
          {rank.label}
          <span className="sr-only">(grade : {rank.label})</span>
        </span>
      </div>
      <span className="hidden font-tech text-[10px] uppercase tracking-[0.18em] text-steel sm:block">
        Depuis le {formatDate(member.joinedAt)}
      </span>
      {lives === undefined ? (
        <span className="font-tech text-[10px] uppercase tracking-[0.18em] text-steel/60">—</span>
      ) : (
        <LifeNotches lives={clampLives(lives)} size="sm" />
      )}
    </li>
  );
}

export default async function FactionPage({ params }: FactionPageProps) {
  const { slug } = await params;

  // Base injoignable → page gracieuse (jamais de 404 ambigu); faction absente
  // ou secrète → 404 propre, sans rien révéler.
  let faction: FactionSummary | null = null;
  let available = true;
  try {
    faction = await getFactionBySlug(slug);
  } catch {
    available = false;
  }

  if (!available) {
    return (
      <main className="mx-auto w-full max-w-7xl px-5 pb-24 pt-28 sm:px-8 sm:pt-32">
        <div className="flex flex-col items-start gap-4 border border-iron-line bg-iron p-8 sm:p-10">
          <p className="font-display text-xl font-semibold text-bone">
            Les archives ne répondent pas.
          </p>
          <p className="max-w-xl text-sm leading-relaxed text-steel">
            Le registre des factions est injoignable pour l&apos;instant. Recharge la
            page dans un instant — rien n&apos;est perdu, seulement indisponible.
          </p>
        </div>
      </main>
    );
  }

  if (!faction) notFound();

  const [roster, settings, session] = await Promise.all([
    getFactionRoster(faction.id).catch(() => [] as FactionMember[]),
    getFactionSettings(faction.id).catch(() => defaultFactionSettings(faction.id)),
    getSessionUser().catch(() => null),
  ]);

  const livesMap = await getLivesByUuids(roster.map((member) => member.uuid)).catch(
    () => ({}) as Record<string, number>,
  );

  // Vérification DB fraîche de l'appartenance (le rôle Discord seul ne suffit pas).
  // "error" → on masque le bouton par prudence.
  const membership = session?.mc
    ? ((await getFactionByMemberUuid(session.mc.uuid).catch(() => "error" as const)) ??
      null)
    : null;

  const canApply = Boolean(
    session?.mc &&
      !session.capabilities.hasFaction &&
      membership === null &&
      settings.recruitmentOpen,
  );

  // La vraie propriété en DB : l'uuid du leader, pas un rôle Discord.
  const isLeader = session?.mc?.uuid === faction.leaderUuid;

  const applications = isLeader
    ? await listPendingByFaction(faction.id).catch(() => [])
    : [];

  const description =
    settings.customDescription?.trim() ||
    faction.description?.trim() ||
    "Cette faction n'a pas encore dicté sa parole au registre.";

  const slugParam = encodeURIComponent(faction.name.toLowerCase().replace(/\s+/g, "-"));

  return (
    <main className="mx-auto w-full max-w-7xl px-5 pb-24 pt-28 sm:px-8 sm:pt-32">
      <nav aria-label="Fil d'Ariane" className="pb-8">
        <Link
          href="/factions"
          className="font-tech text-[10px] uppercase tracking-[0.25em] text-steel transition-colors hover:text-bone"
        >
          ← Factions
        </Link>
      </nav>

      <header className="flex flex-col gap-5 pb-12">
        <div className="flex flex-wrap items-center gap-4">
          <span className="font-tech text-[10px] uppercase tracking-[0.3em] text-ember-glow">
            Faction [{faction.tag}]
          </span>
          {settings.recruitmentOpen ? (
            <Stamp tone="ember">Recrute</Stamp>
          ) : (
            <Stamp tone="steel" rotation={2}>
              Fermée
            </Stamp>
          )}
          {faction.type !== "normal" && <Stamp tone="gold">{faction.type}</Stamp>}
        </div>
        <h1 className="font-display text-4xl font-semibold leading-[1.05] text-bone sm:text-5xl">
          {faction.name}
        </h1>
        <p className="max-w-2xl whitespace-pre-line text-base leading-relaxed text-steel">
          {description}
        </p>
      </header>

      <section aria-label="Statistiques de la faction" className="pb-14">
        <dl className="grid grid-cols-2 gap-px border border-iron-line bg-iron-line sm:grid-cols-3 lg:grid-cols-6">
          <StatCell label="Puissance" value={NUMBER_FORMATTER.format(faction.power)} />
          <StatCell label="Membres" value={String(faction.memberCount)} />
          <StatCell label="Claims" value={String(faction.claimCount)} />
          <StatCell label="Cantox" value={NUMBER_FORMATTER.format(faction.balance)} />
          <StatCell label="Créée le" value={formatDate(faction.createdAt)} />
          <StatCell label="Tag" value={faction.tag} />
        </dl>
      </section>

      {canApply && (
        <section aria-label="Postuler" className="pb-14">
          <ApplyForm slug={slugParam} factionName={faction.name} />
        </section>
      )}

      <section aria-labelledby="roster-title" className="border-t border-iron-line/60 py-14">
        <span className="font-tech text-[10px] uppercase tracking-[0.3em] text-ember-glow">
          Effectif — {roster.length} membre{roster.length > 1 ? "s" : ""}
        </span>
        <h2 id="roster-title" className="mt-3 font-display text-3xl font-semibold text-bone">
          Le roster
        </h2>
        {roster.length > 0 ? (
          <ul className="mt-8 flex flex-col gap-2">
            {roster.map((member) => (
              <MemberRow key={member.uuid} member={member} lives={livesMap[member.uuid]} />
            ))}
          </ul>
        ) : (
          <p className="mt-8 border border-iron-line bg-iron p-6 text-sm leading-relaxed text-steel">
            Aucun membre lisible pour l&apos;instant — les archives ne répondent peut-être plus.
          </p>
        )}
      </section>

      {isLeader && (
        <section aria-label="Panneau du leader" className="border-t border-iron-line/60 pt-14">
          <LeaderPanel
            slug={slugParam}
            initialRecruitmentOpen={settings.recruitmentOpen}
            initialDescription={settings.customDescription ?? faction.description ?? ""}
            initialMembers={roster
              .filter((member) => member.rank !== "LEADER")
              .map((member) => ({
                uuid: member.uuid,
                username: member.username,
                rank: member.rank,
              }))}
            initialApplications={applications.map((application) => ({
              id: application.id,
              applicantUuid: application.applicantUuid,
              username: application.applicantUsername,
              message: application.message,
              createdAt: application.createdAt,
            }))}
          />
        </section>
      )}
    </main>
  );
}
