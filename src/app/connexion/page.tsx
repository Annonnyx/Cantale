import type { Metadata } from "next";
import Link from "next/link";
import { getSessionUser, type SessionUser } from "@/server/session";
import { getPlayerByUuid, type Player } from "@/server/repo/players";
import { getFactionByMemberUuid } from "@/server/repo/factions";
import { LifeNotches } from "@/components/ui/life-notches";
import { Stamp } from "@/components/ui/stamp";
import { SkinViewer } from "@/components/profile/skin-viewer";

export const dynamic = "force-dynamic";

const DISCORD_INVITE = "https://discord.gg/eDTfYWtuYp";

export async function generateMetadata(): Promise<Metadata> {
  const { tier } = await getSessionUser();
  const identified = tier === "linked" || tier === "leader";
  return {
    title: identified ? "Profil" : "Connexion",
    description: identified
      ? "Profil joueur CANTALE — statistiques, vies, faction."
      : "Connecte-toi avec Discord pour retrouver ton profil CANTALE.",
    robots: { index: false, follow: false },
  };
}

const OAUTH_ERRORS: Record<string, string> = {
  oauth_invalide: "La tentative de connexion a échoué. Réessaie.",
  echange_impossible: "Impossible de finaliser la connexion avec Discord. Réessaie.",
  profil_introuvable: "Ton profil Discord n'a pas pu être lu. Réessaie.",
};

function Kicker({ children }: { children: React.ReactNode }) {
  return (
    <span className="font-tech text-[10px] uppercase tracking-[0.3em] text-ember-glow">
      {children}
    </span>
  );
}

function DiscordLoginButton() {
  return (
    <a
      href="/api/auth/discord"
      className="pressable inline-block border border-ember px-6 py-3 font-tech text-[11px] uppercase tracking-[0.22em] text-ember-glow hover:bg-ember hover:text-bone"
    >
      Se connecter avec Discord
    </a>
  );
}

function LogoutLink({ label = "Se déconnecter" }: { label?: string }) {
  return (
    <a
      href="/api/auth/logout"
      className="pressable inline-block border border-iron-line px-4 py-2 font-tech text-[11px] uppercase tracking-[0.22em] text-steel hover:border-bone hover:text-bone"
    >
      {label}
    </a>
  );
}

function ErrorNotice({ code }: { code: string | undefined }) {
  const message = code ? OAUTH_ERRORS[code] : undefined;
  if (!message) return null;
  return (
    <p className="border border-ember/60 bg-iron px-4 py-3 text-sm text-ember-glow" role="alert">
      {message}
    </p>
  );
}

function displayName(user: SessionUser["discordUser"]): string {
  return user?.globalName ?? user?.username ?? "";
}

/* ——— État 1 : visiteur anonyme ——— */
function AnonymousView({ erreur }: { erreur: string | undefined }) {
  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-8">
      <header className="flex flex-col gap-4">
        <Kicker>Registre — Identification</Kicker>
        <h1 className="font-display text-4xl font-semibold leading-[1.05] text-bone sm:text-5xl">
          Connexion
        </h1>
        <p className="max-w-xl text-base leading-relaxed text-steel">
          Le site se connecte uniquement via Discord. Aucun mot de passe, aucun formulaire :
          ton compte Discord est ta clé d&apos;entrée.
        </p>
      </header>

      <ErrorNotice code={erreur} />

      <div className="flex flex-col gap-6 border border-iron-line bg-iron p-6 sm:p-8">
        <ul className="flex flex-col gap-4">
          {[
            {
              title: "Ton profil joueur",
              text: "Skin 3D, vies restantes, statistiques et Cantox, directement issus du serveur.",
            },
            {
              title: "Ta position dans les classements",
              text: "Retrouve ta place dans le registre des kills, du temps de jeu et des richesses.",
            },
            {
              title: "Les candidatures de faction",
              text: "Compte lié obligatoire pour postuler ou gérer ta faction en ligne.",
            },
          ].map((item) => (
            <li key={item.title} className="flex flex-col gap-1 border-l-2 border-ember/60 pl-4">
              <span className="font-display text-base font-semibold text-bone">{item.title}</span>
              <span className="text-sm leading-relaxed text-steel">{item.text}</span>
            </li>
          ))}
        </ul>
        <div className="flex flex-col gap-3 border-t border-iron-line/60 pt-6">
          <DiscordLoginButton />
          <span className="font-tech text-[10px] uppercase tracking-[0.22em] text-steel">
            Scope « identify » uniquement — nous ne lisons que ton pseudo.
          </span>
        </div>
      </div>
    </div>
  );
}

/* ——— État 2 : Discord connecté, compte Minecraft non lié ——— */
function UnlinkedView({ user }: { user: SessionUser }) {
  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-8">
      <header className="flex flex-col gap-4">
        <Kicker>Registre — Liaison requise</Kicker>
        <h1 className="font-display text-4xl font-semibold leading-[1.05] text-bone sm:text-5xl">
          Lie ton compte Minecraft
        </h1>
        <p className="max-w-xl text-base leading-relaxed text-steel">
          Connecté en tant que{" "}
          <span className="text-bone">{displayName(user.discordUser)}</span>. Pour accéder à
          ton profil, la liaison existante du serveur doit reconnaître ton compte.
        </p>
      </header>

      <div className="flex flex-col gap-6 border border-iron-line bg-iron p-6 sm:p-8">
        <ol className="flex flex-col gap-6">
          <li className="flex flex-col gap-2">
            <span className="font-tech text-[10px] uppercase tracking-[0.24em] text-ember-glow">
              Étape 1 — En jeu
            </span>
            <p className="text-sm leading-relaxed text-steel">
              Connecte-toi sur CANTALE et tape{" "}
              <code className="border border-iron-line bg-ash-deep px-1.5 py-0.5 font-tech text-xs text-bone">
                /link
              </code>
              . Le serveur te remet un code de liaison à 6 caractères, valable 10 minutes.
            </p>
          </li>
          <li className="flex flex-col gap-2">
            <span className="font-tech text-[10px] uppercase tracking-[0.24em] text-ember-glow">
              Étape 2 — Sur Discord
            </span>
            <p className="text-sm leading-relaxed text-steel">
              Rejoins le Discord (
              <a
                href={DISCORD_INVITE}
                target="_blank"
                rel="noopener noreferrer"
                className="text-steel-light underline decoration-iron-line underline-offset-4 transition-colors hover:text-bone"
              >
                discord.gg/eDTfYWtuYp
              </a>
              ) et utilise la commande{" "}
              <code className="border border-iron-line bg-ash-deep px-1.5 py-0.5 font-tech text-xs text-bone">
                /link &lt;code&gt; &lt;ton_pseudo&gt;
              </code>{" "}
              auprès du bot : le code reçu en jeu, puis ton pseudo Minecraft exact, avec les
              majuscules.
            </p>
          </li>
          <li className="flex flex-col gap-2">
            <span className="font-tech text-[10px] uppercase tracking-[0.24em] text-ember-glow">
              Étape 3 — Ici
            </span>
            <p className="text-sm leading-relaxed text-steel">
              Recharge cette page : ton profil complet apparaît dès que la liaison est faite.
            </p>
          </li>
        </ol>
        <div className="flex flex-wrap items-center gap-4 border-t border-iron-line/60 pt-6">
          <a
            href="/connexion"
            className="pressable inline-block border border-ember px-4 py-2 font-tech text-[11px] uppercase tracking-[0.22em] text-ember-glow hover:bg-ember hover:text-bone"
          >
            Vérifier ma liaison
          </a>
          <LogoutLink />
        </div>
      </div>
    </div>
  );
}

/* ——— État 3 : compte lié (et leader) ——— */

function formatPlaytime(seconds: number): string {
  const totalMinutes = Math.floor(seconds / 60);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (hours <= 0) return `${minutes} min`;
  return `${hours} h ${String(minutes).padStart(2, "0")}`;
}

function formatCantox(balance: number): string {
  return `${new Intl.NumberFormat("fr-FR").format(Math.floor(balance))} Cantox`;
}

function RoleStamps({ user }: { user: SessionUser }) {
  return (
    <div className="flex flex-wrap items-center gap-3">
      {user.capabilities.isDirection && <Stamp tone="gold">Direction</Stamp>}
      {user.capabilities.isLeader && (
        <Stamp tone="ember" rotation={1.5}>
          Leader
        </Stamp>
      )}
      {user.capabilities.hasFaction && (
        <Stamp tone="steel" rotation={2}>
          Faction
        </Stamp>
      )}
      <Stamp tone="ember" rotation={-1}>
        Compte lié
      </Stamp>
    </div>
  );
}

function StatsGrid({ player }: { player: Player }) {
  const stats = [
    { label: "Éliminations", value: new Intl.NumberFormat("fr-FR").format(player.kills) },
    { label: "Morts", value: new Intl.NumberFormat("fr-FR").format(player.deaths) },
    { label: "Série d'éliminations", value: new Intl.NumberFormat("fr-FR").format(player.killStreak) },
    { label: "Temps de jeu", value: formatPlaytime(player.playtime) },
    { label: "Fortune", value: formatCantox(player.balance) },
    { label: "Réactions chat", value: new Intl.NumberFormat("fr-FR").format(player.chatReactions) },
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

async function ProfileView({ user }: { user: SessionUser }) {
  const uuid = user.mc?.uuid ?? "";
  const [player, faction] = await Promise.all([
    uuid ? getPlayerByUuid(uuid).catch(() => null) : Promise.resolve(null),
    uuid ? getFactionByMemberUuid(uuid).catch(() => null) : Promise.resolve(null),
  ]);

  const username = player?.username ?? user.mc?.username ?? "Inconnu";
  const lives = Math.max(0, Math.min(3, player?.lives ?? 0)) as 0 | 1 | 2 | 3;
  const factionSlug = faction
    ? faction.name.toLowerCase().replace(/\s+/g, "-")
    : null;

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-10">
      <header className="flex flex-col gap-4">
        <Kicker>Registre — Profil joueur</Kicker>
        <h1 className="font-display text-4xl font-semibold leading-[1.05] text-bone sm:text-5xl">
          {username}
        </h1>
        {uuid ? (
          <Link
            href={`/joueur/${uuid}`}
            className="font-tech text-[10px] uppercase tracking-[0.25em] text-ember-glow hover:text-bone"
          >
            Voir le profil public →
          </Link>
        ) : null}
        <RoleStamps user={user} />
      </header>

      <div className="grid gap-6 lg:grid-cols-[300px_1fr]">
        <div className="flex flex-col gap-4">
          <SkinViewer uuid={uuid} username={username} />
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
          <div className="flex flex-col gap-3 border border-iron-line bg-iron p-5">
            <span className="font-tech text-[10px] uppercase tracking-[0.24em] text-steel">
              Liaison du compte
            </span>
            <p className="text-sm leading-relaxed text-steel">
              Discord{" "}
              <span className="text-bone">{displayName(user.discordUser)}</span>
              {" "}↔ Minecraft{" "}
              <span className="text-bone">{username}</span>
            </p>
          </div>

          {player ? (
            <StatsGrid player={player} />
          ) : (
            <p className="border border-iron-line bg-iron p-5 text-sm text-steel">
              Statistiques indisponibles : ce compte n&apos;a pas encore été vu en jeu.
            </p>
          )}

          {faction && factionSlug ? (
            <div className="flex flex-col gap-3 border border-iron-line bg-iron p-5">
              <span className="font-tech text-[10px] uppercase tracking-[0.24em] text-steel">
                Faction actuelle
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
                Faction actuelle
              </span>
              <p className="text-sm text-steel">Aucune faction — le registre attend ton nom.</p>
            </div>
          )}

          {user.tier === "leader" && (
            <div className="flex flex-col gap-4 border border-gold/50 bg-iron p-5">
              <span className="font-tech text-[10px] uppercase tracking-[0.24em] text-gold">
                Panneau de gestion de faction
              </span>
              <p className="text-sm leading-relaxed text-steel">
                Tu portes le rôle leader. Gère ta faction, ses membres et ses prétentions
                depuis l&apos;espace dédié.
              </p>
              <Link
                href="/factions"
                className="inline-block self-start border border-gold px-4 py-2 font-tech text-[11px] uppercase tracking-[0.22em] text-gold transition-colors hover:bg-gold hover:text-ash"
              >
                Ouvrir le panneau
              </Link>
            </div>
          )}

          <div className="border-t border-iron-line/60 pt-6">
            <LogoutLink />
          </div>
        </div>
      </div>
    </div>
  );
}

export default async function ConnexionPage({
  searchParams,
}: {
  searchParams: Promise<{ erreur?: string }>;
}) {
  const { erreur } = await searchParams;
  const user = await getSessionUser();

  return (
    <main className="mx-auto w-full max-w-7xl flex-1 px-5 pb-24 pt-28 sm:px-8 sm:pt-32">
      {user.tier === "anonymous" ? (
        <AnonymousView erreur={erreur} />
      ) : !user.mc ? (
        <UnlinkedView user={user} />
      ) : (
        <ProfileView user={user} />
      )}
    </main>
  );
}
