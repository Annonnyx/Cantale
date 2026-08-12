import type { Metadata } from "next";
import { Stamp } from "@/components/ui/stamp";
import { getEquipeRoster } from "@/server/repo/equipe";
import { getSessionUser } from "@/server/session";
import { EquipeRoster } from "./equipe-roster";
import { RecruitmentForm } from "./recruitment-form";
import { RECRUITMENT_ROLES } from "./roles";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Recrutement",
  description:
    "Équipe CANTALE (staff en jeu) et candidatures : modération, réseaux, graphisme, build/3D, développement, animation. Ticket privé avec la direction.",
};

const PROCESS_STEPS = [
  {
    num: "01",
    title: "Tu postules",
    text: "Quatre étapes, cinq minutes. Dis-nous qui tu es, ce que tu sais faire, et ce que tu veux apporter au serveur.",
  },
  {
    num: "02",
    title: "Un ticket s'ouvre",
    text: "Ta candidature crée un salon privé sur le Discord, visible uniquement par la direction — et par toi si tu es connecté.",
  },
  {
    num: "03",
    title: "La direction répond",
    text: "Chaque candidature est lue. La réponse arrive dans le ticket, généralement sous sept jours, avec un échange si besoin.",
  },
] as const;

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

export default async function RecrutementPage() {
  const [user, equipeGroups] = await Promise.all([
    getSessionUser(),
    getEquipeRoster().catch(() => []),
  ]);
  const discordName = user.discordUser
    ? (user.discordUser.globalName ?? user.discordUser.username)
    : null;

  return (
    <main className="mx-auto w-full max-w-7xl px-5 pb-24 pt-28 sm:px-8 sm:pt-32">
      {/* ——— En-tête ——— */}
      <header className="flex flex-col gap-5 pb-12">
        <span className="font-tech text-[10px] uppercase tracking-[0.3em] text-ember-glow">
          Registre — Recrutement
        </span>
        <h1 className="max-w-3xl font-display text-4xl font-semibold leading-[1.05] text-bone sm:text-5xl">
          L&apos;équipe se construit comme le serveur : par l&apos;effort.
        </h1>
        <p className="max-w-2xl text-base leading-relaxed text-steel">
          Cantale cherche des membres d&apos;équipe qui tiennent leurs promesses. Pas de
          CV pompeux ni de formulaire à l&apos;ancienne : une candidature claire, lue par
          la direction, qui débouche sur un vrai échange.
        </p>
        <p className="font-tech text-[10px] uppercase tracking-[0.22em] text-steel">
          <a href="#equipe" className="text-ember-glow hover:text-bone">
            Voir l&apos;équipe
          </a>
          <span aria-hidden="true" className="mx-2 text-iron-line">
            ·
          </span>
          <a href="#postes" className="hover:text-bone">
            Postes ouverts
          </a>
          <span aria-hidden="true" className="mx-2 text-iron-line">
            ·
          </span>
          <a href="#candidature" className="hover:text-bone">
            Candidater
          </a>
        </p>
      </header>

      <div className="flex flex-col gap-14">
        {/* ——— 01 · Équipe ——— */}
        <section id="equipe" aria-labelledby="equipe-title">
          <SectionHeading
            id="equipe-title"
            num="01"
            kicker="En place"
            title="L'équipe"
            intro="Grades réels issus du serveur (et des rôles Discord de direction). Aucun nom inventé — si tu n'apparais pas ici, tu n'as pas encore le grade."
          />
          <div className="reveal pt-8">
            <EquipeRoster groups={equipeGroups} />
          </div>
        </section>

        {/* ——— 02 · Postes ouverts ——— */}
        <section id="postes" aria-labelledby="postes-title">
          <SectionHeading
            id="postes-title"
            num="02"
            kicker="Les postes"
            title="Six portes d'entrée"
            intro="Chaque poste compte. Choisis celui où tu seras réellement utile — une candidature précise vaut dix candidatures larges."
          />
          <div className="reveal reveal-stagger grid gap-4 pt-8 md:grid-cols-2 lg:grid-cols-3">
            {RECRUITMENT_ROLES.map((role) => (
              <article
                key={role.id}
                className="card-soft flex flex-col gap-4 border border-iron-line bg-iron p-6"
              >
                <div className="flex items-start justify-between gap-4">
                  <span
                    aria-hidden="true"
                    className="font-display text-3xl font-semibold text-ember-glow/80"
                  >
                    {role.num}
                  </span>
                  <Stamp tone="ember">Ouvert</Stamp>
                </div>
                <h3 className="font-display text-lg font-semibold text-bone">{role.title}</h3>
                <p className="text-sm leading-relaxed text-steel">{role.description}</p>
                <span className="mt-auto border-t border-iron-line/60 pt-3 font-tech text-[10px] uppercase tracking-[0.22em] text-steel">
                  {role.tagline}
                </span>
              </article>
            ))}
          </div>
        </section>

        {/* ——— 03 · Déroulé ——— */}
        <section aria-labelledby="deroule-title">
          <SectionHeading
            id="deroule-title"
            num="03"
            kicker="Le déroulé"
            title="Ce qui se passe après l'envoi"
            intro="Pas de boîte noire : ta candidature atterrit dans un ticket privé, et tu sais exactement qui la lit."
          />
          <ol className="reveal reveal-stagger grid gap-4 pt-8 md:grid-cols-3">
            {PROCESS_STEPS.map((item) => (
              <li
                key={item.num}
                className="card-soft flex flex-col gap-3 border border-iron-line bg-iron p-6"
              >
                <span
                  aria-hidden="true"
                  className="font-display text-2xl font-semibold text-ember-glow/80"
                >
                  {item.num}
                </span>
                <h3 className="font-display text-base font-semibold text-bone">{item.title}</h3>
                <p className="text-sm leading-relaxed text-steel">{item.text}</p>
              </li>
            ))}
          </ol>
        </section>

        {/* ——— 04 · Candidature ——— */}
        <section id="candidature" aria-labelledby="candidature-title" className="reveal">
          <SectionHeading
            id="candidature-title"
            num="04"
            kicker="À toi"
            title="Déposer ta candidature"
            intro={
              discordName
                ? `Connecté en tant que ${discordName} — le ticket Discord te sera accessible directement.`
                : "Connecte-toi avec Discord avant d'envoyer pour suivre ton ticket en direct — sinon, la direction te répondra dans le salon."
            }
          />
          <div className="pt-8">
            <RecruitmentForm
              discordName={discordName}
              linkedMinecraftPseudo={user.mc?.username ?? null}
            />
          </div>
        </section>
      </div>
    </main>
  );
}
