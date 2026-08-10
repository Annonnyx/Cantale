/**
 * Définitions partagées du recrutement — importées par le formulaire client
 * ET par la route API (validation serveur). Aucun import serveur ici.
 */

export type RoleFieldType = "text" | "textarea" | "url";

export type RoleField = {
  id: string;
  label: string;
  placeholder: string;
  type: RoleFieldType;
  required: boolean;
  maxLength: number;
};

export type RoleDefinition = {
  id: string;
  num: string;
  title: string;
  tagline: string;
  description: string;
  fields: RoleField[];
};

export const RECRUITMENT_ROLES: RoleDefinition[] = [
  {
    id: "moderation",
    num: "01",
    title: "Modération",
    tagline: "Garder le serveur propre et juste",
    description:
      "Surveiller le chat et le jeu, traiter les signalements, appliquer le règlement sans abuser ni faiblir. Sur un serveur trois vies, chaque sanction pèse.",
    fields: [
      {
        id: "disponibilites",
        label: "Disponibilités",
        placeholder: "Ex. semaine 18h–23h, week-end après-midi",
        type: "text",
        required: true,
        maxLength: 120,
      },
      {
        id: "fuseau",
        label: "Fuseau horaire",
        placeholder: "Ex. Europe/Paris (UTC+2)",
        type: "text",
        required: true,
        maxLength: 60,
      },
      {
        id: "experience_moderation",
        label: "Expérience en modération",
        placeholder: "Serveurs déjà modérés, outils utilisés, durée, taille des communautés…",
        type: "textarea",
        required: true,
        maxLength: 800,
      },
    ],
  },
  {
    id: "reseaux",
    num: "02",
    title: "Réseaux sociaux",
    tagline: "Faire connaître Cantale hors du jeu",
    description:
      "Alimenter TikTok, Instagram, YouTube et X : formats courts, annonces, storytelling de factions. Tu transformes la vie du serveur en contenu qui donne envie.",
    fields: [
      {
        id: "reseaux_geres",
        label: "Réseaux que tu sais gérer",
        placeholder: "Ex. TikTok, Instagram Reels, YouTube Shorts…",
        type: "text",
        required: true,
        maxLength: 120,
      },
      {
        id: "stats",
        label: "Statistiques",
        placeholder: "Ex. 12k abonnés TikTok, 40k vues moyennes, compte géré pour…",
        type: "text",
        required: true,
        maxLength: 200,
      },
      {
        id: "exemples",
        label: "Contenus déjà produits",
        placeholder: "Liens vers tes vidéos, posts ou comptes gérés (un par ligne).",
        type: "textarea",
        required: true,
        maxLength: 800,
      },
    ],
  },
  {
    id: "graphisme",
    num: "03",
    title: "Graphisme",
    tagline: "Donner un visage au registre",
    description:
      "Bannières, miniatures, logos, visuels d'events et habillage du site : tu prolonges la direction artistique « Le Registre » — sombre, chaude, exigeante.",
    fields: [
      {
        id: "portfolio",
        label: "Portfolio",
        placeholder: "https://… (Behance, Drive, site perso)",
        type: "url",
        required: true,
        maxLength: 200,
      },
      {
        id: "outils",
        label: "Outils maîtrisés",
        placeholder: "Ex. Photoshop, Illustrator, Figma, After Effects…",
        type: "text",
        required: true,
        maxLength: 120,
      },
      {
        id: "specialite",
        label: "Spécialité",
        placeholder: "Ex. miniatures YouTube, logos, affiches d'event, UI…",
        type: "text",
        required: false,
        maxLength: 120,
      },
    ],
  },
  {
    id: "build3d",
    num: "04",
    title: "3D / Build",
    tagline: "Façonner le monde et ses items",
    description:
      "Builds d'events, décors de zones contestées, modèles 3D d'items forgés : tu construis ce que les joueurs voient, explorent et s'arrachent.",
    fields: [
      {
        id: "portfolio",
        label: "Portfolio",
        placeholder: "https://… (PlanetMinecraft, Drive, captures)",
        type: "url",
        required: true,
        maxLength: 200,
      },
      {
        id: "type_creations",
        label: "Ce que tu construis",
        placeholder: "Ex. builds organiques, modèles Blockbench, items 3D, hubs…",
        type: "text",
        required: true,
        maxLength: 120,
      },
      {
        id: "outils",
        label: "Outils",
        placeholder: "Ex. Blockbench, WorldEdit, Litematica, Axiom…",
        type: "text",
        required: false,
        maxLength: 120,
      },
    ],
  },
  {
    id: "developpement",
    num: "05",
    title: "Développement",
    tagline: "Écrire les systèmes du serveur",
    description:
      "Plugins Paper en Java, outils web, intégration Discord : tu rejoins l'équipe qui code le cœur de Cantale — anti-cheat, items forgés, économie.",
    fields: [
      {
        id: "stack",
        label: "Stack technique",
        placeholder: "Ex. Java 21, Paper API, TypeScript, Next.js, MySQL, Redis…",
        type: "text",
        required: true,
        maxLength: 200,
      },
      {
        id: "experience_dev",
        label: "Expérience",
        placeholder: "Ex. 3 ans de Java, plugins Paper publiés, contributions open source…",
        type: "text",
        required: true,
        maxLength: 200,
      },
      {
        id: "projets",
        label: "Projets & code public",
        placeholder: "Liens GitHub, plugins publiés, projets marquants (un par ligne).",
        type: "textarea",
        required: false,
        maxLength: 800,
      },
    ],
  },
  {
    id: "animation",
    num: "06",
    title: "Animation / Communauté",
    tagline: "Faire vivre le serveur entre les guerres",
    description:
      "Events hebdomadaires, tournois, défis de factions, vie du Discord : tu crées les rendez-vous qui font revenir les joueurs, semaine après semaine.",
    fields: [
      {
        id: "idees_events",
        label: "Events que tu imaginerais sur Cantale",
        placeholder: "Décris deux ou trois formats d'events adaptés à un PvP factions trois vies.",
        type: "textarea",
        required: true,
        maxLength: 800,
      },
      {
        id: "disponibilites",
        label: "Disponibilités",
        placeholder: "Ex. soirs de semaine, samedi après-midi…",
        type: "text",
        required: true,
        maxLength: 120,
      },
      {
        id: "experience_communaute",
        label: "Expérience communautaire",
        placeholder: "Communautés animées, events organisés, taille, fréquence…",
        type: "textarea",
        required: false,
        maxLength: 800,
      },
    ],
  },
];

export function getRoleById(id: string): RoleDefinition | undefined {
  return RECRUITMENT_ROLES.find((role) => role.id === id);
}

export const EXPERIENCE_LEVELS = [
  { id: "debutant", label: "Débutant", hint: "Je découvre, je veux apprendre" },
  { id: "intermediaire", label: "Intermédiaire", hint: "J'ai déjà contribué quelque part" },
  { id: "confirme", label: "Confirmé", hint: "J'ai tenu un rôle comparable" },
  { id: "expert", label: "Expert", hint: "J'ai dirigé ou formé d'autres membres" },
] as const;

export type ExperienceLevelId = (typeof EXPERIENCE_LEVELS)[number]["id"];

export function getExperienceLabel(id: string): string {
  return EXPERIENCE_LEVELS.find((level) => level.id === id)?.label ?? id;
}

export const MOTIVATION_MIN_LENGTH = 30;
export const MOTIVATION_MAX_LENGTH = 2000;
export const LINK_MAX_LENGTH = 200;
export const MINECRAFT_PSEUDO_PATTERN = /^[A-Za-z0-9_]{3,16}$/;
