/**
 * Contenu du wiki CANTALE — source de vérité typée.
 * Rédigé à partir de COMMANDS.md, docs/ et du plugin (plugin.yml, commandes).
 * Les pages du wiki rendent ces données de façon générique.
 */

export interface WikiCommand {
  /** Syntaxe exacte, ex. "/f create <nom>" */
  syntax: string;
  description: string;
  /** Alias, permission, cooldown… affiché en label technique. */
  note?: string;
}

export interface WikiSection {
  /** Ancre unique dans l'article (sommaire). */
  id: string;
  title: string;
  paragraphs?: string[];
  list?: string[];
  commands?: WikiCommand[];
}

export interface WikiArticle {
  slug: string;
  title: string;
  summary: string;
  /** Mis en avant sur l'accueil du wiki. */
  featured?: boolean;
  /** Slugs d'articles liés (toutes catégories confondues). */
  related?: string[];
  sections: WikiSection[];
}

export interface WikiCategory {
  slug: string;
  name: string;
  tagline: string;
  description: string;
  articles: WikiArticle[];
}

export const WIKI_CATEGORIES: WikiCategory[] = [
  {
    slug: "commandes",
    name: "Commandes",
    tagline: "Le réflexe du clavier",
    description:
      "Toutes les commandes accessibles en jeu : informations, téléportations, grades et permissions.",
    articles: [
      {
        slug: "commandes-joueur",
        title: "Commandes joueur",
        summary:
          "Les commandes de base accessibles à tous : informations du serveur, profil, classements et récompense quotidienne.",
        featured: true,
        related: ["teleportation", "grades-permissions", "trois-vies"],
        sections: [
          {
            id: "informations",
            title: "Informations & profil",
            paragraphs: [
              "Ces commandes ne demandent aucune permission particulière : elles sont disponibles dès la première connexion.",
            ],
            commands: [
              {
                syntax: "/cantale",
                description:
                  "Affiche les informations du serveur et les commandes utiles.",
              },
              {
                syntax: "/profile [joueur]",
                description:
                  "Affiche le profil d'un joueur : vies, tags, réglages et onglet statistiques.",
              },
              {
                syntax: "/day",
                description: "Affiche le jour et l'heure Minecraft.",
              },
              {
                syntax: "/bvn <pseudo>",
                description: "Souhaite la bienvenue à un nouveau joueur.",
              },
              {
                syntax: "/lastdeath [joueur]",
                description:
                  "Affiche les informations de la dernière mort d'un joueur.",
              },
            ],
          },
          {
            id: "classements",
            title: "Classements & listes",
            commands: [
              {
                syntax: "/leaderboard <type> [limite]",
                description:
                  "Affiche les classements du serveur (dont le classement des réactions chat).",
                note: "Alias : /top, /lb, /classement",
              },
              {
                syntax: "/listemorts",
                description:
                  "Affiche La Liste : les joueurs morts définitivement, le mémorial des bannis.",
                note: "Alias : /list, /morts, /bans",
              },
              {
                syntax: "/events",
                description:
                  "Liste les événements actifs et permet de s'y téléporter.",
              },
            ],
          },
          {
            id: "quotidien",
            title: "Récompense quotidienne",
            paragraphs: [
              "Une fois par jour, la récompense quotidienne verse des Cantox : 1 000 de base, avec un bonus croissant selon ton grade. La récompense est synchronisée entre Minecraft et Discord.",
            ],
            commands: [
              {
                syntax: "/daily",
                description: "Réclame la récompense quotidienne.",
                note: "Alias : /journalier",
              },
            ],
          },
        ],
      },
      {
        slug: "teleportation",
        title: "Téléportation",
        summary:
          "Spawn, homes, warps et téléportation aléatoire : délais, annulation et préchargement des chunks.",
        related: ["commandes-joueur", "vie-de-faction"],
        sections: [
          {
            id: "fonctionnement",
            title: "Comment ça marche",
            paragraphs: [
              "Les téléportations (spawn, warp, home, home de faction) respectent un délai avant le départ. Si tu bouges ou subis des dégâts pendant le compte à rebours, la téléportation est annulée.",
              "Pour éviter les à-coups, le chunk de destination est préchargé environ une seconde avant l'arrivée. La téléportation aléatoire génère ses chunks de façon asynchrone pour ne pas faire freezer le serveur.",
            ],
          },
          {
            id: "commandes",
            title: "Commandes",
            commands: [
              {
                syntax: "/spawn",
                description: "Téléporte au spawn du serveur.",
              },
              {
                syntax: "/rtp",
                description:
                  "Téléportation aléatoire dans le monde, pour démarrer loin du spawn.",
              },
              {
                syntax: "/home [nom]",
                description:
                  "Téléporte au home personnel demandé ; sans nom, gère tes homes.",
              },
              {
                syntax: "/home set <nom>",
                description: "Enregistre ta position actuelle comme home.",
              },
              {
                syntax: "/home delete <nom>",
                description: "Supprime un home.",
                note: "Alias : /home del",
              },
              {
                syntax: "/warp [nom]",
                description:
                  "Téléporte à un warp public ; sans nom, liste les warps disponibles.",
              },
              {
                syntax: "/warp set <nom> | /warp delete <nom> | /warp toggle",
                description: "Gestion des warps publics.",
              },
            ],
          },
          {
            id: "bon-a-savoir",
            title: "Bon à savoir",
            list: [
              "Les grades Admin et Owner ne subissent aucun cooldown de téléportation et disposent de homes illimités.",
              "Le nombre de homes personnels dépend du grade.",
              "Les zones protégées (spawn, warps) ne peuvent pas être claim : inutile d'y poser un home stratégique.",
            ],
          },
        ],
      },
      {
        slug: "grades-permissions",
        title: "Grades & permissions",
        summary:
          "Aventurier, VIP, Chèvre : avantages par grade, anti-AFK, et correspondance avec les permissions techniques.",
        related: ["coffres-inventaires", "recompenses-regulieres", "commandes-joueur"],
        sections: [
          {
            id: "grades",
            title: "Les grades",
            paragraphs: [
              "Trois grades de progression rythment la vie sur CANTALE, au-dessus du grade Joueur de base. Le staff dispose de ses propres grades : Modérateur, Admin et Owner.",
            ],
            list: [
              "Aventurier — premier palier : anti-AFK porté à 30 minutes, bonus quotidien de Cantox.",
              "VIP — anti-AFK 1 heure, /feed (cooldown 3 minutes), second coffre privé /pc2, bonus quotidien supérieur.",
              "Chèvre — le grade ultime : anti-AFK illimité, /feed (cooldown 1 minute), /pc2 et /pc3, bonus quotidien maximal.",
              "Modérateur — outils de modération : /moderation, /vanish, /tag, /modhelp.",
              "Admin & Owner — mêmes avantages : vol, aucun cooldown de téléportation, homes illimités, vies illimitées.",
            ],
          },
          {
            id: "chevre-par-le-jeu",
            title: "Le grade Chèvre par le jeu",
            paragraphs: [
              "Le grade Chèvre ne s'achète pas seulement : il s'obtient aussi en atteignant la caisse Légendaire depuis une caisse Vote, étape par étape. Voir l'article Caisses & clés.",
            ],
          },
          {
            id: "permissions",
            title: "Permissions techniques",
            paragraphs: [
              "Les commandes /rank et /perm sont synchronisées : modifier l'une met à jour l'autre. La correspondance par rôle est la suivante.",
            ],
            list: [
              "cantale.admin — administration complète : grades, optimisation, caisses, items custom, anti-cheat.",
              "cantale.moderator — outils de modération non-OP.",
              "cantale.givevie — autorise /givevie.",
              "cantale.feed — autorise /feed sans grade.",
            ],
            commands: [
              {
                syntax: "/feed",
                description:
                  "Restaure la faim et la saturation. Réservé au grade VIP et au-delà.",
                note: "Cooldown : 3 min (VIP), 1 min (Chèvre)",
              },
            ],
          },
        ],
      },
    ],
  },
  {
    slug: "factions",
    name: "Factions",
    tagline: "Le fer seul, la bannière ensemble",
    description:
      "Création, claims, pouvoir, chat privé et banque commune : la vie de faction de A à Z.",
    articles: [
      {
        slug: "creer-gerer-faction",
        title: "Créer & gérer sa faction",
        summary:
          "Création, invitations, rangs et gestion des membres : tout le cycle de vie d'une faction.",
        featured: true,
        related: ["claims-territoire", "vie-de-faction", "events-faction"],
        sections: [
          {
            id: "creation",
            title: "Créer sa faction",
            paragraphs: [
              "La création est immédiate mais exigeante : /f create revendique automatiquement le chunk où tu te tiens et y place le spawn de faction. Impossible dans une zone protégée (spawn, warp) ou sur un chunk déjà claim.",
              "Un tag unique est généré à partir du nom choisi. La création est annoncée sur le Discord du serveur.",
            ],
            commands: [
              {
                syntax: "/f",
                description: "Ouvre le menu de faction.",
                note: "Alias : /faction",
              },
              {
                syntax: "/f create <nom>",
                description:
                  "Crée une faction, claim le chunk actuel et pose le spawn de faction à ta position.",
              },
              {
                syntax: "/f info [nom]",
                description:
                  "Affiche les infos d'une faction : tag, chef, membres, claims, pouvoir.",
              },
              {
                syntax: "/f list",
                description: "Liste les factions du serveur.",
              },
            ],
          },
          {
            id: "membres",
            title: "Invitations & membres",
            paragraphs: [
              "On ne rejoint une faction que sur invitation : l'invitation expire au bout de 5 minutes. Les rangs internes sont, du plus bas au plus haut : Recrue, Membre, Vétéran, Officier — le chef reste au-dessus de tous.",
            ],
            commands: [
              {
                syntax: "/f invite <pseudo>",
                description: "Invite un joueur dans ta faction.",
                note: "Invitation valable 5 min",
              },
              {
                syntax: "/f accept",
                description: "Accepte l'invitation reçue.",
              },
              {
                syntax: "/f deny",
                description: "Refuse l'invitation reçue.",
                note: "Alias : /f refuse",
              },
              {
                syntax: "/f leave",
                description: "Quitte ta faction actuelle.",
              },
              {
                syntax: "/f kick <pseudo>",
                description:
                  "Expulse un membre. Impossible d'expulser le chef, ni un membre de rang égal ou supérieur au tien.",
              },
              {
                syntax: "/f members",
                description:
                  "Liste les membres avec leur rang et leur statut en ligne.",
                note: "Alias : /f membres",
              },
              {
                syntax: "/f promote <pseudo>",
                description:
                  "Fait monter un membre d'un grade : Recrue → Membre → Vétéran → Officier.",
                note: "Chef uniquement",
              },
              {
                syntax: "/f demote <pseudo>",
                description: "Rétrograde un membre d'un grade.",
                note: "Chef uniquement",
              },
              {
                syntax: "/f disband",
                description: "Dissout définitivement la faction.",
                note: "Alias : /f delete, /f supprimer",
              },
              {
                syntax: "/f perms [grade]",
                description:
                  "Affiche les permissions par grade de faction (inviter, claim, warps…).",
              },
            ],
          },
          {
            id: "pouvoir",
            title: "Pouvoir & limites",
            paragraphs: [
              "Chaque faction accumule du pouvoir, notamment par les kills de ses membres et les événements. Le pouvoir détermine le nombre maximum de claims et de warps de faction : plus la faction pèse, plus elle s'étend.",
            ],
          },
        ],
      },
      {
        slug: "claims-territoire",
        title: "Claims & territoire",
        summary:
          "Revendiquer des chunks, lire la carte des claims et disparaître des radars avec le mode secret.",
        related: ["creer-gerer-faction", "vie-de-faction", "items-forges"],
        sections: [
          {
            id: "revendiquer",
            title: "Revendiquer un chunk",
            paragraphs: [
              "Le territoire se prend chunk par chunk. Les zones protégées (spawn, warps publics) sont inclaimables, et le nombre de claims est plafonné par le pouvoir de la faction.",
              "Les claims protègent tes constructions : les items forgés eux-mêmes (Pickantaxe, Cantaxe, Multi-Cantool) respectent les claims et ne cassent pas les blocs protégés.",
            ],
            commands: [
              {
                syntax: "/f claim",
                description: "Revendique le chunk actuel pour ta faction.",
              },
              {
                syntax: "/f unclaim",
                description: "Retire le claim du chunk actuel.",
              },
              {
                syntax: "/f autoclaim on|off",
                description:
                  "Revendique automatiquement chaque chunk traversé en marchant.",
              },
            ],
          },
          {
            id: "carte",
            title: "Carte des claims",
            commands: [
              {
                syntax: "/f map",
                description:
                  "Affiche une carte des claims sur 11×11 chunks autour de toi.",
                note: "Cooldown : 30 s",
              },
            ],
          },
          {
            id: "secret",
            title: "Mode secret",
            paragraphs: [
              "Le mode secret cache les claims et le spawn de ta faction aux autres factions pendant une heure — de quoi déplacer une base ou préparer un coup sans laisser de trace.",
            ],
            commands: [
              {
                syntax: "/f secret",
                description:
                  "Active le mode secret pendant 1 h. L'activation est annoncée au serveur.",
                note: "Cooldown : 24 h",
              },
            ],
          },
        ],
      },
      {
        slug: "vie-de-faction",
        title: "Vie de faction",
        summary:
          "Chat privé, spawn et warps de faction, homes partagés et banque commune en Cantox.",
        related: ["creer-gerer-faction", "claims-territoire", "discord-site"],
        sections: [
          {
            id: "chat",
            title: "Chat de faction",
            paragraphs: [
              "Un canal privé relie les membres de la faction, sans polluer le chat global.",
            ],
            commands: [
              {
                syntax: "/f c [message]",
                description:
                  "Sans message : bascule tous tes messages en chat de faction. Avec message : envoie directement dans le chat de faction.",
              },
              {
                syntax: "/fc [message]",
                description: "Raccourci du chat de faction.",
              },
            ],
          },
          {
            id: "deplacements",
            title: "Spawn, homes & warps",
            paragraphs: [
              "Le spawn de faction est posé automatiquement à la création ; seul le chef peut le redéfinir, dans un claim de la faction. Les warps de faction doivent eux aussi être posés dans un claim, et leur nombre dépend du pouvoir.",
            ],
            commands: [
              {
                syntax: "/f spawn",
                description: "Téléporte au spawn de faction.",
                note: "Cooldown : 20 s",
              },
              {
                syntax: "/f go",
                description: "Téléporte au spawn de faction.",
              },
              {
                syntax: "/f setspawn",
                description:
                  "Définit le spawn de faction à ta position.",
                note: "Chef uniquement, dans un claim",
              },
              {
                syntax: "/f home [nom] | /f sethome <nom>",
                description: "Gère les homes de faction.",
              },
              {
                syntax: "/f warp [nom]",
                description:
                  "Sans nom : liste les warps de faction. Avec nom : s'y téléporte.",
              },
              {
                syntax: "/f setwarp <nom>",
                description:
                  "Crée un warp de faction à ta position, dans un claim.",
              },
              {
                syntax: "/f delwarp <nom>",
                description: "Supprime un warp de faction.",
              },
            ],
          },
          {
            id: "banque",
            title: "Banque de faction",
            paragraphs: [
              "La banque commune stocke les Cantox de la faction pour les projets collectifs.",
            ],
            commands: [
              {
                syntax: "/f bank",
                description: "Affiche le solde de la banque de faction.",
              },
              {
                syntax: "/f bank add <montant>",
                description: "Dépose des Cantox dans la banque.",
              },
              {
                syntax: "/f bank take <montant>",
                description: "Retire des Cantox de la banque.",
              },
            ],
          },
          {
            id: "discord",
            title: "Le lien Discord",
            paragraphs: [
              "Créations, arrivées, départs et dissolutions sont annoncés sur le Discord. Les joueurs qui ont lié leur compte reçoivent automatiquement le rôle de leur faction.",
            ],
          },
        ],
      },
    ],
  },
  {
    slug: "economie",
    name: "Économie",
    tagline: "La Cantox ne dort jamais",
    description:
      "Monnaie, hôtel des ventes, échanges entre joueurs, boutique admin et récompenses de vote.",
    articles: [
      {
        slug: "cantox",
        title: "La Cantox",
        summary:
          "La monnaie du serveur : solde, paiements entre joueurs et sources de revenus.",
        featured: true,
        related: ["hotel-des-ventes-echanges", "boutique-admin", "vote"],
        sections: [
          {
            id: "bases",
            title: "Solde & paiements",
            commands: [
              {
                syntax: "/balance [joueur]",
                description: "Affiche le solde Cantox, le tien ou celui d'un autre joueur.",
                note: "Alias : /bal, /money",
              },
              {
                syntax: "/pay <joueur> <montant>",
                description: "Paie un joueur en Cantox.",
              },
            ],
          },
          {
            id: "gagner",
            title: "Gagner des Cantox",
            paragraphs: [
              "La Cantox se gagne à la sueur. Ton solde s'affiche en permanence dans la bossbar d'infos (désactivable depuis /profile).",
            ],
            list: [
              "Vendre des ressources à la boutique admin (/shop).",
              "Vendre aux autres joueurs à l'hôtel des ventes (/ah).",
              "Réagir le premier aux réactions chat : 200 à 500 Cantox.",
              "Briller dans les événements de faction : pouvoir et Cantox pour le top 5.",
              "Réclamer la récompense quotidienne (/daily).",
              "Abattre un joueur wanted pour empocher sa prime.",
            ],
          },
          {
            id: "depenser",
            title: "Dépenser des Cantox",
            paragraphs: [
              "La boutique admin sert de plancher de prix et de puits économique : les Cantox dépensées au /shop sortent de la circulation. Les primes wanted, l'hôtel des ventes et les échanges font circuler le reste entre joueurs.",
            ],
          },
        ],
      },
      {
        slug: "hotel-des-ventes-echanges",
        title: "Hôtel des ventes & échanges",
        summary:
          "Vendre aux enchères à tout le serveur ou trader en face à face, sans intermédiaire.",
        related: ["cantox", "boutique-admin"],
        sections: [
          {
            id: "hotel-des-ventes",
            title: "Hôtel des ventes",
            paragraphs: [
              "L'hôtel des ventes met tes items en vitrine pour tout le serveur : les acheteurs paient en Cantox.",
            ],
            commands: [
              {
                syntax: "/ah",
                description: "Ouvre l'hôtel des ventes.",
                note: "Alias : /auction",
              },
            ],
          },
          {
            id: "echanges",
            title: "Échanges entre joueurs",
            paragraphs: [
              "Pour un échange direct, la commande /trade ouvre une interface sécurisée : les deux parties posent leurs items et valident.",
            ],
            commands: [
              {
                syntax: "/trade <joueur>",
                description: "Propose un échange à un joueur.",
                note: "Alias : /trades",
              },
              {
                syntax: "/trade accept",
                description: "Accepte la demande d'échange reçue.",
              },
              {
                syntax: "/trade decline",
                description: "Refuse la demande d'échange reçue.",
              },
            ],
          },
        ],
      },
      {
        slug: "boutique-admin",
        title: "Boutique admin",
        summary:
          "Le /shop : commerce avec le serveur — achat clic gauche, vente clic droit, plafonds quotidiens.",
        related: ["cantox", "hotel-des-ventes-echanges"],
        sections: [
          {
            id: "utilisation",
            title: "Utilisation",
            paragraphs: [
              "La boutique admin est organisée en catégories paginées (minerais, bois, agriculture, guerre & PvP, Nether & End…).",
            ],
            commands: [
              {
                syntax: "/shop",
                description: "Ouvre la boutique admin.",
                note: "Alias : /adminshop, /boutique",
              },
            ],
            list: [
              "Clic gauche : acheter.",
              "Clic droit : vendre.",
              "Shift : acheter ou vendre par 64 / tout le stock.",
            ],
          },
          {
            id: "prix",
            title: "Prix & limites",
            paragraphs: [
              "Les prix sont pensés comme un sink : les ventes de farm basique (agriculture, laines, drops de mobs) sont plafonnées à 1 Cantox, et les prix d'achat sont majorés — doublés sur la plupart des catégories, multipliés par 12 sur la catégorie Guerre & PvP (TNT, obsidienne, boucliers, lits…).",
            ],
            list: [
              "Netherite, shulker et cristaux de l'End : prix d'achat massifs et plafond d'achat quotidien, remis à zéro à minuit.",
              "Les hoppers ne peuvent pas être vendus à la boutique.",
              "Les minerais (charbon à émeraude) conservent leurs prix d'origine.",
            ],
          },
        ],
      },
      {
        slug: "vote",
        title: "Vote & récompenses",
        summary:
          "Voter rapporte des Cadeaux du Roi : 1 à 3 caisses selon le site, streaks, Vote Party et classement mensuel.",
        related: ["caisses-cles", "cantox", "recompenses-regulieres"],
        sections: [
          {
            id: "voter",
            title: "Voter",
            paragraphs: [
              "Chaque site de vote a son propre cooldown. Si tu votes en étant hors-ligne, la récompense est mise de côté et délivrée à ta prochaine connexion — ou via /vote claim.",
            ],
            commands: [
              {
                syntax: "/vote",
                description: "Liste les sites de vote et leurs récompenses.",
              },
              {
                syntax: "/vote claim",
                description: "Récupère les récompenses reçues hors-ligne.",
              },
              {
                syntax: "/vote stats",
                description: "Affiche tes statistiques de vote et ta série.",
              },
              {
                syntax: "/vote top",
                description: "Affiche le classement des voteurs.",
              },
              {
                syntax: "/vote help",
                description: "Affiche l'aide du système de vote.",
              },
            ],
          },
          {
            id: "recompenses",
            title: "Récompenses",
            paragraphs: [
              "Chaque vote rapporte des Cadeaux du Roi, la caisse Vote du serveur. Le nombre dépend du cooldown du site :",
            ],
            list: [
              "Site à cooldown 24 h : 3 Cadeaux du Roi.",
              "Site à cooldown 3 h : 2 Cadeaux du Roi.",
              "Site à cooldown 1 h : 1 Cadeau du Roi.",
            ],
          },
          {
            id: "bon-a-savoir",
            title: "Bon à savoir",
            list: [
              "Anti-abus : un cooldown par IP empêche les votes multiples.",
              "Vote Party, paliers de votes, classement mensuel et rappels de vote rythment le système.",
              "Les Cadeaux du Roi s'ouvrent dans la boîte aux lettres du spawn — voir l'article Caisses & clés.",
            ],
          },
        ],
      },
    ],
  },
  {
    slug: "combat",
    name: "Combat & Vies",
    tagline: "Trois vies, pas une de plus",
    description:
      "Le système hardcore des trois vies, le bannissement, les dons de vies et les primes wanted.",
    articles: [
      {
        slug: "trois-vies",
        title: "Le système des trois vies",
        summary:
          "Trois encoches, zéro pitié : morts, bannissement définitif, dons de vies et déco combat.",
        featured: true,
        related: ["primes-wanted", "commandes-joueur"],
        sections: [
          {
            id: "regles",
            title: "Les règles",
            paragraphs: [
              "Ici, la mort n'est pas un retour au spawn. Chaque joueur est forgé avec trois encoches — trois vies. Perds-les toutes et le registre se ferme : bannissement définitif, par nom et par IP. Ton nom rejoint La Liste, le mémorial des bannis.",
            ],
            list: [
              "Chaque mort retire 1 vie, en PvP comme en PvE.",
              "À 0 vie : bannissement définitif du serveur.",
              "Se déconnecter en plein combat retire 1 vie, sans exception — la fuite ne paie pas.",
              "Le stock de vies est plafonné à 10.",
            ],
          },
          {
            id: "etats",
            title: "Les quatre états",
            list: [
              "3/3 — En vie : toutes tes encoches brûlent.",
              "2/3 — Entamé : la première entaille.",
              "1/3 — Marqué : plus qu'une vie, chaque fight est peut-être le dernier.",
              "0/3 — Banni : le registre se ferme.",
            ],
          },
          {
            id: "commandes",
            title: "Commandes",
            commands: [
              {
                syntax: "/dropvie",
                description: "Sacrifie volontairement une vie.",
              },
              {
                syntax: "/givevie <joueur>",
                description:
                  "Donne une de tes vies à un joueur — il faut t'en garder plus d'une.",
                note: "Permission : cantale.givevie",
              },
              {
                syntax: "/lastdeath [joueur]",
                description: "Affiche les informations de la dernière mort.",
              },
              {
                syntax: "/listemorts",
                description: "Affiche La Liste des joueurs bannis.",
                note: "Alias : /list, /morts, /bans",
              },
            ],
          },
          {
            id: "suivi",
            title: "Suivre ses vies",
            paragraphs: [
              "Tes vies sont visibles dans la bossbar d'infos et dans ton /profile. Les admins ont des vies illimitées — mais une déco combat leur coûte quand même une vie, la règle est la même pour tous.",
            ],
          },
        ],
      },
      {
        slug: "primes-wanted",
        title: "Primes wanted",
        summary:
          "Mets la tête d'un joueur à prix : le chasseur qui l'abat empoche la prime en Cantox.",
        related: ["trois-vies", "cantox"],
        sections: [
          {
            id: "fonctionnement",
            title: "Fonctionnement",
            paragraphs: [
              "Une prime est posée en Cantox, avec une raison affichée au grand jour. Le chasseur qui tue la cible reçoit la prime. La cible voit sa tête mise à prix dans sa bossbar d'infos — impossible de l'ignorer.",
            ],
          },
          {
            id: "commandes",
            title: "Commandes",
            commands: [
              {
                syntax: "/wanted",
                description: "Ouvre la liste des primes actives.",
                note: "Alias : /prime, /primes",
              },
              {
                syntax: "/wanted list",
                description: "Affiche la liste des primes actives.",
              },
              {
                syntax: "/wanted add <joueur> <prix> <raison>",
                description: "Met une prime en Cantox sur la tête d'un joueur.",
              },
              {
                syntax: "/wanted remove <joueur> [raison]",
                description: "Retire la prime active sur un joueur.",
              },
            ],
          },
        ],
      },
    ],
  },
  {
    slug: "evenements",
    name: "Événements",
    tagline: "Le serveur s'embrase",
    description:
      "Événements de faction, réactions chat et récompenses régulières : le calendrier du serveur.",
    articles: [
      {
        slug: "events-faction",
        title: "Événements de faction",
        summary:
          "Récolte, minage et PvP : des événements d'une heure qui rapportent pouvoir et Cantox à ta faction.",
        featured: true,
        related: ["reactions-chat", "recompenses-regulieres", "creer-gerer-faction"],
        sections: [
          {
            id: "types",
            title: "Les trois types",
            list: [
              "Récolte (HARVEST) — une ressource agricole tirée au sort, ex. « Récolte de blé » : dépose ta récolte via /recolte.",
              "Minage (MINING) — un minerai cible tiré au sort, ex. « Minage de diamant ».",
              "PvP — la faction qui domine les combats l'emporte.",
            ],
            paragraphs: [
              "Chaque événement cible une seule ressource, jamais tout le pool : inutile de stocker à l'avance, il faut produire pendant l'événement.",
            ],
          },
          {
            id: "deroulement",
            title: "Déroulement",
            paragraphs: [
              "Trois à quatre événements par semaine, d'une heure chacun, programmés entre 14 h et 22 h (heure de Paris). Jamais plus d'un par jour, et au moins huit heures entre deux événements : chaque rendez-vous compte.",
              "Un scoreboard latéral suit le classement en direct. La commande /events liste les événements actifs et permet de s'y téléporter.",
            ],
            commands: [
              {
                syntax: "/events",
                description:
                  "Liste les événements actifs et permet de s'y téléporter.",
              },
              {
                syntax: "/recolte",
                description:
                  "Ouvre l'interface de dépôt pendant un événement Récolte.",
                note: "Alias : /harvest, /depositrecolte",
              },
            ],
          },
          {
            id: "recompenses",
            title: "Récompenses",
            paragraphs: [
              "À la fin de l'événement, le top 5 des factions est récompensé en pouvoir et en Cantox. La bossbar d'infos affiche l'événement en cours tant qu'il est actif.",
            ],
          },
        ],
      },
      {
        slug: "reactions-chat",
        title: "Réactions chat",
        summary:
          "Mot mélangé ou bloc à casser : le plus rapide gagne 200 à 500 Cantox.",
        related: ["events-faction", "cantox"],
        sections: [
          {
            id: "types",
            title: "Les deux épreuves",
            list: [
              "Mot mélangé — un mot français brouillé apparaît dans le chat : le premier à l'écrire correctement gagne.",
              "Premier bloc — un bloc est annoncé : le premier à en casser un gagne.",
            ],
          },
          {
            id: "regles",
            title: "Règles & récompenses",
            list: [
              "Huit à neuf réactions par jour maximum.",
              "Chaque victoire rapporte 200 à 500 Cantox.",
              "Un classement dédié existe en jeu (/leaderboard chat) et sur Discord.",
              "La bossbar d'infos signale une réaction en cours.",
            ],
          },
        ],
      },
      {
        slug: "recompenses-regulieres",
        title: "Récompenses régulières",
        summary:
          "Récompense quotidienne, drop de clé hebdomadaire et rappels de vote : le revenu du joueur assidu.",
        related: ["vote", "caisses-cles", "grades-permissions"],
        sections: [
          {
            id: "daily",
            title: "Récompense quotidienne",
            paragraphs: [
              "Chaque jour, /daily verse 1 000 Cantox de base, plus un bonus selon ton grade. La récompense est synchronisée entre Minecraft et Discord.",
            ],
            commands: [
              {
                syntax: "/daily",
                description: "Réclame la récompense quotidienne.",
                note: "Alias : /journalier",
              },
            ],
          },
          {
            id: "drop-cle",
            title: "Drop de clé hebdomadaire",
            paragraphs: [
              "Chaque semaine, un joueur connecté est tiré au sort et reçoit une clé Rare, Épique ou Mythique. Le drop est annoncé à tout le serveur.",
            ],
          },
        ],
      },
    ],
  },
  {
    slug: "items",
    name: "Items",
    tagline: "Forgés pour durer",
    description:
      "Items forgés, armure du Garde et caisses : l'équipement qui n'existe que sur CANTALE.",
    articles: [
      {
        slug: "items-forges",
        title: "Items forgés",
        summary:
          "Pickantaxe, Cantaxe, Multi-Cantool, Cantalame : les outils qui n'existent que sur CANTALE.",
        related: ["armure-du-garde", "caisses-cles", "claims-territoire"],
        sections: [
          {
            id: "raretes",
            title: "Les quatre raretés",
            list: [
              "Rare — Pickantaxe : la pioche forgée.",
              "Épique — Cantaxe : la hache forgée.",
              "Mythique — Multi-Cantool : l'outil universel.",
              "Légendaire — Cantalame : l'épée du registre.",
            ],
          },
          {
            id: "outils",
            title: "Ce qu'ils font",
            paragraphs: [
              "Le Multi-Cantool adapte automatiquement sa vitesse au bloc miné, casse en zone 3×3 et abat les arbres entiers. Comme la Pickantaxe et la Cantaxe, il respecte les claims : impossible de s'en servir pour grief un territoire revendiqué.",
              "Ces items nécessitent le resource pack du serveur pour afficher leurs apparences forgées.",
            ],
          },
          {
            id: "obtention",
            title: "Obtention",
            paragraphs: [
              "Les items forgés s'obtiennent dans les caisses — les tables de butin favorisent les outils, les ressources et la nourriture. Le staff peut aussi les distribuer via /customitem <type>.",
            ],
          },
        ],
      },
      {
        slug: "armure-du-garde",
        title: "Armure du Garde",
        summary:
          "Quatre pièces en netherite sur-enchantées, avec un bonus de set cumulatif.",
        related: ["items-forges", "events-faction"],
        sections: [
          {
            id: "pieces",
            title: "Les quatre pièces",
            paragraphs: [
              "Casque, plastron, jambières et bottes du Garde : du netherite poussé au-delà des limites vanilla — Protection 9, Thorns 5, Solidité 10, Raccommodage, et enchantements supplémentaires.",
            ],
          },
          {
            id: "bonus",
            title: "Bonus de set",
            paragraphs: [
              "Chaque pièce équipée apporte 25 % du bonus de set. L'armure complète confère +12 points de vie, +30 % de vitesse et +25 % de hauteur de saut.",
            ],
          },
          {
            id: "obtention",
            title: "Obtention",
            paragraphs: [
              "L'armure du Garde est distribuée par le staff via /customitem. Elle nécessite le resource pack du serveur pour ses apparences.",
            ],
          },
        ],
      },
      {
        slug: "caisses-cles",
        title: "Caisses & clés",
        summary:
          "Cinq caisses, cinq rituels : boîte aux lettres, coffre du spawn, autel, fontaine et ticket Discord.",
        featured: true,
        related: ["vote", "items-forges", "coffres-inventaires"],
        sections: [
          {
            id: "types",
            title: "Les cinq caisses",
            paragraphs: [
              "Chaque caisse a son item, son rituel et son lieu. On ne clique pas sur une caisse Cantale : on la vit.",
            ],
            list: [
              "Vote — Cadeau du Roi : à déposer dans la boîte aux lettres du spawn (tonneau ou métier à tisser).",
              "Rare — Trésor Public : à ouvrir au coffre configuré au spawn.",
              "Épique — Médaille du Tournoi : à présenter sur l'autel (beacon ou table d'enchantement).",
              "Mythique — Pièce Mythique : à jeter (touche Q) dans l'eau de la fontaine.",
              "Légendaire — Ticket Légendaire : ouvre automatiquement un ticket Discord numéroté.",
            ],
          },
          {
            id: "regles",
            title: "Bon à savoir",
            list: [
              "Si ton inventaire déborde, le surplus de récompenses est stocké dans ton coffre privé (/pc).",
              "Seules les ouvertures Mythique et Légendaire sont annoncées publiquement.",
              "Les caisses se gagnent par le vote, le drop de clé hebdomadaire et les événements.",
              "Le grade Chèvre s'obtient en atteignant la caisse Légendaire depuis une caisse Vote, étape par étape.",
            ],
          },
          {
            id: "admin",
            title: "Côté staff",
            commands: [
              {
                syntax: "/crate give <joueur> <vote|rare|epic|mythic|legendary> [quantité]",
                description: "Donne une caisse à un joueur.",
                note: "Permission : cantale.admin",
              },
              {
                syntax: "/crate reload",
                description: "Recharge la configuration des emplacements.",
                note: "Permission : cantale.admin",
              },
            ],
          },
        ],
      },
    ],
  },
  {
    slug: "autre",
    name: "Autre",
    tagline: "Tout le reste du registre",
    description:
      "Coffres virtuels, liaison Discord et site, profil, tags et bossbar : les systèmes transverses.",
    articles: [
      {
        slug: "coffres-inventaires",
        title: "Coffres & inventaires",
        summary:
          "Coffres privés virtuels et Ender Chest : ton butin te suit partout, sauvegardé en base.",
        related: ["caisses-cles", "grades-permissions"],
        sections: [
          {
            id: "coffres",
            title: "Coffres privés",
            paragraphs: [
              "Les coffres privés sont virtuels : leur contenu est sauvegardé en base de données et mis en cache en mémoire pour éviter toute perte. Le surplus des récompenses de caisses y est stocké automatiquement.",
            ],
            commands: [
              {
                syntax: "/pc",
                description: "Ouvre ton coffre privé virtuel.",
              },
              {
                syntax: "/pc2",
                description: "Ouvre le second coffre privé.",
                note: "Grades VIP et Chèvre",
              },
              {
                syntax: "/pc3",
                description: "Ouvre le troisième coffre privé.",
                note: "Grade Chèvre",
              },
              {
                syntax: "/ec",
                description: "Ouvre l'Ender Chest.",
              },
            ],
          },
        ],
      },
      {
        slug: "discord-site",
        title: "Discord & site",
        summary:
          "Lie tes comptes Discord et site web : rôles synchronisés, tickets et passerelle de chat.",
        related: ["profil-tags", "vie-de-faction"],
        sections: [
          {
            id: "discord",
            title: "Liaison Discord",
            paragraphs: [
              "La liaison se fait par code : /link génère un code en jeu, à saisir côté Discord. Une fois lié, ton compte reçoit automatiquement le rôle de ta faction, et le chat est relayé entre les deux mondes.",
            ],
            commands: [
              {
                syntax: "/link",
                description: "Génère un code pour lier ton compte Discord.",
              },
              {
                syntax: "/discord <message>",
                description: "Envoie un message sur Discord depuis Minecraft.",
              },
              {
                syntax: "/discord mp <joueur> <message>",
                description:
                  "Envoie un message privé Discord à un joueur, par son nom Discord ou Minecraft.",
              },
            ],
          },
          {
            id: "tickets",
            title: "Tickets",
            paragraphs: [
              "Les tickets passent par le Discord : support dédié, et salon automatique numéroté pour chaque Ticket Légendaire ouvert.",
            ],
          },
          {
            id: "site",
            title: "Liaison au site",
            commands: [
              {
                syntax: "/web link <code>",
                description: "Lie ton compte Minecraft au site Cantale.",
                note: "Alias : /website, /site",
              },
            ],
          },
        ],
      },
      {
        slug: "profil-tags",
        title: "Profil, tags & bossbar",
        summary:
          "/profile : statistiques, tags cosmétiques et réglage de la bossbar d'infos.",
        related: ["discord-site", "commandes-joueur"],
        sections: [
          {
            id: "profil",
            title: "Le profil",
            paragraphs: [
              "Le profil rassemble tout ce qui te définit sur le serveur : vies, tags, réglages, et un onglet statistiques complet — kills, morts, ratio, kill streak, temps de jeu.",
            ],
            commands: [
              {
                syntax: "/profile [joueur]",
                description:
                  "Ouvre ton profil, ou celui d'un autre joueur avec son pseudo.",
              },
            ],
          },
          {
            id: "bossbar",
            title: "La bossbar d'infos",
            paragraphs: [
              "Une barre personnelle et rotative affiche tour à tour : solde Cantox, vies restantes, prime wanted (si tu es recherché), événement de faction en cours, réaction chat active et tag de combat. Elle se désactive depuis /profile.",
            ],
          },
          {
            id: "tags",
            title: "Les tags",
            paragraphs: [
              "Les tags sont des distinctions cosmétiques affichées à côté du pseudo. Quand tu en obtiens un, un message t'invite à l'activer dans /profile. Le staff les gère avec /tag.",
            ],
          },
        ],
      },
    ],
  },
];

export interface WikiArticleRef {
  category: WikiCategory;
  article: WikiArticle;
}

export function getCategory(slug: string): WikiCategory | undefined {
  return WIKI_CATEGORIES.find((category) => category.slug === slug);
}

export function getArticle(
  categorySlug: string,
  articleSlug: string,
): WikiArticleRef | undefined {
  const category = getCategory(categorySlug);
  const article = category?.articles.find((entry) => entry.slug === articleSlug);
  return category && article ? { category, article } : undefined;
}

export function getAllArticles(): WikiArticleRef[] {
  return WIKI_CATEGORIES.flatMap((category) =>
    category.articles.map((article) => ({ category, article })),
  );
}

export function findArticleBySlug(slug: string): WikiArticleRef | undefined {
  return getAllArticles().find(({ article }) => article.slug === slug);
}

export function getFeaturedArticles(): WikiArticleRef[] {
  return getAllArticles().filter(({ article }) => article.featured);
}

export function getRelatedArticles(article: WikiArticle): WikiArticleRef[] {
  return (article.related ?? [])
    .map((slug) => findArticleBySlug(slug))
    .filter((ref): ref is WikiArticleRef => ref !== undefined);
}

export function getArticleHref(ref: WikiArticleRef): string {
  return `/wiki/${ref.category.slug}/${ref.article.slug}`;
}

export interface WikiSearchEntry {
  title: string;
  summary: string;
  categoryName: string;
  href: string;
  /** Titre + résumé + contenu complet, pour la recherche plein texte. */
  text: string;
}

export function getSearchIndex(): WikiSearchEntry[] {
  return getAllArticles().map((ref) => {
    const { category, article } = ref;
    const body = article.sections
      .map((section) =>
        [
          section.title,
          ...(section.paragraphs ?? []),
          ...(section.list ?? []),
          ...(section.commands ?? []).map(
            (command) =>
              `${command.syntax} ${command.description} ${command.note ?? ""}`,
          ),
        ].join(" "),
      )
      .join(" ");
    return {
      title: article.title,
      summary: article.summary,
      categoryName: category.name,
      href: getArticleHref(ref),
      text: `${article.title} ${article.summary} ${body}`,
    };
  });
}
