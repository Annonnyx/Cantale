import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { SkinViewer } from "@/components/profile/skin-viewer";
import { AdminPlayerTools } from "@/components/player/admin-player-tools";
import { LifeNotches } from "@/components/ui/life-notches";
import { Stamp } from "@/components/ui/stamp";
import { getFactionByMemberUuid } from "@/server/repo/factions";
import { getPlayerByName, getPlayerByUuid, type Player } from "@/server/repo/players";
import { getOnlinePlayersFromStatus, lookupPlayer } from "@/server/repo/admin";
import { getSessionIdentity, isSiteAdminDiscordId } from "@/server/session";
import { playerProfilePath } from "@/lib/player-profile";

export const dynamic = "force-dynamic";

type Params = Promise<{ uuid: string }>;

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function formatPlaytime(seconds: number): string {
  if (seconds <= 0) return "0 min";
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  if (hours === 0) return `${minutes} min`;
  return `${new Intl.NumberFormat("fr-FR").format(hours)} h ${minutes} min`;
}

function formatCantox(value: number): string {
  return `${new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 0 }).format(value)} Cantox`;
}

function StatsGrid({ player }: { player: Player }) {
  const stats = [
    { label: "Éliminations", value: new Intl.NumberFormat("fr-FR").format(player.kills) },
    { label: "Morts", value: new Intl.NumberFormat("fr-FR").format(player.deaths) },
    { label: "Série d'éliminations", value: new Intl.NumberFormat("fr-FR").format(player.killStreak) },
    { label: "Temps de jeu", value: formatPlaytime(player.playtime) },
    { label: "Fortune", value: formatCantox(player.balance) },
    { label: "Réed chat", value: new Intl.NumberFormat("fr-FR").format(player.chatReactions) },
  ];
  return (
    <dl className="grid grid-cols-2 gap-px border border-iron-line bg-iron-line sm:grid-cols-3">
      {stats.map((stat) => (
        <div key={stat.label} className="flex flex-col gap-1 bg-iron px-4 py-4">
          <dt className="font-tech text-[10px] uppercase tracking-[0.22em] text-steel">
            {stat.label}
          </dt>
          <dd className="font-display text-xl font-semibold text-bone">{stat.value}</dd>
        </div>
      ))}
    </dl>
  );
}

async function resolvePlayer(param: string): Promise<Player | null> {
  const trimmed = param.trim();
  if (!trimmed) return null;
  if (UUID_RE.test(trimmed)) {
    return getPlayerByUuid(trimmed).catch(() => null);
  }
  return getPlayerByName(trimmed).catch(() => null);
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { uuid: raw } = await params;
  const player = await resolvePlayer(decodeURIComponent(raw)).catch(() => null);
  const name = player?.username ?? "Joueur";
  return {
    title: name,
    description: `Profil CANTALE de ${name} — statistiques, vies, faction.`,
    robots: { index: true, follow: true },
  };
}

export default async function JoueurProfilePage({ params }: { params: Params }) {
  const { uuid: raw } = await params;
  const param = decodeURIComponent(raw).trim();
  const player = await resolvePlayer(param);
  if (!player) notFound();

  if (param.toLowerCase() !== player.uuid.toLowerCase()) {
    redirect(playerProfilePath(player.uuid));
  }

  const [faction, identity, status] = await Promise.all([
    getFactionByMemberUuid(player.uuid).catch(() => null),
    getSessionIdentity().catch(() => null),
    getOnlinePlayersFromStatus().catch(() => null),
  ]);

  const admin = isSiteAdminDiscordId(identity?.discordUser?.id);
  const adminRow = admin
    ? await lookupPlayer(player.uuid).catch(() => null)
    : null;

  const online =
    status?.players.some((p) => p.uuid.toLowerCase() === player.uuid.toLowerCase()) ?? false;
  const lives = Math.max(0, Math.min(3, player.lives)) as 0 | 1 | 2 | 3;
  const factionSlug = faction
    ? faction.name.toLowerCase().replace(/\s+/g, "-")
    : null;

  return (
    <main className="mx-auto w-full max-w-5xl px-5 pb-24 pt-28 sm:px-8">
      <header className="flex flex-col gap-4">
        <span className="font-tech text-[10px] uppercase tracking-[0.3em] text-ember-glow">
          Registre — Profil joueur
        </span>
        <div className="flex flex-wrap items-end gap-3">
          <h1 className="font-display text-4xl font-semibold leading-[1.05] text-bone sm:text-5xl">
            {player.username}
          </h1>
          <span
            className={`font-tech text-[10px] uppercase tracking-[0.2em] ${
              online ? "text-ember-glow" : "text-steel"
            }`}
          >
            {online ? "En ligne" : "Hors ligne"}
          </span>
        </div>
        <div className="flex flex-wrap gap-2">
          {lives === 0 && (
            <Stamp tone="ember" rotation={-1.5}>
              La Liste
            </Stamp>
          )}
          {admin && (
            <Stamp tone="gold" rotation={1}>
              Vue Direction
            </Stamp>
          )}
        </div>
      </header>

      <div className="mt-10 grid gap-6 lg:grid-cols-[300px_1fr]">
        <div className="flex flex-col gap-4">
          <SkinViewer uuid={player.uuid} username={player.username} />
          <div className="flex flex-col gap-3 border border-iron-line bg-iron p-5">
            <span className="font-tech text-[10px] uppercase tracking-[0.24em] text-steel">
              Vies restantes
            </span>
            <LifeNotches lives={lives} />
            <span className="font-tech text-[10px] uppercase tracking-[0.22em] text-steel">
              {lives === 0 ? "Banni — La Liste" : `${lives}/3 — en vie`}
            </span>
          </div>
        </div>

        <div className="flex flex-col gap-6">
          <StatsGrid player={player} />

          {faction && factionSlug ? (
            <div className="flex flex-col gap-3 border border-iron-line bg-iron p-5">
              <span className="font-tech text-[10px] uppercase tracking-[0.24em] text-steel">
                Faction
              </span>
              <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                <span className="font-display text-2xl font-semibold text-bone">
                  {faction.name}
                </span>
                <span className="font-tech text-xs uppercase tracking-[0.24em] text-gold">
                  [{faction.tag}]
                </span>
              </div>
              <Link
                href={`/factions/${factionSlug}`}
                className="font-tech text-[10px] uppercase tracking-[0.25em] text-ember-glow transition-colors hover:text-bone"
              >
                Voir la fiche →
              </Link>
            </div>
          ) : (
            <div className="flex flex-col gap-2 border border-iron-line bg-iron p-5">
              <span className="font-tech text-[10px] uppercase tracking-[0.24em] text-steel">
                Faction
              </span>
              <p className="text-sm text-steel">Aucune faction.</p>
            </div>
          )}

          {lives === 0 && (
            <Link
              href="/la-liste"
              className="font-tech text-[10px] uppercase tracking-[0.25em] text-ember-glow hover:text-bone"
            >
              Voir La Liste →
            </Link>
          )}
        </div>
      </div>

      {admin && (
        <AdminPlayerTools
          uuid={player.uuid}
          username={player.username}
          initialLives={adminRow?.lives ?? player.lives}
          initialBalance={adminRow?.balance ?? player.balance}
          discordId={adminRow?.discordId ?? null}
        />
      )}
    </main>
  );
}
