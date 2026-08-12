import type { Metadata } from "next";
import { LegalLink, LegalPageShell, type LegalSection } from "@/components/legal/legal-page";

export const metadata: Metadata = {
  title: "Politique de confidentialité",
  description:
    "Politique de confidentialité RGPD de CANTALE : données Discord OAuth, profils Minecraft, formulaires, droits des personnes.",
};

const UPDATED = "12 août 2026";
const DISCORD = "https://discord.gg/65a9upGPHx";
const CONTACT_EMAIL = "contact@cantale.fun";

const SECTIONS: LegalSection[] = [
  {
    id: "responsable",
    title: "Responsable du traitement",
    body: (
      <>
        <p>
          Le responsable du traitement des données personnelles liées au site et à la liaison
          Discord / Minecraft est :
        </p>
        <ul className="list-disc space-y-1 pl-5">
          <li>
            <strong className="text-bone">Barneron Noé</strong>
          </li>
          <li>
            Contact RGPD / demandes d&apos;exercice des droits :{" "}
            <LegalLink href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</LegalLink>
            {" · "}
            via le{" "}
            <LegalLink href={DISCORD} external>
              Discord CANTALE
            </LegalLink>{" "}
            (ticket Direction) — indiquez clairement « demande RGPD » et le compte concerné.
          </li>
        </ul>
        <p>
          Aucun délégué à la protection des données (DPO) n&apos;est désigné : le volume et la
          nature des traitements ne l&apos;imposent pas pour ce projet.
        </p>
      </>
    ),
  },
  {
    id: "donnees",
    title: "Données collectées",
    body: (
      <>
        <p>Selon votre usage du site, nous pouvons traiter :</p>
        <ul className="list-disc space-y-2 pl-5">
          <li>
            <strong className="text-bone">Compte Discord (OAuth2, scope identify)</strong> :
            identifiant Discord, nom d&apos;utilisateur, nom d&apos;affichage, avatar. Nous ne
            demandons pas l&apos;accès à vos messages Discord ni à votre e-mail Discord.
          </li>
          <li>
            <strong className="text-bone">Liaison Minecraft</strong> : UUID et pseudo Minecraft
            associés à votre Discord lorsque vous utilisez la commande de liaison in-game / Discord.
          </li>
          <li>
            <strong className="text-bone">Données de jeu affichées sur le site</strong> : stats
            publiques (vies, playtime, faction, classements, etc.) issues de la base du serveur —
            visibles aussi en jeu selon le règlement.
          </li>
          <li>
            <strong className="text-bone">Formulaires</strong> : recrutement, partenariats,
            candidatures de faction (texte libre, Discord déclaré, etc.) transmis au staff via
            tickets Discord.
          </li>
          <li>
            <strong className="text-bone">Données techniques</strong> : adresse IP (rate-limit,
            sécurité anti-abus), logs serveur minimaux, cookies de session (voir{" "}
            <LegalLink href="/cookies">politique cookies</LegalLink>).
          </li>
          <li>
            <strong className="text-bone">Cloudflare Turnstile</strong> (si activé sur un
            formulaire) : jeton anti-bot vérifié auprès de Cloudflare — pas d&apos;outil
            publicitaire de notre côté.
          </li>
        </ul>
        <p>
          <strong className="text-bone">Pas de traqueurs marketing inventés</strong> : le site
          n&apos;intègre pas Google Analytics, Meta Pixel, ni équivalent au moment de cette
          politique. Si un outil d&apos;audience était ajouté plus tard, cette page et la
          politique cookies seraient mises à jour, avec consentement si requis.
        </p>
      </>
    ),
  },
  {
    id: "finalites",
    title: "Finalités & bases légales",
    body: (
      <>
        <ul className="list-disc space-y-2 pl-5">
          <li>
            <strong className="text-bone">Fournir le service</strong> (connexion, liaison de
            comptes, affichage profil / factions / classements) — exécution du service demandé
            (art. 6.1.b RGPD).
          </li>
          <li>
            <strong className="text-bone">Modération & sécurité</strong> (sanctions, anti-abus,
            rate-limit, Turnstile) — intérêt légitime à un serveur sain (art. 6.1.f).
          </li>
          <li>
            <strong className="text-bone">Traiter candidatures / partenariats</strong> —
            mesures précontractuelles / intérêt légitime (art. 6.1.b / 6.1.f).
          </li>
          <li>
            <strong className="text-bone">Obligations légales</strong> éventuelles (ex. facturation
            si boutique active) — art. 6.1.c.
          </li>
        </ul>
      </>
    ),
  },
  {
    id: "destinataires",
    title: "Destinataires",
    body: (
      <>
        <p>Vos données peuvent être traitées par :</p>
        <ul className="list-disc space-y-2 pl-5">
          <li>
            <strong className="text-bone">Staff CANTALE</strong> (Direction / modération) pour le
            fonctionnement du serveur et le traitement des tickets.
          </li>
          <li>
            <strong className="text-bone">Discord Inc.</strong> — lors de l&apos;OAuth et de la
            création de tickets (soumis aux conditions Discord).
          </li>
          <li>
            <strong className="text-bone">Vercel Inc.</strong> — hébergement du site (logs
            techniques).
          </li>
          <li>
            <strong className="text-bone">Cloudflare, Inc.</strong> — si Turnstile est actif sur un
            formulaire.
          </li>
          <li>
            Prestataire de paiement éventuel — uniquement si vous effectuez un achat boutique.
          </li>
        </ul>
        <p>Nous ne vendons pas vos données personnelles.</p>
      </>
    ),
  },
  {
    id: "conservation",
    title: "Durées de conservation",
    body: (
      <>
        <ul className="list-disc space-y-2 pl-5">
          <li>
            <strong className="text-bone">Session web</strong> : cookie jusqu&apos;à environ 30
            jours, ou jusqu&apos;à déconnexion.
          </li>
          <li>
            <strong className="text-bone">Liaison Discord ↔ Minecraft</strong> : tant que le lien
            est actif ; suppression sur demande ou après déliaison / ban durable selon cas.
          </li>
          <li>
            <strong className="text-bone">Données de jeu</strong> : conservées pour le
            fonctionnement du serveur (stats, factions, historique pertinent à la modération).
          </li>
          <li>
            <strong className="text-bone">Formulaires / tickets</strong> : le temps du traitement
            puis archivage raisonnable pour suivi et litiges éventuels.
          </li>
          <li>
            <strong className="text-bone">Logs techniques / IP</strong> : durée courte, limitée à
            la sécurité et au diagnostic.
          </li>
        </ul>
      </>
    ),
  },
  {
    id: "droits",
    title: "Vos droits (RGPD)",
    body: (
      <>
        <p>Conformément au RGPD, vous pouvez demander :</p>
        <ul className="list-disc space-y-1 pl-5">
          <li>accès à vos données ;</li>
          <li>rectification ;</li>
          <li>effacement (dans les limites du jeu : un ban ou un historique de sanction peut
            devoir être conservé) ;</li>
          <li>limitation ou opposition pour motifs légitimes ;</li>
          <li>portabilité lorsque applicable.</li>
        </ul>
        <p>
          Pour exercer ces droits : écrivez à{" "}
          <LegalLink href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</LegalLink>
          {" "}
          ou contactez la Direction via le{" "}
          <LegalLink href={DISCORD} external>
            Discord
          </LegalLink>
          . Nous répondons dans un délai raisonnable (objectif : 30 jours). Vous pouvez aussi
          introduire une réclamation auprès de la{" "}
          <LegalLink href="https://www.cnil.fr" external>
            CNIL
          </LegalLink>
          .
        </p>
        <p>
          Pour supprimer votre session web : utilisez la déconnexion sur le site. Pour supprimer la
          liaison Discord / Minecraft : contactez le staff (ou utilisez les outils in-game /
          Discord prévus s&apos;ils existent).
        </p>
      </>
    ),
  },
  {
    id: "transferts",
    title: "Transferts hors UE",
    body: (
      <>
        <p>
          L&apos;hébergeur du site (Vercel) et Discord / Cloudflare sont des prestataires pouvant
          traiter des données aux États-Unis ou dans d&apos;autres pays. Ces transferts reposent
          sur les mécanismes prévus par ces prestataires (clauses contractuelles types,
          certifications, etc.). En vous connectant via Discord ou en utilisant le site, vous
          acceptez ce fonctionnement inhérent aux outils utilisés.
        </p>
      </>
    ),
  },
  {
    id: "mineurs",
    title: "Mineurs",
    body: (
      <>
        <p>
          Minecraft et Discord ont leurs propres règles d&apos;âge. Les parents / tuteurs sont
          responsables de l&apos;usage du service par un mineur. Pour une demande relative à un
          compte de mineur, écrivez à{" "}
          <LegalLink href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</LegalLink>
          {" "}
          ou contactez-nous via Discord avec les éléments permettant de vérifier la
          demande.
        </p>
      </>
    ),
  },
];

export default function ConfidentialitePage() {
  return (
    <LegalPageShell
      kicker="Registre — données personnelles"
      title="Politique de confidentialité"
      intro={
        <p>
          Comment CANTALE traite vos données personnelles sur le site et pour la liaison Discord
          / Minecraft. Aligné sur le RGPD, sans jargon inutile.
        </p>
      }
      updated={UPDATED}
      sections={SECTIONS}
    />
  );
}
