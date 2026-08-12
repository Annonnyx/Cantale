import type { Metadata } from "next";
import { LegalLink, LegalPageShell, type LegalSection } from "@/components/legal/legal-page";

export const metadata: Metadata = {
  title: "Politique cookies",
  description:
    "Politique cookies de CANTALE : cookies techniques de session Discord uniquement, pas d'analytics publicitaires.",
};

const UPDATED = "12 août 2026";
const CONTACT_EMAIL = "contact@cantale.fun";

const SECTIONS: LegalSection[] = [
  {
    id: "principe",
    title: "Principe",
    body: (
      <>
        <p>
          Ce site utilise <strong className="text-bone">uniquement des cookies techniques</strong>{" "}
          nécessaires au fonctionnement de la connexion Discord et à la sécurité OAuth. Il
          n&apos;y a pas, à ce jour, de cookies publicitaires ni d&apos;outil d&apos;audience
          (Analytics, Pixel, etc.).
        </p>
        <p>
          Selon les recommandations de la CNIL, les cookies strictement nécessaires au service
          demandé ne requièrent pas de consentement préalable. C&apos;est pourquoi le bandeau du
          site est <strong className="text-bone">informatif</strong> (pas une muraille de cases
          à cocher pour des trackers inexistants).
        </p>
      </>
    ),
  },
  {
    id: "liste",
    title: "Cookies déposés",
    body: (
      <>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[32rem] border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-iron-line font-tech text-[10px] uppercase tracking-[0.18em] text-steel">
                <th className="py-2 pr-4 font-normal">Nom</th>
                <th className="py-2 pr-4 font-normal">Finalité</th>
                <th className="py-2 pr-4 font-normal">Durée</th>
                <th className="py-2 font-normal">Type</th>
              </tr>
            </thead>
            <tbody className="text-steel-light">
              <tr className="border-b border-iron-line/60 align-top">
                <td className="py-3 pr-4 font-tech text-[11px] text-ember-glow">
                  cantale_session
                </td>
                <td className="py-3 pr-4">
                  Session authentifiée après connexion Discord (profil public identify, signé
                  HMAC, HttpOnly).
                </td>
                <td className="py-3 pr-4">≈ 30 jours</td>
                <td className="py-3">Nécessaire</td>
              </tr>
              <tr className="border-b border-iron-line/60 align-top">
                <td className="py-3 pr-4 font-tech text-[11px] text-ember-glow">
                  cantale_oauth_state
                </td>
                <td className="py-3 pr-4">
                  Jeton anti-CSRF pendant le flux OAuth Discord (HttpOnly).
                </td>
                <td className="py-3 pr-4">≈ 10 minutes</td>
                <td className="py-3">Nécessaire</td>
              </tr>
              <tr className="align-top">
                <td className="py-3 pr-4 font-tech text-[11px] text-ember-glow">
                  cantale_cookie_notice
                </td>
                <td className="py-3 pr-4">
                  Mémorise que vous avez fermé le bandeau d&apos;information cookies (stockage local
                  navigateur, pas un cookie serveur).
                </td>
                <td className="py-3 pr-4">Jusqu&apos;à effacement</td>
                <td className="py-3">Préférence UI</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p className="mt-4">
          Attributs : <code className="text-ember-glow">HttpOnly</code>,{" "}
          <code className="text-ember-glow">SameSite=Lax</code>,{" "}
          <code className="text-ember-glow">Secure</code> en production pour les cookies
          d&apos;auth.
        </p>
      </>
    ),
  },
  {
    id: "tiers",
    title: "Tiers & scripts",
    body: (
      <>
        <ul className="list-disc space-y-2 pl-5">
          <li>
            <strong className="text-bone">Discord</strong> — redirection OAuth vers
            discord.com ; Discord peut déposer ses propres cookies sur son domaine (hors contrôle
            CANTALE).
          </li>
          <li>
            <strong className="text-bone">Cloudflare Turnstile</strong> — chargé uniquement sur
            certains formulaires si la clé publique est configurée (anti-bots). Pas un tracker
            marketing de notre part.
          </li>
          <li>
            <strong className="text-bone">Vercel</strong> — infrastructure d&apos;hébergement ;
            éventuels logs techniques côté plateforme.
          </li>
        </ul>
      </>
    ),
  },
  {
    id: "gestion",
    title: "Gérer / supprimer",
    body: (
      <>
        <p>
          Vous pouvez vous déconnecter sur le site pour invalider la session. Vous pouvez aussi
          supprimer les cookies du domaine cantale.world (et miroirs) dans les réglages de votre
          navigateur. Sans cookies de session, les fonctions connectées ne fonctionnent plus.
        </p>
        <p>
          Plus de détails sur les données :{" "}
          <LegalLink href="/confidentialite">politique de confidentialité</LegalLink>. Cadre
          général : <LegalLink href="/mentions-legales">mentions légales & CGU</LegalLink>.
          Contact :{" "}
          <LegalLink href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</LegalLink>.
        </p>
      </>
    ),
  },
];

export default function CookiesPage() {
  return (
    <LegalPageShell
      kicker="Registre — traceurs"
      title="Politique cookies"
      intro={
        <p>
          Liste claire des cookies et stockages utilisés par CANTALE. Spoiler : connexion Discord
          et sécurité OAuth, pas de publicité.
        </p>
      }
      updated={UPDATED}
      sections={SECTIONS}
    />
  );
}
