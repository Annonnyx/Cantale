import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Stamp } from "@/components/ui/stamp";
import { getSessionUser } from "@/server/session";
import { PartnershipForm } from "./partnership-form";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Partenariats",
  description:
    "Deviens partenaire de CANTALE : serveurs et communautés francophones, créateurs de contenu, événementiel. Visibilité croisée, rôle partenaire et events communs.",
};

const DISCORD_URL = "https://discord.gg/65a9upGPHx";

type PartnerType = {
  num: string;
  stamp: "steel" | "gold" | "ember";
  stampLabel: string;
  title: string;
  description: string;
  points: string[];
};

const PARTNER_TYPES: PartnerType[] = [
  {
    num: "01",
    stamp: "steel",
    stampLabel: "Communauté",
    title: "Serveurs & communautés",
    description:
      "Tu gères un serveur ou une communauté francophone ? On échange de la visibilité : annonces croisées, découverte mutuelle de nos univers.",
    points: ["Annonces croisées sur nos Discords", "Lien et présentation mutuels", "Aucune obligation d'exclusivité"],
  },
  {
    num: "02",
    stamp: "gold",
    stampLabel: "Créateur",
    title: "Créateurs de contenu",
    description:
      "YouTube, Twitch, TikTok : viens raconter tes trois vies, tes sièges et tes trahisons. Cantale est un terrain de jeu taillé pour les récits tendus.",
    points: ["Accès anticipé aux nouveautés", "Items de tournage et cadre dédié", "Mise en avant de tes contenus"],
  },
  {
    num: "03",
    stamp: "ember",
    stampLabel: "Event",
    title: "Événementiel",
    description:
      "Tournois PvP, guerres de factions scénarisées, events caritatifs : on co-organise et on fournit le terrain, l'infra et la communication.",
    points: ["Co-organisation avec le staff", "Serveur et configuration dédiés", "Communication conjointe"],
  },
];

type Condition = {
  title: string;
  description: ReactNode;
};

const CONDITIONS: Condition[] = [
  {
    title: "Univers compatible",
    description:
      "Cantale est un serveur PvP factions hardcore avec trois vies. Ton contenu ou ta communauté doit coller à un univers compétitif et exigeant.",
  },
  {
    title: "Audience francophone",
    description:
      "Le serveur est 100 % français. Ton audience doit être majoritairement francophone pour que le partenariat serve les deux camps.",
  },
  {
    title: "Activité réelle sur Discord",
    description:
      "On regarde l'activité, pas le compteur de membres. Une communauté petite mais vivante vaut mieux qu'un chiffre gonflé.",
  },
  {
    title: "Alignement de valeurs",
    description:
      "Respect, fair-play, zéro toxicité. Un partenaire engage Cantale : on ne s'associe qu'avec des projets propres.",
  },
  {
    title: "Pas de pay-to-win douteux",
    description:
      "Aucun partenariat avec des serveurs ou boutiques fondés sur un pay-to-win agressif. La boutique de Cantale reste cosmétique et confort, et on attend la même exigence en face.",
  },
];

type Perk = {
  title: string;
  description: string;
};

const PERKS: Perk[] = [
  {
    title: "Visibilité site & Discord",
    description:
      "Salon dédié sur le Discord, annonces à notre communauté, et présence de ton projet sur le site officiel de Cantale.",
  },
  {
    title: "Rôle partenaire",
    description:
      "Un rôle distinctif sur le Discord, un accès direct au channel staff-partenaires et une ligne privilégiée avec la direction.",
  },
  {
    title: "Events croisés",
    description:
      "Co-organisation d'événements : tournois communs, affrontements amicaux entre factions, opérations spéciales médiatisées.",
  },
];

function SectionHeading({
  id,
  num,
  kicker,
  title,
  intro,
}: {
  id: string;
  num: string;
  kicker: string;
  title: string;
  intro?: string;
}) {
  return (
    <div className="flex items-end gap-5 border-b border-iron-line/60 pb-5">
      <span
        aria-hidden="true"
        className="font-display text-5xl font-semibold leading-[0.85] text-ember-glow/80 sm:text-6xl"
      >
        {num}
      </span>
      <div className="min-w-0 pb-0.5">
        <span className="font-tech text-[10px] uppercase tracking-[0.28em] text-steel">
          {kicker}
        </span>
        <h2
          id={id}
          className="mt-1 font-display text-2xl font-semibold leading-tight text-bone sm:text-3xl"
        >
          {title}
        </h2>
        {intro && <p className="mt-2 max-w-2xl text-sm leading-relaxed text-steel">{intro}</p>}
      </div>
    </div>
  );
}

export default async function PartenariatsPage() {
  const user = await getSessionUser();
  const discordName = user.discordUser
    ? (user.discordUser.globalName ?? user.discordUser.username)
    : null;

  return (
    <main className="mx-auto w-full max-w-7xl px-5 pb-24 pt-28 sm:px-8 sm:pt-32">
      {/* ——— En-tête ——— */}
      <header className="flex flex-col gap-5 pb-12">
        <span className="font-tech text-[10px] uppercase tracking-[0.3em] text-ember-glow">
          Alliances — hors du serveur
        </span>
        <h1 className="max-w-3xl font-display text-4xl font-semibold leading-[1.05] text-bone sm:text-5xl">
          Grandir ensemble, sans se renier.
        </h1>
        <p className="max-w-2xl text-base leading-relaxed text-steel">
          Cantale ouvre ses portes aux projets qui partagent son exigence : serveurs partenaires,
          créateurs de contenu, organisateurs d&apos;événements. Pas de placement opportuniste —
          des alliances nettes, assumées, et profitables des deux côtés.
        </p>
      </header>

      <div className="flex flex-col gap-14">
        {/* ——— 01 · Types de partenariats ——— */}
        <section aria-labelledby="types-title">
          <SectionHeading
            id="types-title"
            num="01"
            kicker="Formules"
            title="Trois types d'alliance"
            intro="Choisis la porte qui correspond à ton projet — chaque formule a son cadre, posé noir sur blanc."
          />
          <div className="reveal reveal-stagger grid gap-4 pt-8 md:grid-cols-3">
            {PARTNER_TYPES.map((type) => (
              <article
                key={type.num}
                className="card-soft flex flex-col gap-4 border border-iron-line bg-iron p-6"
              >
                <div className="flex items-start justify-between gap-4">
                  <span
                    aria-hidden="true"
                    className="font-display text-3xl font-semibold text-ember-glow/80"
                  >
                    {type.num}
                  </span>
                  <Stamp tone={type.stamp}>{type.stampLabel}</Stamp>
                </div>
                <h3 className="font-display text-lg font-semibold text-bone">{type.title}</h3>
                <p className="text-sm leading-relaxed text-steel">{type.description}</p>
                <ul className="mt-auto flex flex-col gap-2 border-t border-iron-line/60 pt-4">
                  {type.points.map((point) => (
                    <li key={point} className="flex items-start gap-2.5 text-sm text-steel">
                      <span
                        aria-hidden="true"
                        className="mt-1.5 h-1.5 w-1.5 shrink-0 bg-ember"
                      />
                      {point}
                    </li>
                  ))}
                </ul>
              </article>
            ))}
          </div>
        </section>

        {/* ——— 02 · Conditions ——— */}
        <section aria-labelledby="conditions-title" className="reveal">
          <SectionHeading
            id="conditions-title"
            num="02"
            kicker="Le cadre"
            title="Conditions non négociables"
            intro="Le partenariat engage le nom de Cantale. Ces règles sont lues avant toute signature — elles ne se discutent pas."
          />
          <ul className="divide-y divide-iron-line/60 border-x border-b border-iron-line bg-iron">
            {CONDITIONS.map((condition, index) => (
              <li key={index} className="p-5 sm:p-6">
                <div className="flex items-start gap-4">
                  <span
                    aria-hidden="true"
                    className="mt-2 h-2 w-2 shrink-0 bg-ember"
                  />
                  <div>
                    <h3 className="font-display text-base font-semibold text-bone">
                      {condition.title}
                    </h3>
                    <p className="mt-1.5 max-w-2xl text-sm leading-relaxed text-steel">
                      {condition.description}
                    </p>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </section>

        {/* ——— 03 · Contreparties ——— */}
        <section aria-labelledby="contreparties-title" className="reveal">
          <SectionHeading
            id="contreparties-title"
            num="03"
            kicker="Ce qu'on apporte"
            title="Les contreparties"
            intro="Un partenariat se mesure à ce que chacun pose sur la table. Voici notre mise, sans petites lignes."
          />
          <div className="reveal reveal-stagger grid gap-4 pt-8 md:grid-cols-3">
            {PERKS.map((perk) => (
              <article
                key={perk.title}
                className="card-soft flex flex-col gap-3 border border-iron-line bg-iron p-6"
              >
                <h3 className="font-display text-lg font-semibold text-bone">{perk.title}</h3>
                <p className="text-sm leading-relaxed text-steel">{perk.description}</p>
              </article>
            ))}
          </div>
        </section>

        {/* ——— 04 · Contact ——— */}
        <section aria-labelledby="contact-title" className="reveal">
          <div className="border border-ember/60 bg-iron p-6 sm:p-10">
            <Stamp tone="gold">Contact</Stamp>
            <h2
              id="contact-title"
              className="mt-5 max-w-xl font-display text-2xl font-semibold leading-tight text-bone sm:text-3xl"
            >
              Une alliance à proposer ?
            </h2>
            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-steel">
              Remplis le formulaire ci-dessous : ta demande ouvre un salon privé sur le Discord,
              lu par la direction — Fondateur et équipe dirigeante, sans intermédiaire. Présente
              ton projet clairement : qui tu es, ton audience, ce que tu proposes.
              {discordName
                ? ` Connecté en tant que ${discordName} — le ticket te sera accessible directement.`
                : " Connecte-toi avec Discord pour suivre le ticket en direct, sinon la direction te répondra dans le salon."}
            </p>
            <div className="mt-7 flex flex-wrap items-center gap-4">
              <a
                href="#formulaire-partenariat"
                className="pressable bg-ember px-5 py-2.5 font-tech text-[11px] uppercase tracking-[0.22em] text-bone hover:bg-ember-glow"
              >
                Remplir le formulaire
              </a>
              <a
                href={DISCORD_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="pressable border border-iron-line px-5 py-2.5 font-tech text-[11px] uppercase tracking-[0.22em] text-steel hover:border-bone hover:text-bone"
              >
                Rejoindre le Discord
              </a>
            </div>

            <div id="formulaire-partenariat" className="mt-8 scroll-mt-28">
              <PartnershipForm discordName={discordName} />
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
