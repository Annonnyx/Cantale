import type { Metadata } from "next";
import { LegalLink, LegalPageShell, type LegalSection } from "@/components/legal/legal-page";

export const metadata: Metadata = {
  title: "Mentions légales & CGU",
  description:
    "Mentions légales et conditions générales d'utilisation du site et du serveur Minecraft CANTALE, édités par Barneron Noé.",
};

const UPDATED = "12 août 2026";
const DISCORD = "https://discord.gg/65a9upGPHx";
const CONTACT_EMAIL = "contact@cantale.fun";

const SECTIONS: LegalSection[] = [
  {
    id: "editeur",
    title: "Éditeur du site",
    body: (
      <>
        <p>
          Le site <strong className="text-bone">cantale.world</strong> (et ses miroirs éventuels
          tels que cantale.fun) est édité par :
        </p>
        <ul className="list-disc space-y-1 pl-5">
          <li>
            <strong className="text-bone">Barneron Noé</strong> — personne physique
          </li>
          <li>
            Directeur de la publication : <strong className="text-bone">Barneron Noé</strong>
          </li>
          <li>
            Contact :{" "}
            <LegalLink href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</LegalLink>
            {" · "}
            via le{" "}
            <LegalLink href={DISCORD} external>
              Discord CANTALE
            </LegalLink>{" "}
            (ticket / message au staff Direction)
          </li>
        </ul>
        <p>
          CANTALE est un projet communautaire de serveur Minecraft. Aucune société commerciale
          n&apos;est constituée à ce jour pour l&apos;édition du site.
        </p>
      </>
    ),
  },
  {
    id: "hebergeur",
    title: "Hébergement",
    body: (
      <>
        <p>Le site web est hébergé par :</p>
        <ul className="list-disc space-y-1 pl-5">
          <li>
            <strong className="text-bone">Vercel Inc.</strong>
          </li>
          <li>440 N Barranca Ave #4133, Covina, CA 91723, États-Unis</li>
          <li>
            Site :{" "}
            <LegalLink href="https://vercel.com" external>
              vercel.com
            </LegalLink>
          </li>
        </ul>
        <p>
          Les données de jeu (profils Minecraft, factions, etc.) sont stockées sur l&apos;infrastructure
          serveur du projet (base MySQL liée au serveur de jeu). Le serveur Minecraft n&apos;est pas
          hébergé par Vercel.
        </p>
      </>
    ),
  },
  {
    id: "objet",
    title: "Objet du service",
    body: (
      <>
        <p>
          CANTALE propose un serveur Minecraft PvP factions hardcore (trois vies) et un site
          associé : wiki, classements, carte, recrutement, partenariats, connexion Discord, et
          éventuelle boutique cosmétique.
        </p>
        <p>
          Minecraft est une marque de Mojang Studios / Microsoft. CANTALE n&apos;est pas affilié,
          approuvé ni sponsorisé par Mojang ou Microsoft.
        </p>
      </>
    ),
  },
  {
    id: "cgu",
    title: "Conditions d'utilisation",
    body: (
      <>
        <p>
          En accédant au site ou en jouant sur le serveur, vous acceptez les présentes conditions
          ainsi que le{" "}
          <LegalLink href="/reglement">règlement du serveur</LegalLink>.
        </p>
        <ul className="list-disc space-y-2 pl-5">
          <li>
            Vous devez disposer de l&apos;âge et de la capacité légale pour utiliser Discord et
            Minecraft selon leurs propres conditions.
          </li>
          <li>
            La connexion au site via Discord (OAuth2, scope <code className="text-ember-glow">identify</code>)
            est optionnelle : elle sert à lier votre compte Discord à votre profil Minecraft et à
            accéder aux fonctions connectées (candidatures, panneau leader, etc.).
          </li>
          <li>
            Vous vous engagez à fournir des informations exactes dans les formulaires (recrutement,
            partenariats, candidatures de faction) et à ne pas usurper l&apos;identité d&apos;autrui.
          </li>
          <li>
            L&apos;accès au site ou au serveur peut être restreint (ban, mute, retrait de lien Discord)
            en cas de non-respect du règlement ou d&apos;abus technique.
          </li>
          <li>
            Le contenu du site (textes, design, wiki) est protégé. Vous pouvez le consulter librement ;
            la reproduction commerciale sans accord est interdite.
          </li>
        </ul>
      </>
    ),
  },
  {
    id: "boutique",
    title: "Boutique & paiements",
    body: (
      <>
        <p>
          La boutique en ligne du site peut être désactivée. Lorsqu&apos;elle est active, les achats
          (grades / cosmétiques) sont soumis aux conditions affichées au moment du paiement et
          éventuellement à celles du prestataire de paiement (ex. cantale.store).
        </p>
        <p>
          Sauf mention contraire au moment de l&apos;achat : les avantages numériques sont livrés
          immédiatement en jeu ; aucun remboursement n&apos;est dû une fois l&apos;avantage activé, dans
          les limites du droit applicable.
        </p>
      </>
    ),
  },
  {
    id: "responsabilite",
    title: "Responsabilité",
    body: (
      <>
        <p>
          Le service est fourni « en l&apos;état ». Des interruptions (maintenance, attaques,
          pannes hébergeur) peuvent survenir. Nous nous efforçons de les limiter, sans garantie
          de disponibilité continue.
        </p>
        <p>
          Les interactions entre joueurs (PvP, raids, trahisons de factions) font partie du
          gameplay. Elles ne constituent pas un manquement de l&apos;éditeur tant qu&apos;elles
          respectent le règlement.
        </p>
        <p>
          Vous êtes responsable de la sécurité de votre compte Discord et de votre compte Minecraft.
        </p>
      </>
    ),
  },
  {
    id: "modifications",
    title: "Modifications",
    body: (
      <>
        <p>
          Ces mentions et CGU peuvent évoluer. La date en tête de page fait foi. Les changements
          importants sont annoncés sur le{" "}
          <LegalLink href={DISCORD} external>
            Discord
          </LegalLink>{" "}
          lorsque c&apos;est pertinent. La poursuite de l&apos;utilisation après publication vaut
          acceptation des nouvelles conditions.
        </p>
        <p>
          Données personnelles : voir la{" "}
          <LegalLink href="/confidentialite">politique de confidentialité</LegalLink>. Cookies :
          voir la <LegalLink href="/cookies">politique cookies</LegalLink>.
        </p>
      </>
    ),
  },
];

export default function MentionsLegalesPage() {
  return (
    <LegalPageShell
      kicker="Registre — cadre légal"
      title="Mentions légales & CGU"
      intro={
        <p>
          Informations d&apos;édition du site CANTALE et conditions d&apos;utilisation du site et
          du service associés. Texte pratique, pas un roman juridique.
        </p>
      }
      updated={UPDATED}
      sections={SECTIONS}
    />
  );
}
