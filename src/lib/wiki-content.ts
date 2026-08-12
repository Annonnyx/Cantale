/**
 * Contenu du wiki CANTALE — source de vérité typée.
 * Aligné sur le plugin : plugin.yml, package commands/, PlayerRank,
 * RankManager, PrivateChestService, AfkListener, Discord /link, site /connexion.
 * Les pages du wiki rendent ces données de façon générique.
 */

export interface WikiCommand {
  /** Syntaxe exacte, ex. "/f create <nom>" */
  syntax: string;
  description: string;
  /** Alias, permission, cooldown… affiché en label technique. */
  note?: string;
}

export interface WikiTable {
  /** Légende courte au-dessus du tableau. */
  caption?: string;
  headers: string[];
  rows: string[][];
}

export interface WikiSection {
  /** Ancre unique dans l'article (sommaire). */
  id: string;
  title: string;
  paragraphs?: string[];
  list?: string[];
  tables?: WikiTable[];
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
      "Commandes joueur (essentiels hors /f), téléportations avec cooldowns, grades VIP et permissions.",
    articles: [
      {
        slug: "commandes-joueur",
        title: "Commandes joueur",
        summary:
          "Répertoire pratique : qui peut utiliser quoi, à quoi ça sert, cooldowns connus. Les /f détaillés sont dans Factions.",
        featured: true,
        related: [
          "teleportation",
          "grades-permissions",
          "discord-site",
          "creer-gerer-faction",
          "trois-vies",
          "coffres-inventaires",
        ],
        sections: [
          {
            id: "lecture",
            title: "Comment lire cette page",
            paragraphs: [
              "Sauf note contraire, les commandes listées ici sont utilisables par tout joueur (pas de permission dans plugin.yml). Les grades VIP / Chèvre ouvrent des commandes ou lèvent des cooldowns — voir Grades & permissions.",
              "Les sous-commandes de faction (/f …, /fc, /recolte) sont documentées dans la catégorie Factions : pas de doublon ici.",
            ],
          },
          {
            id: "informations",
            title: "Informations & profil",
            commands: [
              {
                syntax: "/cantale",
                description: "Ouvre le menu principal du serveur.",
                note: "Tous les joueurs",
              },
              {
                syntax: "/profile [joueur]",
                description:
                  "Ouvre le profil (vies, tags, réglages, stats). Sans argument : le tien.",
                note: "Tous les joueurs",
              },
              {
                syntax: "/day",
                description: "Affiche le jour et l'heure Minecraft.",
                note: "Tous les joueurs",
              },
              {
                syntax: "/bvn <pseudo>",
                description: "Souhaite la bienvenue à un nouveau joueur.",
                note: "Tous les joueurs",
              },
              {
                syntax: "/lastdeath [joueur]",
                description: "Date, total de morts et coords (monde + X/Y/Z) de la dernière mort.",
                note: "Tous les joueurs · cible online ou offline si connue en BDD",
              },
            ],
          },
          {
            id: "economie-essentiel",
            title: "Économie (essentiel)",
            paragraphs: [
              "Détail des sources et de la boutique : catégorie Économie.",
            ],
            commands: [
              {
                syntax: "/balance",
                description: "Affiche ton solde Cantox.",
                note: "Alias : /bal, /money. /balance <joueur> : cantale.admin.balance",
              },
              {
                syntax: "/pay <joueur> <montant>",
                description: "Transfère des Cantox à un joueur en ligne.",
                note: "Tous les joueurs",
              },
              {
                syntax: "/daily",
                description:
                  "Récompense quotidienne : 1 000 Cantox de base + bonus de grade. Une fois par jour ; aussi sur Discord si compte lié.",
                note: "Alias : /journalier — tous les joueurs",
              },
              {
                syntax: "/ah",
                description: "Hôtel des ventes. Limite de ventes simultanées selon le grade.",
                note: "Alias : /auction — tous les joueurs",
              },
              {
                syntax: "/trade <joueur|accept|decline>",
                description: "Échange d'items entre joueurs.",
                note: "Alias : /trades — tous les joueurs",
              },
              {
                syntax: "/shop [buy|sell] <item> <quantité>",
                description: "Boutique admin (Cantox).",
                note: "Alias : /adminshop, /boutique — tous les joueurs",
              },
              {
                syntax: "/vote [claim|stats|top|help]",
                description: "Sites de vote et récompenses.",
                note: "Tous les joueurs",
              },
            ],
          },
          {
            id: "inventaire",
            title: "Coffres & inventaire",
            paragraphs: [
              "Détail des tailles : Coffres & inventaires. Accès : /pc pour tous ; /pc2 dès VIP ; /pc3 dès Chèvre ; /feed dès VIP.",
            ],
            commands: [
              {
                syntax: "/pc",
                description: "Coffre privé #1 (27 slots Joueur, 54 dès Aventurier).",
                note: "Tous les joueurs",
              },
              {
                syntax: "/pc2",
                description: "Coffre privé #2.",
                note: "VIP+ (ou cantale.admin)",
              },
              {
                syntax: "/pc3",
                description: "Coffre privé #3.",
                note: "Chèvre+ (ou cantale.admin)",
              },
              {
                syntax: "/ec",
                description: "Ender Chest vanilla.",
                note: "Tous les joueurs",
              },
              {
                syntax: "/feed",
                description: "Restaure faim et saturation.",
                note: "VIP+ ou cantale.feed / cantale.admin. Cooldown : 3 min VIP, 1 min Chèvre+ ; aucun si cantale.admin",
              },
            ],
          },
          {
            id: "teleport-rapide",
            title: "Téléportation (aperçu)",
            paragraphs: [
              "Détails (warmup, cooldowns, homes) : article Téléportation.",
            ],
            commands: [
              {
                syntax: "/spawn",
                description: "Téléporte au spawn.",
                note: "Cooldown commande 20 s",
              },
              {
                syntax: "/rtp",
                description: "Téléportation aléatoire (500–5000 blocs, dans la border).",
                note: "Cooldown 2 min Joueur/Aventurier ; aucun VIP+",
              },
              {
                syntax: "/home …",
                description: "Homes personnels (liste, set, delete, téléport).",
                note: "Cooldown téléport 20 s — limite selon le grade",
              },
              {
                syntax: "/warp [nom]",
                description: "Warps publics.",
                note: "Cooldown 20 s. set/delete/toggle : cantale.admin",
              },
              {
                syntax: "/tpa <joueur> · /tpahere <joueur>",
                description: "Demande de TP joueur ↔ joueur.",
                note: "Expire 60 s. /tpyes (/tpaccept) · /tpno (/tpdeny)",
              },
              {
                syntax: "/events",
                description:
                  "Liste les warps d'événement actifs (pas le calendrier faction auto).",
                note: "Tous les joueurs",
              },
            ],
          },
          {
            id: "vies-combat",
            title: "Vies & primes",
            paragraphs: [
              "Mécanique des trois vies : article dédié.",
            ],
            commands: [
              {
                syntax: "/dropvie",
                description: "Sacrifie une vie hardcore.",
                note: "Tous les joueurs",
              },
              {
                syntax: "/givevie <joueur>",
                description: "Donne une vie à un joueur.",
                note: "Permission cantale.givevie (incluse dans cantale.admin)",
              },
              {
                syntax: "/wanted [add|list]",
                description: "Primes wanted.",
                note: "Alias : /prime, /primes — tous les joueurs",
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
                  "Types : kills, deaths, richest, factions, chat_reactions. Limite 1–50 (défaut 10).",
                note: "Alias : /top, /lb, /classement, /classements",
              },
              {
                syntax: "/listemorts",
                description: "Joueurs morts définitivement (La Liste).",
                note: "Alias : /list, /morts, /bans",
              },
            ],
          },
          {
            id: "liaison",
            title: "Discord & site",
            paragraphs: [
              "Procédure complète : Discord & site.",
            ],
            commands: [
              {
                syntax: "/link",
                description:
                  "Génère un code Discord à 6 caractères (clic = copier), valable 10 minutes.",
                note: "Finaliser avec /link sur Discord",
              },
              {
                syntax: "/web",
                description:
                  "Obsolète : affiche le lien vers https://www.cantale.world/connexion (OAuth Discord).",
                note: "Alias : /website, /site — plus de /web link",
              },
              {
                syntax: "/discord <message>",
                description: "Message vers le salon Discord chat.",
                note: "/discord mp <joueur> <message> pour un MP Discord",
              },
            ],
          },
          {
            id: "factions-renvoi",
            title: "Factions",
            paragraphs: [
              "Tout le détail /f (création, claims, banque, homes de faction…) est dans la catégorie Factions.",
            ],
            commands: [
              {
                syntax: "/f",
                description: "Hub des commandes de faction.",
                note: "Alias : /faction — voir wiki Factions",
              },
              {
                syntax: "/fc [message]",
                description: "Chat de faction.",
                note: "Voir Vie de faction",
              },
            ],
          },
        ],
      },
      {
        slug: "teleportation",
        title: "Téléportation",
        summary:
          "Spawn, homes, warps, /rtp et /events : délais, cooldowns par grade et warps d'événement.",
        related: ["commandes-joueur", "grades-permissions", "vie-de-faction", "events-faction"],
        sections: [
          {
            id: "fonctionnement",
            title: "Comment ça marche",
            paragraphs: [
              "Les téléportations (spawn, warp, home, home de faction, /rtp) passent par un délai de 3 secondes pour les grades Joueur et Aventurier. VIP, Chèvre, Modérateur, Admin et Owner partent immédiatement. Si tu bouges d'un bloc ou subis des dégâts pendant le compte à rebours, la téléportation est annulée. Impossible de se téléporter pendant un tag de combat.",
              "Le chunk de destination est préchargé avant l'arrivée. /rtp cherche une position sûre de façon asynchrone.",
            ],
          },
          {
            id: "rtp",
            title: "/rtp — téléportation aléatoire",
            paragraphs: [
              "La commande tire une position dans le même monde, entre environ 500 et 5 000 blocs de ta position actuelle (borné par la world border), sur un sol sûr (pas d'eau, lave, cactus, feu, neige poudreuse, etc.). Jusqu'à 16 tentatives ; si aucune position n'est trouvée, réessaie plus tard.",
            ],
            list: [
              "Cooldown : 2 minutes pour Joueur et Aventurier (le cooldown démarre après une téléportation réussie).",
              "Pas de cooldown /rtp pour VIP, Chèvre, Modérateur, Admin, Owner, ni avec la permission cantale.cooldown.bypass.",
              "Le délai de 3 s avant départ s'applique toujours aux grades Joueur / Aventurier (même règles d'annulation que les autres TP).",
            ],
            commands: [
              {
                syntax: "/rtp",
                description:
                  "Téléportation aléatoire dans ton monde actuel.",
                note: "Cooldown 2 min sauf VIP+",
              },
            ],
          },
          {
            id: "warps",
            title: "Warps publics & /events",
            paragraphs: [
              "Sans argument, /warp (ou /warp list) affiche la liste cliquable des warps. Un clic envoie /warp <nom>. Les warps marqués événement affichent [EVENT] s'ils sont actifs, ou [DÉSACTIVÉ] sinon ; un warp d'événement désactivé refuse la téléportation.",
              "/events ne liste que les warps d'événement actuellement actifs (cliquables). Ce n'est pas le calendrier des événements de faction automatiques (récolte / minage / PvP).",
            ],
            list: [
              "Cooldown /warp : 20 secondes après une téléportation réussie.",
              "Même délai de 3 s (Joueur / Aventurier) et blocage en combat.",
            ],
            commands: [
              {
                syntax: "/warp [nom]",
                description:
                  "Sans nom : liste les warps. Avec nom : s'y téléporte.",
                note: "Cooldown 20 s",
              },
              {
                syntax: "/events",
                description:
                  "Liste les warps d'événement actifs et permet d'y aller en un clic.",
              },
            ],
          },
          {
            id: "commandes",
            title: "Spawn, homes & TPA",
            list: [
              "/spawn et /home <nom> : cooldown commande 20 s après une TP réussie (sauf cantale.cooldown.bypass).",
              "Limite de homes personnels (PlayerRank) : Joueur 3 · Aventurier 5 · VIP 10 · Chèvre / staff 999.",
              "/tpa et /tpahere : demande valable 60 s ; /tpyes (alias /tpaccept) · /tpno (alias /tpdeny).",
            ],
            commands: [
              {
                syntax: "/spawn",
                description: "Téléporte au spawn du monde world.",
                note: "Cooldown 20 s · warmup selon grade",
              },
              {
                syntax: "/home",
                description: "Liste tes homes personnels.",
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
                syntax: "/home <nom>",
                description: "Téléporte au home nommé.",
                note: "Cooldown 20 s · warmup selon grade",
              },
              {
                syntax: "/tpa <joueur>",
                description: "Demande à te téléporter vers un joueur.",
                note: "Expire 60 s",
              },
              {
                syntax: "/tpahere <joueur>",
                description: "Demande à un joueur de venir vers toi.",
                note: "Expire 60 s",
              },
              {
                syntax: "/tpyes",
                description: "Accepte la demande en attente.",
                note: "Alias : /tpaccept",
              },
              {
                syntax: "/tpno",
                description: "Refuse la demande en attente.",
                note: "Alias : /tpdeny",
              },
            ],
          },
          {
            id: "bon-a-savoir",
            title: "Bon à savoir",
            list: [
              "VIP+ : pas de warmup 3 s. Le cooldown 20 s de /spawn /home /warp n'est levé que par cantale.cooldown.bypass (pas automatiquement par Chèvre).",
              "Homes de faction / f spawn : voir Vie de faction.",
              "Zones protégées (spawn, warps) : pas de claim.",
            ],
          },
        ],
      },
      {
        slug: "grades-permissions",
        title: "Grades & permissions",
        summary:
          "Avantages PlayerRank / RankManager : /daily, vies mensuelles, homes, AH, coffres, AFK, /feed, RTP, vol en claim.",
        related: [
          "coffres-inventaires",
          "recompenses-regulieres",
          "commandes-joueur",
          "teleportation",
          "afk-clearlag",
        ],
        sections: [
          {
            id: "tableau",
            title: "Avantages par grade (joueurs)",
            paragraphs: [
              "Sources : PlayerRank, RankManager, PrivateChestService, AfkListener, FeedCommand, RtpCommand, TeleportDelayManager, AuctionManager, HomeManager. Grade de base = Joueur (NONE).",
            ],
            tables: [
              {
                caption: "Bonus et limites",
                headers: [
                  "Grade",
                  "Bonus /daily",
                  "Vies/mois",
                  "Homes",
                  "/ah",
                  "Coffres",
                  "Anti-AFK",
                ],
                rows: [
                  ["Joueur", "+0 (base 1 000)", "0", "3", "3", "/pc 27", "10 min"],
                  ["Aventurier", "+2 500", "1", "5", "5", "/pc 54", "30 min"],
                  ["VIP", "+10 000", "2", "10", "12", "/pc + /pc2 (54)", "1 h"],
                  ["Chèvre", "+100 000", "3", "999", "20", "/pc+/pc2+/pc3", "Illimité"],
                ],
              },
              {
                caption: "Commandes & téléportation",
                headers: ["Grade", "/feed", "/rtp", "Warmup TP", "Vol en claim"],
                rows: [
                  ["Joueur / Aventurier", "Non", "Cooldown 2 min", "3 s", "Non"],
                  ["VIP", "Oui (3 min)", "Sans cooldown", "0", "Non"],
                  ["Chèvre", "Oui (1 min)", "Sans cooldown", "0", "Oui"],
                ],
              },
            ],
          },
          {
            id: "details",
            title: "Précisions",
            list: [
              "Vies mensuelles : items Vie à la connexion, une fois par mois calendaire (RankManager).",
              "/daily (MC ou Discord lié) : 1 000 + dailyCantox. Staff (Modo/Admin/Owner) : bonus grade 0 → 1 000 seulement.",
              "Vol en claim : uniquement grade Chèvre (`PlayerRank.CHEVRE`) — pas Modérateur / Admin / Owner (sauf s'ils ont aussi le grade Chèvre).",
              "Deux effets : (1) vol créatif `hasUnlimitedFlight` — double-tap espace dans un claim de TA faction ; (2) fouille des conteneurs `canStealInClaims` dans un claim ÉTRANGER (allié ou ennemi). Les membres de la fac propriétaire ouvrent toujours leurs coffres.",
              "Anti-AFK détaillé : article AFK & clear-lag.",
            ],
          },
          {
            id: "staff",
            title: "Grades staff",
            list: [
              "Modérateur — cantale.moderator : /moderation, /vanish, /tag, /modhelp, /adminhome, /adminec, /adminpc. Coffres ×3, homes 999, /ah 20, pas d'AFK, warmup 0. Pas de vol en claim (ni vol créatif, ni fouille coffres étrangers).",
              "Admin / Owner — cantale.admin (enfants : givevie, moderator, feed, anticheat…). Mêmes avantages coffres/homes/AFK côté rank ; pas de vol en claim via le grade. Bypass claim (op / cantale.admin) = outil de modération, pas un perk « vol ».",
            ],
            commands: [
              {
                syntax: "/adminhome check <joueur>",
                description: "Liste les homes du joueur (coords + monde).",
                note: "cantale.moderator / cantale.admin — aliases : list, ls",
              },
              {
                syntax: "/adminhome <joueur> <nom>",
                description: "Téléporte le staff vers ce home (immédiat, sans cooldown).",
                note: "Aussi /adminhome tp <joueur> <nom> — aliases commande : /ahome, /seehome",
              },
              {
                syntax: "/adminec <joueur>",
                description: "Ouvre l'ender chest du joueur. Édition live si en ligne. Hors ligne : Paper n'expose pas OfflinePlayer#getEnderChest — legacy DB seulement si encore présent.",
                note: "cantale.moderator — aliases : /aec, /seeec",
              },
              {
                syntax: "/adminpc <joueur> [1|2|3]",
                description: "Ouvre les coffres privés (PC) du joueur (DB/cache, éditable en ligne ou hors ligne). Navigation entre PC selon le grade de la cible.",
                note: "cantale.moderator — aliases : /apc, /sepc",
              },
              {
                syntax: "/rank <set|remove|info> <joueur> [grade]",
                description: "Gère le grade en base (player_permissions).",
                note: "cantale.admin — OWNER|ADMIN|MODERATOR|AVENTURIER|VIP|CHEVRE|NONE",
              },
              {
                syntax: "/feed",
                description: "Restaure faim + saturation.",
                note: "VIP+ ou cantale.feed / cantale.admin",
              },
            ],
          },
          {
            id: "chevre-par-le-jeu",
            title: "Chèvre par les caisses",
            paragraphs: [
              "Le code prévoit l'attribution du grade Chèvre si un Cadeau du Roi aboutit en Légendaire. Ouverture normale d'un Ticket Légendaire → ticket Discord. Voir Caisses & clés (ascension).",
            ],
          },
          {
            id: "permissions",
            title: "Permissions plugin.yml",
            list: [
              "cantale.admin (défaut op) — admin ; enfants givevie, moderator, feed, anticheat.alerts, anticheat.bypass.",
              "cantale.moderator — modération.",
              "cantale.givevie — /givevie.",
              "cantale.feed — /feed sans être VIP+.",
              "cantale.cooldown.bypass — ignore les cooldowns CooldownManager (spawn, home, warp, rtp…).",
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
      "Création, claims, pouvoir, banque, homes/warps et permissions : règles exactes du plugin.",
    articles: [
      {
        slug: "creer-gerer-faction",
        title: "Créer & gérer sa faction",
        summary:
          "Toutes les commandes /f, grades, permissions fixes et sources de pouvoir (création 65, membres, PvP, banque, events, admin).",
        featured: true,
        related: ["claims-territoire", "vie-de-faction", "events-faction"],
        sections: [
          {
            id: "commandes",
            title: "Toutes les commandes /f",
            paragraphs: [
              "Sans argument, /f ouvre le menu. Alias principal : /faction.",
            ],
            tables: [
              {
                caption: "Gestion & infos",
                headers: ["Commande", "Effet", "Qui"],
                rows: [
                  ["/f", "Menu de faction", "Tous"],
                  ["/f help", "Liste d'aide en chat", "Tous"],
                  ["/f create <nom>", "Crée la fac, claim le chunk, pose le f-spawn", "Hors faction ; zone claimable"],
                  ["/f rename <nouveau_nom>", "Renomme + régénère le tag (chat/TAB/nametag/Discord)", "Chef · alias /f name, /f renommer"],
                  ["/f info [nom]", "Tag, chef, membres, claims, pouvoir, claims max", "Tous"],
                  ["/f list", "Liste des factions", "Tous"],
                  ["/f members", "Membres + rang + online", "Membre"],
                  ["/f join …", "Message : il faut être invité (pas de join libre)", "Tous"],
                  ["/f perms [grade]", "Permissions fixes du grade", "Membre"],
                  ["/f disband", "Dissolution définitive", "Chef"],
                ],
              },
              {
                caption: "Membres",
                headers: ["Commande", "Effet", "Qui"],
                rows: [
                  ["/f invite <pseudo>", "Invitation 5 min (cible online)", "FACCEPT (Officier+) ou chef"],
                  ["/f accept", "Rejoint en Recrue", "Invité"],
                  ["/f deny", "Refuse l'invitation", "Invité · alias /f refuse"],
                  ["/f leave", "Quitte (−5 pouvoir). Chef seul → destruction ; chef avec membres → bloqué", "Membre"],
                  ["/f kick <pseudo>", "Expulse (−5). Pas le chef ; pas rang ≥ soi", "FKICK (Officier+) ou chef"],
                  ["/f ban <pseudo>", "Kick équivalent (liste ban non persistée)", "BAN (Officier+) ou chef"],
                  ["/f promote <pseudo>", "Recrue→Membre→Vétéran→Officier", "Chef · alias /f promo"],
                  ["/f demote <pseudo>", "Officier→Vétéran→Membre→Recrue", "Chef · alias /f demo"],
                ],
              },
              {
                caption: "Territoire & mobilité",
                headers: ["Commande", "Effet", "Qui / notes"],
                rows: [
                  ["/f claim", "Claim chunk actuel", "ADD_CLAIMS (Membre+) · quota · contigu · distance 2"],
                  ["/f unclaim", "Unclaim si claim de ta fac", "REMOVE_CLAIMS (Officier+)"],
                  ["/f autoclaim on|off", "Claim auto en wilderness", "ADD_CLAIMS"],
                  ["/f map", "GUI inventaire 9×5 : claim/unclaim au clic (gris/vert), couleurs diplomatie", "Sans cooldown"],
                  ["/f map chat", "Ancienne grille chat 11×11 (+ # @ X = P -)", "Cooldown 30 s"],
                  ["/f secret", "Cache claims/spawn 1 h", "SECRET (Officier+) · CD 24 h"],
                  ["/f spawn", "TP f-spawn", "Cooldown 20 s"],
                  ["/f go", "TP f-spawn sans cooldown spawn", "Membre"],
                  ["/f setspawn", "Pose f-spawn (dans un claim)", "Chef"],
                  ["/f warp [nom]", "Liste / TP warp de fac", "FWARP (Membre+)"],
                  ["/f setwarp <nom>", "Crée warp (dans un claim)", "FWARP · quota warps"],
                  ["/f delwarp <nom>", "Supprime un warp", "FWARP"],
                  ["/f home [nom]", "Liste / TP tes f-homes", "Membre"],
                  ["/f sethome <nom>", "Crée f-home perso (dans un claim)", "Pas Recrue · quota fhomes"],
                ],
              },
              {
                caption: "Banque & chat",
                headers: ["Commande", "Effet", "Qui"],
                rows: [
                  ["/f bank", "Ouvre la GUI banque (dépôt / retrait / pouvoir / historique)", "INFO_BANK / BANK_ADD / chef"],
                  ["/f bank add|deposit <n>", "Dépose Cantox perso → banque", "BANK_ADD (Recrue+) ou chef"],
                  ["/f bank take|withdraw <n>", "Retire banque → perso", "BANK_TAKE (Officier+) ou chef"],
                  ["/f power", "GUI pouvoir : quotas, paliers, achat", "Membres (achat : chef/officier)"],
                  ["/f bank power", "Même GUI pouvoir", "Membres (achat : chef/officier)"],
                  ["/f bank power <n>", "Achète n unités (+10 pouvoir/unité) en chat (1–50)", "Chef, Officier, ou BANK_TAKE"],
                  ["/f c [msg]", "Toggle chat fac ou envoi direct", "Membre"],
                  ["/fc [msg]", "Raccourci chat fac", "Membre"],
                ],
              },
            ],
            commands: [
              {
                syntax: "/f disband",
                description: "Dissout la faction (claims retirés, rôles Discord sync).",
                note: "Alias : /f delete, /f supprimer",
              },
              {
                syntax: "/f perms [grade]",
                description: "Affiche les permissions du grade (fixes, non configurables).",
                note: "Alias : /f permissions",
              },
            ],
          },
          {
            id: "creation",
            title: "Création",
            list: [
              "Impossible si déjà en faction, nom invalide / déjà pris, zone protégée (spawn/warp), ou chunk déjà claim.",
              "Nom : 3–16 caractères, lettres (accents OK), chiffres, _ et - (pas d'espaces) — mêmes règles pour /f rename et /admin f rename.",
              "Tag auto : 4 premiers caractères du nom (majuscules), suffixe numérique si collision.",
              "Effets immédiats : claim du chunk actuel + f-spawn à ta position + annonce Discord si salon configuré.",
              "config factions.min-members-create (8) est lu mais non vérifié à la création (TODO dans le code).",
            ],
          },
          {
            id: "renommer",
            title: "Renommer",
            list: [
              "Chef : /f rename <nouveau_nom> (alias /f name, /f renommer).",
              "Staff : /admin f rename <faction> <nouveau_nom>.",
              "Met à jour le nom et régénère le tag ; rafraîchit les préfixes (chat / TAB / nametag) des membres en ligne ; renomme le rôle Discord dédié s'il existe.",
            ],
          },
          {
            id: "grades-perms",
            title: "Grades & permissions",
            paragraphs: [
              "Permissions fixes par grade (FactionPermissions). Le chef bypass tout. Le Vétéran n'a pas d'entrée dans la table → aucune permission de cette liste.",
            ],
            tables: [
              {
                caption: "Qui peut quoi",
                headers: ["Permission", "Recrue", "Membre", "Vétéran", "Officier", "Chef"],
                rows: [
                  ["BANK_ADD (déposer)", "oui", "oui", "—", "oui", "oui"],
                  ["ADD_CLAIMS / autoclaim", "—", "oui", "—", "oui", "oui"],
                  ["INFO_BANK (voir banque)", "—", "oui", "—", "oui", "oui"],
                  ["FWARP (warps)", "—", "oui", "—", "oui", "oui"],
                  ["REMOVE_CLAIMS", "—", "—", "—", "oui", "oui"],
                  ["FACCEPT (inviter)", "—", "—", "—", "oui", "oui"],
                  ["FKICK / BAN / UNBAN", "—", "—", "—", "oui", "oui"],
                  ["BANK_TAKE / power buy", "—", "—", "—", "oui", "oui"],
                  ["SECRET", "—", "—", "—", "oui", "oui"],
                  ["SET_PERMS / CULTURES / FHOME (flags)", "—", "—", "—", "—", "oui"],
                ],
              },
            ],
            list: [
              "Promouvoir : Recrue → Membre → Vétéran → Officier (chef seul).",
              "/f sethome : bloqué pour Recrue (check hardcodé), pas via le flag FHOME.",
              "CULTURES (fermes publiques) : activé seulement si Recrue a CULTURES — ce n'est pas le cas → récolte publique off.",
              "Alliés (diplomatie) : build / portes comme membres ; conteneurs (coffres…) réservés aux membres + grade Chèvre (vol). Pose de stockage toujours réservée au claim de sa propre fac.",
            ],
          },
          {
            id: "pouvoir",
            title: "Sources de pouvoir",
            tables: [
              {
                caption: "Gains / pertes",
                headers: ["Source", "Δ pouvoir", "Détail code"],
                rows: [
                  ["Création", "+65", "BASE 60 + POWER_PER_MEMBER 5 (chef)"],
                  ["Join membre", "+5", "FactionManager#addMember"],
                  ["Leave / kick", "−5", "Plancher 0 + retrait claims hors quota (plus récents d'abord)"],
                  ["Kill PvP", "+5 tueur / −5 victime", "PlayerListener (si les deux ont une fac)"],
                  ["Event faction top 5", "+50 / +35 / +25 / +15 / +10", "events.yml → FactionEventManager"],
                  ["/f bank power", "+10 pouvoir / unité achetée", "Débit banque ; power_purchased += unités"],
                  ["/f power", "—", "GUI quotas + paliers + achat"],
                  ["/admin addpower <fac> <n>", "+n", "Staff"],
                  ["/admin f rename <fac> <nom>", "—", "Staff : renomme + tag"],
                ],
              },
              {
                caption: "Quotas dérivés du pouvoir",
                headers: ["Quota", "Formule"],
                rows: [
                  ["Claims max", "max(5, pouvoir / 10) — division entière"],
                  ["F-homes max / joueur", "max(1, pouvoir / 20)"],
                  ["Warps de fac", "si pouvoir < 60 → 1 ; sinon 1 + (pouvoir − 60) / 30"],
                  [
                    "Hoppers posables (claims de la fac)",
                    "max(0, pouvoir / 20) — config `factions.hopper-limit` (divisor 20, min 0)",
                  ],
                ],
              },
              {
                caption: "Achat banque — config actuelle",
                headers: ["Paramètre", "Valeur"],
                rows: [
                  ["Formule prix", "cost(i) = floor(base × growth^(i × 10)) · i = power_purchased (unités)"],
                  ["power-per-unit", "10 — Acheter 1 → +10 pouvoir ; n → +10×n"],
                  ["base", "5 000 Cantox"],
                  ["growth", "1,18"],
                  ["max-per-purchase", "1 à 50 unités"],
                  ["1re unité (i=0)", "5 000 Cantox → +10 pouvoir"],
                  ["2e unité (i=1)", "floor(5000 × 1,18^10) ≈ 26 168 Cantox → +10 pouvoir"],
                ],
              },
            ],
            list: [
              "Exemple fac neuve (pouvoir 65) : claims max 6, fhomes 3, warps 1, hoppers 3.",
              "PowerManager (gains/pertes quotidiens) existe mais n'est pas branché → pas une source active.",
            ],
            commands: [
              {
                syntax: "/f power",
                description:
                  "GUI : pouvoir actuel, formules claims/fhomes/warps/hoppers, paliers suivants, achat 1/2/3/5/max unités (1 → +10 pouvoir).",
                note: "Tous les membres voient l'info ; achat réservé officiers / chef (ou BANK_TAKE). Alias : /f pouvoir",
              },
              {
                syntax: "/f bank power",
                description:
                  "Ouvre la même GUI pouvoir. Aussi accessible depuis /f et /f bank.",
              },
              {
                syntax: "/f bank power <nombre>",
                description:
                  "Achète n unités en chat (+10 pouvoir/unité). Officiers / chef (ou BANK_TAKE). Max 50.",
              },
              {
                syntax: "/admin addpower <faction> <montant>",
                description: "Ajoute du pouvoir à une faction.",
                note: "Staff",
              },
              {
                syntax: "/admin f rename <faction> <nouveau_nom>",
                description:
                  "Renomme une faction, régénère le tag, rafraîchit les nametags en ligne et le rôle Discord.",
                note: "Staff (op) · alias sous-commande : renommer",
              },
            ],
          },
        ],
      },
      {
        slug: "claims-territoire",
        title: "Claims & territoire",
        summary:
          "Quota claims, contiguïté, distance minimale, wilderness, PASDIC, PvP (safe chez soi), casse/pose (stockage & explosifs) et mode secret.",
        related: ["creer-gerer-faction", "vie-de-faction", "trois-vies", "items-forges"],
        sections: [
          {
            id: "revendiquer",
            title: "Claim / unclaim",
            tables: [
              {
                headers: ["Règle", "Valeur"],
                rows: [
                  ["Quota", "max(5, pouvoir / 10)"],
                  ["Contiguïté", "Doit toucher un claim existant (N/S/E/O) — sauf 1er claim du monde"],
                  ["Distance min autres facs", "2 chunks (Chebyshev) — voisins diagonaux inclus"],
                  ["Zones protégées", "SpawnProtection.canClaim = false → claim refusé"],
                  ["Perte de pouvoir", "Claims en trop retirés (plus récents d'abord)"],
                  ["/f autoclaim", "Mêmes règles que /f claim, silencieux si échec"],
                ],
              },
            ],
            commands: [
              {
                syntax: "/f claim",
                description: "Revendique le chunk actuel.",
                note: "ADD_CLAIMS (Membre+)",
              },
              {
                syntax: "/f unclaim",
                description: "Retire uniquement un claim de ta propre faction.",
                note: "REMOVE_CLAIMS (Officier+)",
              },
              {
                syntax: "/f autoclaim on|off",
                description: "Claim auto en marchant en wilderness.",
              },
              {
                syntax: "/f map",
                description:
                  "Ouvre la carte inventaire (grille 9×5 chunks centrée sur toi). Vert = ta fac, lime = ta position, gris = claimable (clic gauche), rouge = interdit/ennemi, bleu = allié, orange = autre, violet = PASDIC. Clic droit sur un claim de ta fac = unclaim. Mêmes règles que /f claim et /f unclaim (quota, contiguïté N/S/E/O, distance 2, zone protégée). Fermer / actualiser en bas.",
              },
              {
                syntax: "/f map chat",
                description:
                  "Ancienne carte chat 11×11 (N en haut) : + = toi, # ta fac, @ allié, X ennemi, = autre, P PASDIC, - wilderness. Claims en /f secret masqués aux non-membres.",
                note: "Cooldown 30 s",
              },
            ],
          },
          {
            id: "wilderness",
            title: "Wilderness (hors claim)",
            list: [
              "Casse, pose et interactions libres (coffres/portes des structures inclus).",
              "Exception : blocs de stockage (liste config) — pose interdite hors claim de ta propre faction, sauf CRAFTING_TABLE et fours (FURNACE, BLAST_FURNACE, SMOKER).",
              "PvP libre (aucun ClaimListener).",
              "Autoclaim ne s'applique qu'en wilderness.",
            ],
          },
          {
            id: "pvp-claims",
            title: "PvP dans les claims",
            paragraphs: [
              "ClaimListener#onEntityDamage (joueurs + projectiles). Position = claim sous la victime.",
            ],
            tables: [
              {
                headers: ["Situation", "PvP"],
                rows: [
                  ["Wilderness (pas de claim)", "Libre"],
                  ["Claim PASDIC (spawn/warp)", "Annulé — pas de PvP (impossible d'initier)"],
                  ["Victime dans le claim de SA propre faction", "Annulé — message « protégé dans le claim de sa faction »"],
                  ["Victime dans un claim ennemi / sans fac / intrus chez toi", "Autorisé"],
                  ["Attaquant op ou cantale.admin", "Pas de restriction claim"],
                ],
              },
            ],
            list: [
              "Être chez soi = safe (même un ennemi ne peut pas te tuer dans ton claim).",
              "Un intrus dans ton claim n'est pas safe : tu peux le tuer.",
              "Friendly fire entre membres hors de leur claim : non géré ici (wilderness = libre).",
              "Tag combat (15 s) : impossible d'entrer en zone no-PvP (PASDIC / ton claim) tant que tu es tagué — voir Combat & Vies.",
            ],
          },
          {
            id: "protection-claim",
            title: "Protection d'un claim normal",
            paragraphs: [
              "Membres et cantale.admin/op : tout autorisé. Alliés : build/interact (portes…) mais pas les conteneurs sauf Chèvre. Étrangers : règles ci-dessous (ClaimListener).",
            ],
            tables: [
              {
                headers: ["Action (étranger)", "Autorisé ?"],
                rows: [
                  ["Casser stockage / cultures", "Non"],
                  ["Casser autre bloc", "Oui"],
                  ["Poser TNT, obsidienne, cristal End, ancre, lit, seau d'eau", "Oui (liste explosive-place-blocks)"],
                  ["Poser tout autre bloc", "Non"],
                  ["Ouvrir conteneurs lootables (coffres, fours, hoppers, shulkers…)", "Non — sauf grade Chèvre (vol)"],
                  ["Ateliers (craft, enclume…)", "Non (étrangers) ; alliés oui"],
                  ["Interagir portes / boutons…", "Non (étrangers) ; alliés oui"],
                  ["Explosions", "Oui (sauf blocs en claim PASDIC)"],
                ],
              },
              {
                headers: ["Accès conteneurs lootables", "Qui ?"],
                rows: [
                  ["Membre de la fac propriétaire", "Toujours"],
                  ["Allié / ennemi / sans fac", "Uniquement Chèvre (`canStealInClaims`)"],
                  ["PASDIC", "Membres seulement (pas de vol)"],
                  ["op / cantale.admin", "Bypass modération"],
                ],
              },
              {
                caption: "Stockage — pose réservée au claim de SA faction",
                headers: ["Catégorie (config storage-blocks)", "Exemples"],
                rows: [
                  ["Conteneurs", "CHEST, TRAPPED_CHEST, BARREL, HOPPER, DISPENSER, DROPPER, ENDER_CHEST"],
                  ["Shulkers", "SHULKER_BOX + toutes couleurs"],
                  ["Fours", "FURNACE, BLAST_FURNACE, SMOKER"],
                  ["Tables / ateliers", "CRAFTING_TABLE, SMITHING_TABLE, LOOM, STONECUTTER, GRINDSTONE, FLETCHING_TABLE, CARTOGRAPHY_TABLE, BREWING_STAND, ANVIL…"],
                ],
              },
            ],
            list: [
              "Pose de stockage : refusée en wilderness, claim ennemi et claim allié — uniquement claim de ta fac (sauf op/admin).",
              "Exception wilderness : CRAFTING_TABLE, FURNACE, BLAST_FURNACE, SMOKER posables hors claim (restent protégés à la casse dans les claims via storage-blocks). Autres ateliers (smithing, loom, etc.) et conteneurs (coffres, shulkers, hoppers…) : toujours réservés au claim de ta fac.",
              "Hoppers (anti-lag) : craft vanilla interdit (hopper + wagonnet à hopper). Achat au /shop uniquement (150 000 Cantox, cap 4/j, pas de revente). Pose limitée par le pouvoir de fac : max(0, pouvoir / 20) hoppers dans les claims de la fac (comptage des hoppers déjà posés). Place-only : unclaim / dépassement ne retire pas les hoppers existants.",
            ],
          },
          {
            id: "pasdic",
            title: "PASDIC",
            list: [
              "Flag par claim (admin : /pasdic set true|false).",
              "Non-membres : aucune casse, aucune pose (TNT incluse), aucune interaction.",
              "Pas de PvP (voir section PvP) — impossible d'initier un combat.",
              "Entrée en Survival → Adventure forcé (sauf membres de la fac propriétaire, op, cantale.admin, créatif/spectateur).",
              "Sortie → Survival rétabli si Adventure imposé par PASDIC.",
              "Tag combat actif : entrée refusée (mouvement / pearl / portail) ; sortie libre.",
              "Explosions : blocs PASDIC retirés de la liste de destruction.",
              "Visible sur la carte site (layer PASDIC).",
            ],
            commands: [
              {
                syntax: "/pasdic set <true|false>",
                description: "Marque le claim sous le joueur comme PASDIC.",
                note: "Admin",
              },
            ],
          },
          {
            id: "secret",
            title: "Mode secret",
            list: [
              "Durée 1 h : claims et spawn cachés aux autres (site : secret_until).",
              "Annonce serveur à l'activation.",
              "Cooldown 24 h par joueur (SecretCooldownDAO).",
            ],
            commands: [
              {
                syntax: "/f secret",
                description: "Active le mode secret 1 h.",
                note: "SECRET (Officier+) · cooldown 24 h",
              },
            ],
          },
          {
            id: "carte-site",
            title: "Carte site (/carte)",
            paragraphs: [
              "Sur cantale.world/carte : une seule vue — tuiles Squaremap (relief live) + overlays Cantale (claims, PASDIC, warps). Aucun joueur live n'est affiché (Leaflet n'ajoute pas la couche players ; le proxy /map-provider remplace tiles/players.json par un JSON vide). Rafraîchissement silencieux toutes les 30 s. Les factions en /f secret sont exclues en SQL (secret_until).",
              "Si MAP_PROVIDER_URL est en HTTP, les tuiles passent par le proxy same-origin /map-provider/* (évite le mixed content). Plein écran, lien externe Squaremap, recherche faction/tag/warp et champs X/Z (blocs). Centre par défaut : spawn /spawn (−67 · −144).",
            ],
            list: [
              "En jeu : /f map = carte inventaire 9×5 (claim/unclaim au clic) ; /f map chat = grille ASCII 11×11 (cooldown 30 s). Secret masqué aux non-membres.",
              "Spawn serveur (−67 · −144) : injecté comme marqueur warp « Spawn » (API markers + recherche /carte), pas stocké en table warps.",
              "Ops Squaremap : world-settings.default.player-tracker.enabled: false (recommandé) pour couper la source côté serveur.",
            ],
          },
        ],
      },
      {
        slug: "vie-de-faction",
        title: "Vie de faction",
        summary:
          "Chat, f-spawn, f-homes, warps, banque Cantox et achat de pouvoir — quotas et rangs.",
        related: ["creer-gerer-faction", "claims-territoire", "discord-site"],
        sections: [
          {
            id: "chat",
            title: "Chat de faction",
            commands: [
              {
                syntax: "/f c [message]",
                description:
                  "Sans message : bascule le chat fac on/off. Avec message : envoi immédiat aux membres online.",
              },
              {
                syntax: "/fc [message]",
                description: "Raccourci du chat de faction.",
              },
            ],
          },
          {
            id: "spawn",
            title: "Spawn de faction",
            tables: [
              {
                headers: ["Commande", "Règle"],
                rows: [
                  ["/f spawn", "TP au f-spawn · cooldown 20 s"],
                  ["/f go", "Même TP · pas de cooldown fspawn"],
                  ["/f setspawn", "Chef seul · doit être dans un claim de la fac"],
                ],
              },
            ],
            list: [
              "Posé automatiquement à la création sur le chunk claimé.",
            ],
          },
          {
            id: "homes",
            title: "Homes de faction (f-homes)",
            tables: [
              {
                headers: ["Règle", "Détail"],
                rows: [
                  ["Portée", "Par joueur (player_uuid), pas un pool partagé"],
                  ["Quota", "max(1, pouvoir / 20) homes par joueur"],
                  ["sethome", "Dans un claim de la fac · Recrue interdite"],
                  ["/f home", "Sans nom = liste ; avec nom = TP (délai téléport)"],
                ],
              },
            ],
            commands: [
              {
                syntax: "/f home [nom]",
                description: "Liste ou téléporte vers un de tes f-homes.",
              },
              {
                syntax: "/f sethome <nom>",
                description: "Crée un f-home à ta position (claim de fac requis).",
                note: "Membre et plus",
              },
            ],
          },
          {
            id: "warps",
            title: "Warps de faction",
            tables: [
              {
                headers: ["Règle", "Détail"],
                rows: [
                  ["Portée", "Partagés (faction_warps), permission FWARP"],
                  ["Quota", "pouvoir < 60 → 1 ; sinon 1 + (pouvoir − 60) / 30"],
                  ["setwarp / delwarp", "FWARP · setwarp dans un claim de la fac"],
                ],
              },
            ],
            commands: [
              {
                syntax: "/f warp [nom]",
                description: "Sans nom : liste. Avec nom : TP.",
                note: "FWARP (Membre+)",
              },
              {
                syntax: "/f setwarp <nom>",
                description: "Crée un warp dans un claim de la fac.",
              },
              {
                syntax: "/f delwarp <nom>",
                description: "Supprime un warp.",
              },
            ],
          },
          {
            id: "banque",
            title: "Banque",
            tables: [
              {
                headers: ["Action", "Permission"],
                rows: [
                  ["Voir /f bank", "INFO_BANK ou BANK_ADD ou chef"],
                  ["add / deposit", "BANK_ADD (Recrue+) ou chef"],
                  ["take / withdraw", "BANK_TAKE (Officier+) ou chef"],
                  ["/f power ou /f bank power", "Tous membres (GUI info)"],
                  ["power <n> (achat chat)", "Chef, isOfficier, ou BANK_TAKE · 1–50"],
                  ["Achat GUI (boutons)", "Chef, isOfficier, ou BANK_TAKE"],
                ],
              },
            ],
            list: [
              "Le solde banque paie l'achat de pouvoir (1 unité → +10 pouvoir ; formule prix ×10 dans l'exposant — voir article Créer & gérer).",
              "/f bank ouvre la GUI banque (bouton pouvoir + historique). /f power montre quotas, paliers et achat.",
              "Historique (bouton livre dans /f bank) : dépôts, retraits, achats de pouvoir et mouvements admin — qui, montant, solde après, date (paginé).",
            ],
            commands: [
              {
                syntax: "/f bank",
                description: "GUI banque : dépôt, retrait, accès pouvoir, historique des transactions.",
              },
              {
                syntax: "/f bank add <montant>",
                description: "Dépose des Cantox dans la banque.",
                note: "Alias : deposit",
              },
              {
                syntax: "/f bank take <montant>",
                description: "Retire des Cantox de la banque.",
                note: "Alias : withdraw",
              },
              {
                syntax: "/f power",
                description: "GUI pouvoir : quotas claims/fhomes/warps/hoppers, paliers, achat 1/2/3/5/max (1 → +10 pouvoir).",
              },
              {
                syntax: "/f bank power [nombre]",
                description: "Sans n : GUI pouvoir. Avec n : achat n unités (+10 pouvoir/unité, max 50).",
              },
            ],
          },
          {
            id: "discord",
            title: "Discord",
            list: [
              "Création / dissolution annoncées si salon mc-factions configuré.",
              "Joueurs liés : rôle Discord faction sync (join/leave/kick/disband).",
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
      "Cantox, /shop (caps & sinks), /ah, /daily, votes et caisses — règles tirées du plugin.",
    articles: [
      {
        slug: "cantox",
        title: "La Cantox",
        summary:
          "Monnaie du serveur : solde de départ, paiements, sources et sinks.",
        featured: true,
        related: [
          "hotel-des-ventes-echanges",
          "boutique-admin",
          "vote",
          "recompenses-regulieres",
        ],
        sections: [
          {
            id: "bases",
            title: "Solde & paiements",
            paragraphs: [
              "Nouveau joueur : 10 000 Cantox (economy.start-balance). Solde visible dans la bossbar d'infos (désactivable via /profile).",
            ],
            commands: [
              {
                syntax: "/balance [joueur]",
                description:
                  "Affiche le solde Cantox, le tien ou celui d'un autre joueur.",
                note: "Alias : /bal, /money",
              },
              {
                syntax: "/pay <joueur> <montant>",
                description: "Transfère des Cantox à un autre joueur.",
              },
            ],
          },
          {
            id: "gagner",
            title: "Gagner des Cantox",
            list: [
              "Vendre au /shop (plancher serveur).",
              "Vendre aux joueurs via /ah.",
              "/daily : 1 000 de base + bonus de grade (aussi Discord si lié).",
              "Réaction chat : 200 à 500 Cantox au premier.",
              "Top 5 des événements de faction (pouvoir + Cantox).",
              "Prime wanted : tuer la cible empoche la mise.",
              "Caisses : certaines lignes de butin versent des Cantox.",
            ],
          },
          {
            id: "depenser",
            title: "Dépenser & circulation",
            paragraphs: [
              "/shop = sink (Cantox payées au serveur hors circulation). /ah, /pay, /trade et primes wanted font circuler entre joueurs. Banque de faction : /f bank.",
            ],
          },
        ],
      },
      {
        slug: "hotel-des-ventes-echanges",
        title: "Hôtel des ventes & échanges",
        summary:
          "/ah entre joueurs (7 jours, limite de types selon le grade) et /trade face à face.",
        related: ["cantox", "boutique-admin", "grades-permissions"],
        sections: [
          {
            id: "hotel-des-ventes",
            title: "Hôtel des ventes (/ah)",
            paragraphs: [
              "Marché joueur contre joueur : prix unitaire en Cantox. Durée d'annonce : 7 jours ; à expiration, item rendu si le vendeur est en ligne. Limite = nombre de types de Material en vente (pas le nombre d'unités).",
            ],
            tables: [
              {
                caption: "Types max en vente (PlayerRank.maxAhListings)",
                headers: ["Grade", "Types /ah"],
                rows: [
                  ["Joueur", "3"],
                  ["Aventurier", "5"],
                  ["VIP", "12"],
                  ["Chèvre / Staff", "20"],
                ],
              },
            ],
            commands: [
              {
                syntax: "/ah",
                description: "Ouvre le menu de l'hôtel des ventes.",
                note: "Alias : /auction",
              },
              {
                syntax: "/ah sell <quantité|all> <prix>",
                description:
                  "Met en vente l'item en main (prix = Cantox par unité).",
              },
              {
                syntax: "/ah buy <id> [quantité]",
                description: "Achète une annonce par id.",
              },
              {
                syntax: "/ah cancel <id>",
                description: "Annule une de tes annonces et rend l'item.",
              },
              {
                syntax: "/ah list",
                description: "Parcourt les annonces (même menu que /ah).",
                note: "Alias : /ah browse",
              },
              {
                syntax: "/ah my",
                description: "Tes annonces actives.",
              },
            ],
          },
          {
            id: "echanges",
            title: "Échanges entre joueurs",
            paragraphs: [
              "/trade : échange direct sécurisé — dépôt d'items des deux côtés puis validation.",
            ],
            commands: [
              {
                syntax: "/trade <joueur>",
                description: "Propose un échange.",
                note: "Alias : /trades",
              },
              {
                syntax: "/trade accept",
                description: "Accepte la demande reçue.",
              },
              {
                syntax: "/trade decline",
                description: "Refuse la demande reçue.",
              },
            ],
          },
        ],
      },
      {
        slug: "boutique-admin",
        title: "Boutique admin",
        summary:
          "/shop : achat/vente serveur, plafonds quotidiens, sinks endgame (shop.yml).",
        related: ["cantox", "hotel-des-ventes-echanges"],
        sections: [
          {
            id: "utilisation",
            title: "Ouvrir & acheter / vendre",
            paragraphs: [
              "Plancher de prix + sink anti-inflation — pas un marché équitable (/ah reste le marché joueur). Catégories : Blocs & Matériaux, Bois & Déco, Minerais & Métaux, Nether & End, Agriculture & Nourriture, Drops de Mobs, Redstone & Mécanismes, Guerre & PvP.",
            ],
            commands: [
              {
                syntax: "/shop",
                description: "Ouvre la boutique (catégories → items paginés).",
                note: "Alias : /adminshop, /boutique",
              },
              {
                syntax: "/shop buy <item> <quantité>",
                description: "Achat sans UI.",
              },
              {
                syntax: "/shop sell <item|hand> <quantité|all>",
                description: "Vente sans UI.",
              },
            ],
            list: [
              "Clic gauche : acheter 1.",
              "Shift + clic gauche : acheter 64.",
              "Clic droit : vendre 1.",
              "Shift + clic droit : vendre tout (plafond / stock).",
            ],
          },
          {
            id: "plafonds",
            title: "Plafonds quotidiens",
            paragraphs: [
              "daily-buy-cap / daily-sell-cap = quantité max par joueur et par jour (0 = illimité). Reset à minuit. Message : « Limite quotidienne… (reset à minuit) ».",
            ],
            list: [
              "Achat toujours > revente shop.",
              "Ventes farm / drops basiques souvent à 1 Cantox.",
              "Item absent du catalogue = non négociable. Blacklist code (bedrock, barrier, spawners…).",
              "Hopper : craft bloqué ; /shop 150 000 Cantox, sell off, daily-buy-cap 4 (entre cristal End et coquille shulker). Pose plafonnée par pouvoir de fac.",
            ],
          },
          {
            id: "endgame",
            title: "Sinks endgame & rares",
            paragraphs: [
              "Prix shop.yml (1 item). Élytra et cristal d'End : pas de revente shop.",
            ],
            tables: [
              {
                caption: "Netherite & debris",
                headers: [
                  "Item",
                  "Achat",
                  "Vente",
                  "Cap achat/j",
                  "Cap vente/j",
                ],
                rows: [
                  ["Netherite scrap", "75 000", "500", "8", "8"],
                  ["Ancient debris", "120 000", "900", "4", "16"],
                  ["Lingot netherite", "250 000", "1 300", "2", "4"],
                  ["Bloc netherite", "850 000", "8 500", "1", "—"],
                ],
              },
              {
                caption: "Nether & End rares",
                headers: ["Item", "Achat", "Vente", "Cap achat/j"],
                rows: [
                  ["End crystal", "100 000", "non", "8"],
                  ["Hopper (Redstone)", "150 000", "non", "4"],
                  ["Coquille de shulker", "350 000", "1 800", "4"],
                  ["Boîte de shulker", "500 000", "3 200", "2"],
                  ["Élytra", "2 000 000", "non", "1"],
                ],
              },
            ],
            list: [
              "Guerre : TNT 1 320 (achat seul), obsidienne 5 040 / vente 40 (cap vente 128), bouclier 3 480 (achat seul).",
              "Repères : diamant 1 000 / 150 (cap vente 64), émeraude 1 500 / 220 (cap vente 32).",
            ],
          },
        ],
      },
      {
        slug: "vote",
        title: "Vote & récompenses",
        summary:
          "Sites, Cadeaux du Roi, /vote, Vote Party, paliers et top mensuel.",
        related: ["caisses-cles", "cantox", "recompenses-regulieres"],
        sections: [
          {
            id: "sites",
            title: "Sites de vote",
            paragraphs: [
              "Récompense = uniquement Cadeaux du Roi (caisse Vote). Quantité selon cooldown site : ≥24 h → 3, ≥3 h → 2, sinon 1. Sites config.yml actuels :",
            ],
            tables: [
              {
                headers: ["Site", "Cooldown", "Cadeaux du Roi"],
                rows: [
                  ["Top-Serveurs.net", "3 h", "2"],
                  ["Serveur-Prive.net", "1 h", "1"],
                  ["ServeurListe.com", "1 h", "1"],
                ],
              },
            ],
            list: [
              "Top-Serveurs : https://top-serveurs.net/minecraft/vote/cantale",
              "Serveur-Prive : https://serveur-prive.net/minecraft/cantale/vote",
              "ServeurListe : https://www.serveurliste.com/fr/minecraft/cantale/vote",
            ],
          },
          {
            id: "commandes",
            title: "Commandes",
            paragraphs: [
              "Hors-ligne : récompense en attente (reconnexion ou /vote claim). Inventaire plein → /pc, sinon drop au sol.",
            ],
            commands: [
              {
                syntax: "/vote",
                description: "Sites, liens, nombre de Cadeaux du Roi.",
              },
              {
                syntax: "/vote claim",
                description: "Récupère les récompenses en attente.",
              },
              {
                syntax: "/vote stats [pseudo]",
                description: "Total, votes du mois, streak (jours).",
              },
              {
                syntax: "/vote top [n]",
                description: "Classement (défaut 10, max 50).",
              },
              {
                syntax: "/vote help",
                description: "Aide vote.",
              },
            ],
          },
          {
            id: "party-paliers",
            title: "Vote Party, paliers & mensuel",
            list: [
              "Anti-abus : cooldown IP 1 h par site.",
              "Rappels toutes les 30 min.",
              "Vote Party : 50 votes serveur / jour → 1 Cadeau du Roi à un online au hasard.",
              "Paliers à vie : 10 → 2× Cadeau du Roi ; 50 → 1× Trésor Public ; 100 → 1× Médaille du Tournoi.",
              "Top mensuel (1er du mois) : 1er Ticket Légendaire ; 2e Pièce Mythique ; 3e Médaille du Tournoi.",
              "Ouverture Cadeau du Roi : boîte aux lettres (tonneau / métier à tisser) — article Caisses & clés.",
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
      "Vies hardcore (config 3 au départ), mort, ban UUID/IP, item Vie, /givevie, combat tag, primes wanted et PvP dans les claims.",
    articles: [
      {
        slug: "trois-vies",
        title: "Le système des trois vies",
        summary:
          "Départ à 3 vies, −1 à chaque mort, ban PROFILE+IP à 0, item Vie, grades mensuels, déco combat 15 s.",
        featured: true,
        related: ["primes-wanted", "claims-territoire", "grades-permissions", "caisses-cles"],
        sections: [
          {
            id: "depart-mort",
            title: "Départ & mort",
            tables: [
              {
                caption: "config.yml → lives",
                headers: ["Paramètre", "Valeur"],
                rows: [
                  ["default-lives", "3 (nouveau joueur via createOrUpdatePlayer)"],
                  ["min-lives", "0"],
                  ["ban-on-zero", "true"],
                  ["buy-price", "10 000 Cantox — lu par ConfigManager, aucun achat in-game branché"],
                  ["respawn-saturation-seconds", "150 (~2,5 min) — effet Saturation amp 0 au respawn"],
                ],
              },
            ],
            list: [
              "Chaque mort (PvP ou PvE) : −1 vie (LifeManager#handleDeath).",
              "Permission cantale.admin : mort sans perte de vie (message « vies illimitées ») — sauf déco combat (voir ci-dessous).",
              "Après respawn : invulnérabilité 10 s (noDamageTicks) + Saturation amp 0 pendant lives.respawn-saturation-seconds (défaut 150). Durée rafraîchie à chaque respawn.",
              "Kill PvP : +5 pouvoir à la fac du tueur, −5 à celle de la victime (si fac).",
              "Items Vie custom dans l'inventaire à la mort : détruits (ne droppent pas).",
              "Totem vanilla : bloqué. L'item Vie custom n'est pas un totem de résurrection.",
            ],
          },
          {
            id: "zero-ban",
            title: "À 0 vie — ban",
            paragraphs: [
              "Quand il reste ≤ 1 vie et que tu meurs (ou déco combat) : vies mises à 0, puis ban.",
            ],
            list: [
              "Ban PROFILE (UUID) en priorité — résiste au changement de pseudo ; fallback BanList NAME si l'API profil échoue.",
              "Ban IP (adresse du joueur) + enregistrement last_ip en BDD.",
              "Kick avec le message config : « Vous n'avez plus de vies ! Achetez-en une ou attendez qu'un ami vous en donne une. »",
              "Gate AsyncPlayerPreLoginEvent : si lives ≤ 0 et ban-on-zero, connexion refusée (même message) — empêche le bypass NAME via nouveau pseudo.",
              "Apparition sur La Liste (/listemorts) : joueurs avec lives ≤ 0 et last_death > 0.",
              "Restauration : /addlife (ou /givevie console/admin) lève NAME + PROFILE + IP via pardonLifeBan (IP online ou last_ip).",
            ],
          },
          {
            id: "deco-combat",
            title: "Tag combat & déco",
            tables: [
              {
                headers: ["Règle", "Valeur"],
                rows: [
                  ["Durée du tag", "15 s (rafraîchi à chaque coup joueur↔joueur)"],
                  ["Déco pendant le tag", "−1 vie toujours (y compris cantale.admin / OP)"],
                  ["À 0 après déco", "Même ban PROFILE + IP"],
                  ["Téléport commandes", "Bloquées pendant le tag"],
                  ["Exceptions TP", "Ender pearl, portail Nether, portail End autorisés — sauf destination no-PvP"],
                  ["Entrée zone no-PvP", "Bloquée pendant le tag (PASDIC / claim de ta fac)"],
                ],
              },
            ],
            list: [
              "Broadcast serveur à la déco combat (pseudo + perte d'1 vie).",
              "Créatif / spectateur : pas de tag combat.",
              "Impossible d'initier du PvP en PASDIC ou dans le claim de la victime (ClaimListener) — le tag ne s'applique que si le coup n'est pas annulé.",
              "Pendant le tag : tu ne peux pas entrer en zone no-PvP (PASDIC spawn/warp, ou claim de ta propre faction). Sortie libre.",
              "Cas limite : si tu es déjà dans une zone no-PvP pendant un tag (pearl admin, claim devenu PASDIC, etc.) — le tag continue ; les coups restent bloqués ; la sortie est libre ; la ré-entrée est refusée tant que le tag est actif.",
            ],
          },
          {
            id: "obtenir-vies",
            title: "Obtenir des vies",
            tables: [
              {
                caption: "Sources codées",
                headers: ["Source", "Effet"],
                rows: [
                  ["Item Vie (CustomItemType.VIE)", "Clic-droit main → +1 vie DB, item consommé (addLife, sans plafond)"],
                  ["/dropvie", "−1 vie DB → reçoit 1 item Vie (min. 2 vies requises)"],
                  ["/givevie <joueur> (joueur)", "Transfert 1 vie (émetteur ≥ 2 vies). Cible online."],
                  ["Discord /givevie", "Compte lié : 1 à 5 vies, débit émetteur, crédit cible"],
                  ["Grades mensuels", "Items Vie à la connexion (1×/mois calendaire) — voir tableau grades"],
                  ["Caisses", "Loot tables Vote / Rare / Épique / Mythique peuvent donner 1–2 items Vie"],
                  ["Boutique site", "Packs catalogue : 1 / 5 / 10 / 30 / 50 / 100 (EUR). Checkout si SHOP_ENABLED"],
                  ["/addlife (admin/console)", "+N vies ; pardonne le ban vies si besoin"],
                ],
              },
              {
                caption: "Items Vie mensuels (PlayerRank)",
                headers: ["Grade", "Items / mois"],
                rows: [
                  ["Joueur (NONE)", "0"],
                  ["Aventurier", "1"],
                  ["VIP", "2"],
                  ["Chèvre (Héros)", "3"],
                  ["Modo / Admin / Owner", "0 (pas de vies mensuelles staff)"],
                ],
              },
            ],
            list: [
              "Récompense mensuelle : items Vie dans l'inventaire (drop au sol si plein), pas un +vie DB direct — il faut clic-droit.",
              "Bossbar : affiche « Vies restantes : X/10 ». Seul addLives() plafonne à 10 ; item Vie, /givevie et /addlife passent par addLife (pas de plafond).",
              "Pas d'achat de vies en Cantox in-game malgré lives.buy-price dans la config.",
              "Permission in-game /givevie : cantale.givevie (plugin.yml default: op ; aussi listée pour Modo/Owner dans PermissionManager).",
            ],
          },
          {
            id: "commandes",
            title: "Commandes",
            commands: [
              {
                syntax: "/dropvie",
                description: "Transforme 1 vie en item Vie (minimum 2 vies).",
              },
              {
                syntax: "/givevie <joueur>",
                description:
                  "Joueur→joueur : transfert 1 vie (min. 2). Console / admin sans assez de vies : grant +1 sans coût + pardon ban.",
                note: "Permission : cantale.givevie · cible online",
              },
              {
                syntax: "/addlife <joueur> <nombre>",
                description: "Ajoute N vies (online ou offline). Pardonne ban vies.",
                note: "Admin / console / OP",
              },
              {
                syntax: "/removelife <joueur> <nombre>",
                description: "Retire N vies (cible online).",
                note: "Admin / console / OP",
              },
              {
                syntax: "/lastdeath [joueur]",
                description:
                  "Horodatage, total de morts et localisation (monde + X/Y/Z) de la dernière mort (BDD last_death + last_death_*).",
                note: "Cible online ou offline si connue en BDD",
              },
              {
                syntax: "/listemorts",
                description: "La Liste : joueurs à 0 vie avec last_death > 0.",
                note: "Alias : /list, /morts, /bans",
              },
            ],
          },
          {
            id: "suivi",
            title: "Suivi",
            list: [
              "Bossbar perso rotative : slide Vies (et Wanted si prime active) — toggle dans /profile.",
              "/profile : vies restantes.",
              "Menu Système de Vies (UI) : raccourcis /dropvie, /givevie, rappel usage item.",
              "PvP dans les claims : article Claims & territoire (safe chez soi, PASDIC no-PvP, wilderness libre).",
            ],
          },
        ],
      },
      {
        slug: "primes-wanted",
        title: "Primes wanted",
        summary:
          "Primes Cantox cumulables, paliers 100K / 1M / 5M, tracker 5 min, Serial Killer 10 kills = 500.",
        related: ["trois-vies", "cantox", "claims-territoire"],
        sections: [
          {
            id: "fonctionnement",
            title: "Fonctionnement",
            list: [
              "/wanted add : débite le poseur, crée une entrée active (raison libre).",
              "Plusieurs primes peuvent s'empiler sur la même cible ; total = somme des reward actives.",
              "Kill de la cible : le tueur reçoit le total, toutes les primes sont clôturées (broadcast).",
              "Aucun minimum de prix dans le code.",
              "/wanted remove : retire toutes les primes actives de la cible et rembourse chaque émetteur. Pas de check permission staff.",
              "Bossbar : slide Wanted si le joueur a une prime.",
            ],
          },
          {
            id: "paliers",
            title: "Paliers (total cumulé)",
            tables: [
              {
                headers: ["Palier", "Seuil total", "Effets codés"],
                rows: [
                  ["1", "< 100 000", "Pas d'annonce Discord à la pose"],
                  ["2", "≥ 100 000", "Annonce Discord à la pose ; embed co/déco Discord"],
                  ["3", "≥ 1 000 000", "Comme 2 + localisation Discord à la co (coords si hors claim ; « Dans un claim (caché) » sinon)"],
                  ["4", "≥ 5 000 000", "Comme 3 + broadcast MC co/déco + tracker toutes les 5 min (coords ou claim caché)"],
                ],
              },
            ],
            list: [
              "Labels code : NIVEAU 1 / 2 (100K+) / 3 (1M+) / 4 (5M+).",
            ],
          },
          {
            id: "serial-killer",
            title: "Serial Killer",
            list: [
              "Seuil : 10 kills sans mourir (kill_streak).",
              "Prime système : 500 Cantox, raison « Serial Killer (N kills sans morts) » — pas de débit Cantox au poseur.",
              "Broadcast serveur à l'obtention du statut et à la mort du Serial Killer.",
            ],
          },
          {
            id: "commandes",
            title: "Commandes",
            commands: [
              {
                syntax: "/wanted",
                description: "Ouvre l'UI des primes actives.",
                note: "Alias : /prime, /primes",
              },
              {
                syntax: "/wanted list",
                description: "Même UI liste.",
              },
              {
                syntax: "/wanted add <joueur> <prix> <raison…>",
                description: "Pose une prime (Cantox débités immédiatement). Cible online.",
              },
              {
                syntax: "/wanted remove <joueur> [raison…]",
                description: "Annule toutes les primes de la cible + remboursement des émetteurs.",
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
      "Événements de faction, réactions chat, clé hebdomadaire et récompenses — valeurs issues de events.yml.",
    articles: [
      {
        slug: "events-faction",
        title: "Événements de faction",
        summary:
          "Récolte, minage et PvP : 3–4 rendez-vous d'1 h/semaine, top 5 pouvoir + Cantox (events.yml).",
        featured: true,
        related: [
          "reactions-chat",
          "recompenses-regulieres",
          "creer-gerer-faction",
          "teleportation",
        ],
        sections: [
          {
            id: "calendrier",
            title: "Calendrier (events.yml)",
            tables: [
              {
                caption: "faction-events",
                headers: ["Paramètre", "Valeur"],
                rows: [
                  ["Par semaine", "3 à 4 (aléatoire)"],
                  ["Durée", "60 minutes"],
                  ["Fenêtre de démarrage", "14 h–22 h Europe/Paris"],
                  ["Max par jour civil", "1"],
                  ["Gap fin → début suivant", "8 heures minimum"],
                  ["Types", "HARVEST / MINING / PVP (poids égaux)"],
                ],
              },
            ],
            paragraphs: [
              "Annonce serveur au démarrage ; scoreboard latéral en direct ; bossbar d'infos tant que l'event est actif.",
              "/events liste seulement les warps d'événement staff (lieux cliquables), pas ce calendrier automatique.",
            ],
          },
          {
            id: "types",
            title: "Comment marquer des points",
            list: [
              "Récolte — une ressource tirée au sort. Dépose via /recolte (UI). Faction obligatoire.",
              "Minage — un minerai tiré au sort (+ variante deepslate = même type). +1 point par minerai à la casse.",
              "PvP — +10 points par kill d'un joueur d'une autre faction (pas de points entre alliés).",
            ],
            tables: [
              {
                caption: "Points (events.yml → points)",
                headers: ["Action", "Points"],
                rows: [
                  ["Récolte / item déposé", "1 × multiplicateur item (voir ci-dessous)"],
                  ["Minerai cassé (cible)", "1"],
                  ["Kill PvP (autre fac)", "10"],
                ],
              },
            ],
          },
          {
            id: "participer-recolte",
            title: "Participer — Récolte (/recolte)",
            paragraphs: [
              "Ouvre une UI (3 lignes de dépôt). Place la ressource cible, clique Déposer (vert) pour convertir en points. Annuler ou fermer rend les items. Seule la ressource annoncée compte.",
            ],
            tables: [
              {
                caption: "Pool harvest-items (un seul tiré par event)",
                headers: ["Item", "Multiplicateur"],
                rows: [
                  ["Blé, carotte, pomme de terre, betterave", "×1"],
                  ["Canne à sucre, tranche de pastèque, baies, cacao", "×1"],
                  ["Verrues du Nether, citrouille", "×2"],
                ],
              },
            ],
            commands: [
              {
                syntax: "/recolte",
                description: "Ouvre l'UI de dépôt si une récolte est en cours.",
                note: "Alias : /harvest, /depositrecolte",
              },
            ],
          },
          {
            id: "participer-minage-pvp",
            title: "Participer — Minage & PvP",
            list: [
              "Minage possible : charbon, fer, cuivre, or, redstone, lapis, diamant, émeraude, or du Nether, quartz, débris antiques (deepslate inclus).",
              "Faction requise pour marquer ; pas de points sans fac.",
            ],
          },
          {
            id: "recompenses",
            title: "Récompenses top 5",
            tables: [
              {
                caption: "events.yml — faction-events.rewards",
                headers: ["Place", "Pouvoir (faction)", "Cantox / participant"],
                rows: [
                  ["#1", "+50", "2 000"],
                  ["#2", "+35", "1 500"],
                  ["#3", "+25", "1 000"],
                  ["#4", "+15", "750"],
                  ["#5", "+10", "500"],
                ],
              },
            ],
            list: [
              "Pouvoir → faction. Cantox → chaque membre qui a marqué au moins 1 point (online ou offline).",
            ],
            commands: [
              {
                syntax: "/events",
                description:
                  "Warps d'événement actifs (staff) uniquement — pas le score faction.",
              },
            ],
          },
        ],
      },
      {
        slug: "reactions-chat",
        title: "Réactions chat",
        summary:
          "Mot mélangé ou premier bloc : max 9/jour, 200–500 Cantox, fenêtre 90 s (events.yml).",
        related: ["events-faction", "cantox", "profil-tags"],
        sections: [
          {
            id: "types",
            title: "Les deux épreuves",
            list: [
              "Mot mélangé (scramble-chance 0,55) — mot français brouillé : premier à l'écrire correctement (exact, minuscules) gagne.",
              "Premier à casser — bloc annoncé : premier à en casser un gagne.",
            ],
            paragraphs: [
              "Sans gagnant en 90 s (timeout-seconds) : annulation et message serveur.",
            ],
          },
          {
            id: "calendrier",
            title: "Calendrier (chat-reactions)",
            tables: [
              {
                headers: ["Paramètre", "Valeur"],
                rows: [
                  ["Max / jour", "9 (Europe/Paris)"],
                  ["Fenêtre", "10 h → 22 h Europe/Paris"],
                  ["Intervalle entre deux", "45–120 minutes (aléatoire)"],
                  ["Récompense Cantox", "200–500 (inclusif)"],
                  ["Timeout", "90 secondes"],
                ],
              },
            ],
            list: [
              "Aucun joueur en ligne → report au prochain créneau.",
            ],
          },
          {
            id: "classement",
            title: "Classement",
            list: [
              "Chaque victoire incrémente le compteur réactions chat.",
              "En jeu : /leaderboard chat (aussi chat_reactions, reactions).",
              "Bossbar d'infos signale une réaction en cours.",
            ],
            commands: [
              {
                syntax: "/leaderboard chat",
                description: "Top des victoires de réactions chat.",
                note: "Alias : /top, /lb, /classement",
              },
            ],
          },
        ],
      },
      {
        slug: "recompenses-regulieres",
        title: "Récompenses régulières",
        summary:
          "/daily par grade et drop de clé hebdomadaire Rare / Épique / Mythique.",
        related: ["vote", "caisses-cles", "grades-permissions", "cantox", "reactions-chat"],
        sections: [
          {
            id: "daily",
            title: "Récompense quotidienne (/daily)",
            paragraphs: [
              "Une fois par jour civil (LocalDate). Base 1 000 + bonus PlayerRank. Staff (Modo/Admin/Owner) : base seule. Même montant via Discord (compte lié).",
            ],
            tables: [
              {
                caption: "Montants /daily (DailyCommand + PlayerRank)",
                headers: ["Grade", "Base", "Bonus", "Total"],
                rows: [
                  ["Joueur", "1 000", "0", "1 000"],
                  ["Aventurier", "1 000", "2 500", "3 500"],
                  ["VIP", "1 000", "10 000", "11 000"],
                  ["Chèvre", "1 000", "100 000", "101 000"],
                  ["Modo / Admin / Owner", "1 000", "0", "1 000"],
                ],
              },
            ],
            commands: [
              {
                syntax: "/daily",
                description: "Réclame la récompense du jour.",
                note: "Alias : /journalier",
              },
            ],
          },
          {
            id: "drop-cle",
            title: "Drop de clé hebdomadaire",
            paragraphs: [
              "Une fois par semaine, un joueur connecté reçoit une clé. Annonce serveur ; message privé (ouvrir au spawn). Inventaire plein → drop au sol.",
            ],
            tables: [
              {
                caption: "weekly-key-drop (events.yml)",
                headers: ["Paramètre", "Valeur"],
                rows: [
                  ["Jour", "Aléatoire (lundi–dimanche)"],
                  ["Heure", "Aléatoire 14 h–21 h Europe/Paris (pas de 15 min)"],
                  ["Types (poids égaux)", "RARE, EPIC, MYTHIC"],
                  ["Exclus", "LEGENDARY et VOTE"],
                  ["Personne online", "Nouvel essai ~30 min plus tard"],
                ],
              },
            ],
          },
        ],
      },
    ],
  },
  {
    slug: "items",
    name: "Items",
    tagline: "Outils, armes, armure, consommables",
    description:
      "Catalogue pratique des items custom : obtention, effets, durabilité, CMD resource pack.",
    articles: [
      {
        slug: "items-forges",
        title: "Outils forgés",
        summary:
          "Pickantaxe, Cantaxe, Multi-Cantool : matériaux, zones, enchantements, caisses et commandes.",
        featured: true,
        related: [
          "cantalame",
          "armure-du-garde",
          "item-vie",
          "rune-de-fortification",
          "caisses-cles",
          "claims-territoire",
        ],
        sections: [
          {
            id: "catalogue",
            title: "Familles (enum CustomItemType)",
            paragraphs: [
              "Tous les types ci-dessous sont non craftables (lore plugin). Absents de shop.yml. Resource pack requis pour les modèles CMD.",
            ],
            tables: [
              {
                caption: "Vue d'ensemble",
                headers: ["Famille", "Matériaux de base", "Variantes", "Effet principal"],
                rows: [
                  [
                    "Pickantaxe",
                    "Pioche fer / diamant / netherite",
                    "1×1, 3×3, 5×5, 7×7 (12 types)",
                    "Minage de zone orientée au regard",
                  ],
                  [
                    "Cantaxe",
                    "Hache fer / diamant / netherite",
                    "3 types",
                    "Abattage LOG/WOOD/STEM (BFS, max 100 bûches)",
                  ],
                  [
                    "Multi-Cantool",
                    "Pioche fer / diamant / netherite",
                    "1×1 + variante sans suffixe (6 types)",
                    "Adaptation pioche/hache/pelle/cisailles + insta-break",
                  ],
                  [
                    "Autres",
                    "Voir articles liés",
                    "Cantalame, Vie, Rune, Armure du Garde",
                    "—",
                  ],
                ],
              },
            ],
          },
          {
            id: "pickantaxe",
            title: "Pickantaxe",
            paragraphs: [
              "Zone : si pitch > 45° ou < −45°, surface horizontale (X,Z) ; sinon surface verticale selon le yaw. Blocs hors centre via breakExtraBlock (respect claims / PASDIC / stockages protégés). 1×1 = pas d'extra.",
              "Enchantable (lore) : Fortune, Silk Touch, Unbreaking. Anvil : pas de blocage spécifique Pickantaxe.",
            ],
            tables: [
              {
                caption: "Stats à la création (CustomItemManager)",
                headers: [
                  "Variante",
                  "Enchantements",
                  "Durabilité",
                  "CMD",
                  "Obtention caisses",
                ],
                rows: [
                  [
                    "Fer 1×1 … 7×7",
                    "Unbreaking V · Efficiency V",
                    "Usure vanilla (Unbreaking V)",
                    "1001–1004",
                    "Rare « Pic du Mineur » → Fer 1×1 (poids 15)",
                  ],
                  [
                    "Diamant 1×1 … 7×7",
                    "Unbreaking VII · Efficiency VII",
                    "Usure vanilla (Unbreaking VII)",
                    "1011–1014",
                    "Épique « Pic de Maître » → Diamant 1×1 (18) ; Mythique « Vœu de Puissance » → Diamant 3×3 (18)",
                  ],
                  [
                    "Netherite 1×1 … 7×7",
                    "Efficiency X (pas d'Unbreaking)",
                    "Commentaire code « infini » sans setUnbreakable — usure vanilla non désactivée dans le listener",
                    "1021–1024",
                    "Mythique « Vœu Suprême » → Netherite 5×5 (poids 10, pack)",
                  ],
                ],
              },
            ],
            list: [
              "Variantes 3×3 / 5×5 / 7×7 (sauf caisses ci-dessus) : /customitem, giveaway Discord, Ticket Légendaire (choix staff).",
              "Non vendues en boutique admin.",
            ],
          },
          {
            id: "cantaxe",
            title: "Cantaxe",
            paragraphs: [
              "Sur LOG / WOOD / STEM : BFS voisinage 3×3×3, plafond 100 bûches ; les extras passent par canBreakExtraBlock (claims).",
              "Lore : « One-shot tous les arbres » + « Mine comme une efficacité max ». Enchantable : Silk Touch, Unbreaking.",
            ],
            tables: [
              {
                headers: [
                  "Type",
                  "Enchantements",
                  "Durabilité",
                  "CMD",
                  "Obtention caisses",
                ],
                rows: [
                  [
                    "Cantaxe Fer",
                    "Efficiency V",
                    "Usure vanilla (pas d'Unbreaking à la création)",
                    "2001",
                    "Rare « Bénédiction Rare » (10) ; Épique « Mérite du Combattant » (20)",
                  ],
                  [
                    "Cantaxe Diamant",
                    "Efficiency VII",
                    "Usure vanilla",
                    "2002",
                    "Épique « Bénédiction Épique » (12) ; Mythique « Vœu de Vol » (17, pack)",
                  ],
                  [
                    "Cantaxe Netherite",
                    "Efficiency X",
                    "Commentaire « infini » sans setUnbreakable",
                    "2003",
                    "Mythique « Vœu Légendaire » (15, pack)",
                  ],
                ],
              },
            ],
          },
          {
            id: "multi-cantool",
            title: "Multi-Cantool",
            paragraphs: [
              "Listener : insta-break sur blocs minables (sauf AIR/BEDROCK, hors spawn protégé) ; drops via outil virtuel (pioche/hache/pelle/cisailles + Efficiency selon tier + Fortune III sur virtuel) ; damageItem(+1) à chaque casse gérée.",
              "Lore toujours « Mode 1x1 (un seul bloc) ». miningRadius = 1 pour les types …_1X1, = 0 pour la variante sans suffixe — aucune casse de zone ni abattage d'arbre dans handleMultiCantool. Différence de gameplay 1×1 vs sans suffixe : non documentée dans le code (CMD / display name distincts).",
            ],
            tables: [
              {
                headers: [
                  "Type",
                  "Enchantements item",
                  "Durabilité",
                  "CMD",
                  "Obtention caisses",
                ],
                rows: [
                  [
                    "Fer 1×1 / Fer",
                    "Unbreaking V · Efficiency V",
                    "Usure via damageItem (+ Unbreaking)",
                    "3001 / 3002",
                    "Vote « Coffre de Lames » → Fer 1×1 (poids 5) ; Rare idem (18)",
                  ],
                  [
                    "Diamant 1×1 / Diamant",
                    "Unbreaking VII · Efficiency VII",
                    "Usure via damageItem",
                    "3011 / 3012",
                    "Rare « Légende Rapprochée » → Diamant 1×1 (1) ; Épique « Multi-Outil Épique » → Diamant 1×1 (15)",
                  ],
                  [
                    "Netherite 1×1 / Netherite",
                    "Efficiency X",
                    "Commentaire « pas de durabilité » sans setUnbreakable ; damageItem reste appelé",
                    "3021 / 3022",
                    "Épique « Victoire Épique » → Netherite 1×1 (2) ; Mythique « Vœu de Vol » / « Vœu Suprême » → Netherite 1×1",
                  ],
                ],
              },
            ],
            list: [
              "Adaptateur visuel client (MultiCantoolVisualAdapter) : option config ; faux outil selon le bloc visé, même CMD.",
              "Variantes sans suffixe : staff / giveaway / Ticket Légendaire uniquement (absentes des tables de caisses).",
            ],
          },
          {
            id: "obtention",
            title: "Obtention (hors boutique)",
            tables: [
              {
                caption: "Sources confirmées dans le code",
                headers: ["Source", "Détail"],
                rows: [
                  [
                    "Caisses",
                    "CrateRewardTable — poids = chance relative dans la table (totaux Vote 98,5 ; Rare/Épique/Mythique 100). Voir aussi article Caisses.",
                  ],
                  [
                    "Ticket Légendaire",
                    "Audience Royale (poids 100) : ticket Discord → item au choix (staff).",
                  ],
                  [
                    "Vote",
                    "Donne des caisses Vote (Cadeau du Roi), pas d'outil custom direct.",
                  ],
                  [
                    "Giveaway Discord",
                    "Catégories Pickantaxe / Cantaxe / Multi-Cantool / Autres.",
                  ],
                  [
                    "/customitem <type> [joueur]",
                    "Permission cantale.admin (console : type + joueur).",
                  ],
                  [
                    "Shop Cantox",
                    "Aucun item custom listé dans shop.yml.",
                  ],
                ],
              },
            ],
          },
          {
            id: "apparence",
            title: "Apparence (resource pack)",
            paragraphs: [
              "CustomModelData posé à la création. Dispatch 1.21+ dans assets/minecraft/items/*.json → modèles cantale:item/…. Textures : PNG custom pour outils (pickantaxe_*, cantaxe_*, multicantool_*) selon docs/RESOURCE_PACK_GUIDE.md ; stubs garde/caisses en fallback vanilla tant que PNG manquants.",
            ],
          },
          {
            id: "commandes",
            title: "Commandes",
            commands: [
              {
                syntax: "/customitem <type> [joueur]",
                description:
                  "Donne n'importe quel CustomItemType (noms enum en minuscules, ex. pickantaxe_iron_3x3).",
                note: "Permission : cantale.admin",
              },
            ],
          },
        ],
      },
      {
        slug: "cantalame",
        title: "Cantalame",
        summary:
          "Épée netherite évolutive : kills uniques, paliers d'enchantements, drop de tête.",
        related: ["items-forges", "caisses-cles", "trois-vies"],
        sections: [
          {
            id: "base",
            title: "Base",
            tables: [
              {
                headers: ["Propriété", "Valeur (code)"],
                rows: [
                  ["Matériau", "NETHERITE_SWORD"],
                  ["CMD", "5001 → cantale:item/cantalame"],
                  ["Craft", "Non-craftable (lore)"],
                  [
                    "Durabilité",
                    "setUnbreakable(true) via CantalameManager.createCantalame()",
                  ],
                  [
                    "Progression",
                    "Kills de joueurs uniques (UUID), plafond 100 ; re-tuer le même UUID n'ajoute pas",
                  ],
                  [
                    "Trophée",
                    "À chaque kill compté : tête du vaincu droppée au sol (« Tête de <pseudo> »)",
                  ],
                ],
              },
            ],
            paragraphs: [
              "/customitem cantalame utilise CantalameManager (PDC cantalame + Unbreakable). Les caisses appellent createCustomItem(CANTALAME) : PDC custom_item + lore évolutive, sans clé cantalame ni Unbreakable — chemins distincts dans le code.",
            ],
          },
          {
            id: "paliers",
            title: "Paliers (CantalameManager.applyUpgrades)",
            tables: [
              {
                caption: "Seuils de kills uniques → enchantements cumulés (dernier seuil gagne)",
                headers: ["Kills", "Nom affiché", "Enchantements appliqués"],
                rows: [
                  ["0–4", "Débutant", "Aucun"],
                  ["5–9", "Novice", "Sharpness I"],
                  ["10–14", "Apprenti", "Sharpness II"],
                  ["15–19", "Compétent", "Sharpness III · Looting I"],
                  ["20–24", "Expérimenté", "Sharpness IV · Looting II"],
                  ["25–34", "Expert", "Sharpness V · Looting III · Fire Aspect I"],
                  ["35–44", "Maître", "+ Sweeping Edge III"],
                  ["45–54", "Grand Maître", "Fire Aspect II · Mending"],
                  ["55–64", "Légende", "Unbreaking III"],
                  ["65–74", "Mythique", "Knockback II"],
                  ["75–84", "Divin", "Sharpness X"],
                  ["85–94", "Démoniaque", "Smite V · Bane of Arthropods V"],
                  ["95–99", "Infernal", "Sweeping Edge V"],
                  [
                    "100",
                    "SURPUISSANT",
                    "Sharpness X · Looting V · Fire Aspect III · Sweeping Edge X · Unbreaking X",
                  ],
                ],
              },
            ],
          },
          {
            id: "obtention",
            title: "Obtention",
            tables: [
              {
                headers: ["Source", "Récompense", "Poids"],
                rows: [
                  ["Vote", "Chance Légendaire (+ 2500 Cantox)", "0,5 / 98,5"],
                  ["Rare", "Fortune Oubliée (+ 12000 Cantox)", "3"],
                  ["Épique", "Gloire du Tournoi (+ pommes + 30000)", "5"],
                  ["Épique", "Victoire Épique (pack + Multi Netherite 1×1 + Vie)", "2"],
                  ["Mythique", "Vœu Légendaire / Vœu Suprême (packs)", "15 / 10"],
                  ["Ticket Légendaire", "Item au choix via Discord", "100"],
                  ["/customitem / giveaway", "Staff", "—"],
                ],
              },
            ],
          },
        ],
      },
      {
        slug: "item-vie",
        title: "Item Vie",
        summary:
          "Totem consommable : +1 vie au clic-droit. Grades mensuels et caisses.",
        related: ["trois-vies", "items-forges", "caisses-cles", "grades-permissions"],
        sections: [
          {
            id: "effet",
            title: "Effet",
            tables: [
              {
                headers: ["Propriété", "Valeur (code)"],
                rows: [
                  ["Matériau", "TOTEM_OF_UNDYING"],
                  ["CMD", "7001"],
                  ["Usage", "Clic-droit air/bloc → LifeManager.addLife(+1), stack −1"],
                  ["Craft", "Non-craftable"],
                  [
                    "Plafond à l'usage",
                    "addLife n'applique pas de cap — plafond éventuel non documenté dans ce listener",
                  ],
                ],
              },
            ],
          },
          {
            id: "obtention",
            title: "Obtention",
            tables: [
              {
                headers: ["Source", "Détail"],
                rows: [
                  [
                    "Grades (mensuel)",
                    "Aventurier 1 · VIP 2 · Chèvre 3 items Vie / mois (PlayerRank.monthlyLives)",
                  ],
                  ["Vote", "Cadeau Exceptionnel (poids 1) : item + +1 vie directe + 1000 Cantox"],
                  ["Rare", "Trésor du Peuple (6) ; Légende Rapprochée (1, pack)"],
                  ["Épique", "Trophée du Champion (8) ; Victoire Épique (2, pack)"],
                  ["Mythique", "Vœu Légendaire (15, 1 Vie) ; Vœu Suprême (10, 2 Vies)"],
                  ["Ticket Légendaire / /customitem / giveaway", "Staff"],
                ],
              },
            ],
          },
        ],
      },
      {
        slug: "rune-de-fortification",
        title: "Rune de Fortification",
        summary:
          "1 rune = 1 chunk fortifié : casse réservée aux membres, explosions annulées, taxe 50 Cantox/jour.",
        related: ["claims-territoire", "vie-de-faction", "items-forges"],
        sections: [
          {
            id: "effet",
            title: "Effet",
            tables: [
              {
                headers: ["Propriété", "Valeur (code)"],
                rows: [
                  ["Matériau", "PAPER"],
                  ["CMD", "6001"],
                  ["Pose", "Clic-droit dans un claim de ta faction → consomme 1 rune, fortifie le chunk"],
                  [
                    "Retrait",
                    "Sneak + clic-droit (rune en main ou main vide) → défait + rend une rune",
                  ],
                  [
                    "Protection",
                    "Casse blocs : membres faction seulement ; explosions retirées du chunk fortifié",
                  ],
                  [
                    "Interactions",
                    "Coffres / inventaires non bloqués par la rune (commentaire listener)",
                  ],
                  ["Taxe", "50 Cantox / jour / chunk fortifié (TerritoryTaxManager)"],
                  [
                    "Impayé",
                    "Runes de la faction retirées en premier si solde insuffisant pour la taxe",
                  ],
                ],
              },
            ],
            list: [
              "Absente des tables de caisses (CrateRewardTable).",
              "Obtention joueur : staff (/customitem, giveaway catégorie Autres) — pas d'autre source dans le code.",
            ],
          },
        ],
      },
      {
        slug: "armure-du-garde",
        title: "Armure du Garde",
        summary:
          "4 pièces netherite : enchantements, bonus de set par pièce, obtention staff, CMD 9001–9004.",
        related: ["items-forges", "events-faction", "caisses-cles"],
        sections: [
          {
            id: "pieces",
            title: "Pièces",
            tables: [
              {
                headers: [
                  "Pièce",
                  "Matériau",
                  "CMD",
                  "Enchantements communs",
                  "Extras",
                ],
                rows: [
                  [
                    "Casque du Garde",
                    "NETHERITE_HELMET",
                    "9001",
                    "Protection IX · Thorns V · Unbreaking X · Mending",
                    "Respiration III · Aqua Affinity",
                  ],
                  [
                    "Plastron du Garde",
                    "NETHERITE_CHESTPLATE",
                    "9002",
                    "Protection IX · Thorns V · Unbreaking X · Mending",
                    "Aucun extra code",
                  ],
                  [
                    "Jambières du Garde",
                    "NETHERITE_LEGGINGS",
                    "9003",
                    "Protection IX · Thorns V · Unbreaking X · Mending",
                    "Swift Sneak III",
                  ],
                  [
                    "Bottes du Garde",
                    "NETHERITE_BOOTS",
                    "9004",
                    "Protection IX · Thorns V · Unbreaking X · Mending",
                    "Feather Falling IV · Depth Strider III · Soul Speed III",
                  ],
                ],
              },
            ],
            paragraphs: [
              "Durabilité : Unbreaking X + Mending (pas de setUnbreakable). Craft : non (lore).",
            ],
          },
          {
            id: "bonus",
            title: "Bonus de set (GardeArmorListener)",
            paragraphs: [
              "Chaque pièce Garde authentique équipée = 25 % du set. Modifiers NamespacedKey cantale:garde_health|speed|jump. Refresh join / respawn / changement d'armure / clic inventaire.",
            ],
            tables: [
              {
                headers: ["Pièces", "MAX_HEALTH", "MOVEMENT_SPEED", "JUMP_STRENGTH"],
                rows: [
                  ["1", "+3 HP (+1,5 cœur)", "+7,5 % (ADD_SCALAR)", "+6,25 %"],
                  ["2", "+6 HP", "+15 %", "+12,5 %"],
                  ["3", "+9 HP", "+22,5 %", "+18,75 %"],
                  ["4 (set)", "+12 HP (+6 cœurs)", "+30 %", "+25 %"],
                ],
              },
            ],
          },
          {
            id: "apparence",
            title: "Apparence",
            paragraphs: [
              "Modèles cantale:item/garde_* dispatchés sur netherite_* .json. Placeholders actuels : layer0 = texture vanilla netherite (PNG custom prévus dans docs/BlockbenchArtGuide.md, non livrés tant que checklist art ouverte).",
            ],
          },
          {
            id: "obtention",
            title: "Obtention",
            tables: [
              {
                headers: ["Source", "Statut"],
                rows: [
                  ["Caisses (CrateRewardTable)", "Absente"],
                  ["shop.yml", "Absente"],
                  ["/customitem garde_helmet|chestplate|leggings|boots", "Oui (cantale.admin)"],
                  ["Giveaway Discord → Autres", "Oui"],
                  ["Events faction / drop clé", "Non documenté comme drop d'armure dans le code"],
                ],
              },
            ],
          },
        ],
      },
      {
        slug: "caisses-cles",
        title: "Caisses & clés",
        summary:
          "Cinq types, interactions, sources de clés, ascension et butin custom.",
        featured: true,
        related: [
          "vote",
          "items-forges",
          "cantalame",
          "item-vie",
          "coffres-inventaires",
          "recompenses-regulieres",
        ],
        sections: [
          {
            id: "types",
            title: "Types & interactions",
            paragraphs: [
              "Tenir l'item + action au bon endroit (emplacements crate.yml).",
            ],
            tables: [
              {
                headers: ["Type", "Item", "Interaction"],
                rows: [
                  [
                    "Vote",
                    "Cadeau du Roi",
                    "Clic droit sur boîte aux lettres (BARREL / LOOM)",
                  ],
                  [
                    "Rare",
                    "Trésor Public (clef)",
                    "Clic droit sur le coffre spawn configuré",
                  ],
                  [
                    "Épique",
                    "Médaille du Tournoi",
                    "Clic droit sur balise ou table d'enchantement",
                  ],
                  [
                    "Mythique",
                    "Pièce Mythique",
                    "Jeter (Q) dans l'eau / zone fontaine",
                  ],
                  [
                    "Légendaire",
                    "Ticket Légendaire",
                    "Clic droit → ticket Discord numéroté (choix staff)",
                  ],
                ],
              },
            ],
          },
          {
            id: "sources",
            title: "Sources de clés",
            list: [
              "Vote : 1–2 Cadeaux du Roi selon le site ; Vote Party (50 votes/jour) → 1 Cadeau à un online.",
              "Paliers votes : 10 → 2× Vote ; 50 → 1× Rare ; 100 → 1× Épique.",
              "Top mensuel votes : 1er Légendaire, 2e Mythique, 3e Épique.",
              "Drop hebdo : 1 online → Rare / Épique / Mythique (1/3).",
              "Staff : /crate give …",
            ],
          },
          {
            id: "butin-custom",
            title: "Butin items custom (poids)",
            paragraphs: [
              "Poids relatifs dans CrateRewardTable. Ascension d'un cran à l'ouverture : Vote→Rare 4 % ; Rare→Épique 5 % ; Épique→Mythique 5 % ; Mythique→Légendaire 4 % (nouvel item à rouvrir avec le rituel correspondant).",
            ],
            tables: [
              {
                caption: "Récompenses qui donnent un item custom",
                headers: ["Caisse", "Nom", "Poids", "Items custom"],
                rows: [
                  ["Vote", "Coffre de Lames", "5", "Multi-Cantool Fer 1×1"],
                  ["Vote", "Cadeau Exceptionnel", "1", "Vie (+1 vie directe)"],
                  ["Vote", "Chance Légendaire", "0,5", "Cantalame*"],
                  ["Rare", "Coffre de Lames", "18", "Multi-Cantool Fer 1×1"],
                  ["Rare", "Pic du Mineur", "15", "Pickantaxe Fer 1×1"],
                  ["Rare", "Bénédiction Rare", "10", "Cantaxe Fer"],
                  ["Rare", "Trésor du Peuple", "6", "Vie"],
                  ["Rare", "Fortune Oubliée", "3", "Cantalame*"],
                  ["Rare", "Légende Rapprochée", "1", "Multi-Cantool Diamant 1×1 + Vie"],
                  ["Épique", "Mérite du Combattant", "20", "Cantaxe Fer"],
                  ["Épique", "Pic de Maître", "18", "Pickantaxe Diamant 1×1"],
                  ["Épique", "Multi-Outil Épique", "15", "Multi-Cantool Diamant 1×1"],
                  ["Épique", "Bénédiction Épique", "12", "Cantaxe Diamant"],
                  ["Épique", "Trophée du Champion", "8", "Vie"],
                  ["Épique", "Gloire du Tournoi", "5", "Cantalame*"],
                  [
                    "Épique",
                    "Victoire Épique",
                    "2",
                    "Cantalame* + Multi Netherite 1×1 + Vie",
                  ],
                  ["Mythique", "Vœu de Puissance", "18", "Pickantaxe Diamant 3×3"],
                  [
                    "Mythique",
                    "Vœu de Vol",
                    "17",
                    "Multi Netherite 1×1 + Cantaxe Diamant",
                  ],
                  [
                    "Mythique",
                    "Vœu Légendaire",
                    "15",
                    "Cantalame* + Cantaxe Netherite + Vie",
                  ],
                  [
                    "Mythique",
                    "Vœu Suprême",
                    "10",
                    "Cantalame* + Multi Netherite 1×1 + Pickantaxe Netherite 5×5 + 2× Vie",
                  ],
                  ["Légendaire", "Audience Royale", "100", "Choix Discord (staff)"],
                ],
              },
            ],
            list: [
              "* Cantalame caisses : createCustomItem (voir article Cantalame).",
              "Armure du Garde et Rune : absentes de ces tables.",
            ],
          },
          {
            id: "regles",
            title: "Règles",
            list: [
              "Inventaire plein → surplus vers /pc.",
              "Annonce publique : Mythique et Légendaire seulement.",
              "Ticket Légendaire (ouverture normale) → ticket Discord. Le code prévoit aussi le grade Chèvre si un Cadeau du Roi aboutit en Légendaire.",
            ],
          },
          {
            id: "admin",
            title: "Côté staff",
            commands: [
              {
                syntax:
                  "/crate give <joueur> <vote|rare|epic|mythic|legendary> [quantité]",
                description: "Donne une caisse à un joueur.",
                note: "Permission : cantale.admin",
              },
              {
                syntax: "/crate reload",
                description: "Recharge crate.yml (emplacements).",
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
      "Coffres, Discord, site, AFK, clear-lag, profil et tags : les systèmes transverses.",
    articles: [
      {
        slug: "coffres-inventaires",
        title: "Coffres & inventaires",
        summary:
          "Coffres privés virtuels (/pc, /pc2, /pc3) : tailles et accès selon PrivateChestService et le grade.",
        related: ["caisses-cles", "grades-permissions", "commandes-joueur"],
        sections: [
          {
            id: "coffres",
            title: "Coffres privés",
            paragraphs: [
              "Contenu sauvegardé en base et mis en cache. Nombre de coffres : Joueur/Aventurier = 1 · VIP = 2 · Chèvre/staff = 3. Taille : 27 slots pour Joueur, 54 pour tous les autres grades.",
            ],
            commands: [
              {
                syntax: "/pc",
                description: "Ouvre le coffre privé #1.",
                note: "Tous les joueurs",
              },
              {
                syntax: "/pc2",
                description: "Ouvre le coffre privé #2.",
                note: "VIP, Chèvre, staff (cantale.admin traité comme Chèvre pour l'accès)",
              },
              {
                syntax: "/pc3",
                description: "Ouvre le coffre privé #3.",
                note: "Chèvre / staff",
              },
              {
                syntax: "/ec",
                description:
                  "Ouvre l'Ender Chest vanilla Minecraft (migration éventuelle depuis l'ancien stockage virtuel).",
                note: "Tous les joueurs",
              },
              {
                syntax: "/adminpc <joueur> [1|2|3]",
                description: "Staff : ouvre/édite les PC d'un joueur (DB, online ou offline).",
                note: "cantale.moderator — aliases /apc, /sepc",
              },
              {
                syntax: "/adminec <joueur>",
                description:
                  "Staff : ouvre l'EC (live si online ; hors ligne = legacy DB seulement, Paper n'expose pas OfflinePlayer#getEnderChest).",
                note: "cantale.moderator — aliases /aec, /seeec",
              },
            ],
          },
        ],
      },
      {
        slug: "afk-clearlag",
        title: "AFK & clear-lag",
        summary:
          "Délais de kick AFK par grade, clear-lag des items au sol, plafond d'entités par chunk, et empilement des animaux passifs.",
        related: ["grades-permissions", "teleportation", "claims-territoire"],
        sections: [
          {
            id: "afk",
            title: "Kick AFK",
            paragraphs: [
              "Sans activité (changement de bloc ou de regard, message chat, commande, clic / interaction), le serveur te déconnecte. Message de kick : inactivité avec le nombre de minutes du palier.",
            ],
            list: [
              "Joueur — 10 minutes.",
              "Aventurier — 30 minutes.",
              "VIP — 60 minutes.",
              "Chèvre / Modérateur / Admin / Owner — pas de kick AFK.",
            ],
          },
          {
            id: "clearlag",
            title: "Clear-lag (items au sol)",
            paragraphs: [
              "Toutes les 3 minutes (180 s par défaut), le serveur supprime les items au sol dans tous les mondes. Ce n'est pas une commande joueur : tu vois seulement les annonces et le bilan.",
            ],
            list: [
              "Avertissements dans le chat à 30 s, puis 10, 5, 3, 2 et 1 seconde avant le clear.",
              "À l'instant T : annonce du nombre d'items supprimés (items récents / loot de mort protégés quelques minutes).",
              "Le clear annoncé concerne les items au sol — pas l'inventaire.",
              "Au même moment (et aussi ~toutes les 60 s via l'optimiseur) : plafond de 15 entités par chunk pour hostiles, armor stands, bateaux, etc. — pas les animaux passifs (voir empilement).",
              "Toujours protégés du plafond : joueurs, villageois, items, Animals, mobs nommés (hors stacks Cantale), bêtes apprivoisées (Tameable), NPCs Cantale.",
            ],
          },
          {
            id: "mob-stacking",
            title: "Empilement des animaux passifs",
            paragraphs: [
              "Les animaux de ferme d'un même type (et même variante) proches sont empilés en une seule entité simulée, avec un libellé au-dessus du type « Mouton ×12 ». Cela remplace le cull des Animals : les fermes denses ne sont plus réduites à 15 têtes par chunk.",
            ],
            list: [
              "Types empilés : mouton, vache, poulet, cochon, lapin, champimeuh, chèvre.",
              "Moutons : même couleur et même état tondu/laine (un stack « tondu » reste séparé d'un stack « laine »).",
              "Non empilés (défaut) : bébés, mobs nommés par un joueur, Tameable apprivoisés, entités en laisse ou avec passager.",
              "Kill / dégâts létaux : le stack diminue de 1, loot + XP d'une mort vanilla ; l'entité reste jusqu'au dernier. Le dernier kill retire vraiment le mob.",
              "Tonte / reproduction : comportement vanilla sur l'entité visible (le stack entier peut apparaître tondu ; la reproduction spawn un bébé non empilé).",
              "Config : optimization.mob-stacking (enabled, max-stack, radius, interval-seconds, stack-babies / named / tamed).",
            ],
          },
        ],
      },
      {
        slug: "discord-site",
        title: "Discord & site",
        summary:
          "Liaison Discord (/link + slash Discord), /linkforce admin, compte site (OAuth Discord sur /connexion), salon compteur.",
        related: ["profil-tags", "commandes-joueur", "vie-de-faction"],
        sections: [
          {
            id: "liaison-discord",
            title: "Liaison Discord ↔ Minecraft",
            paragraphs: [
              "Un seul flux joueur : le code est créé en jeu, validé sur Discord.",
            ],
            list: [
              "1. En jeu : /link — si tu n'es pas déjà lié, le serveur génère un code à 6 caractères (alphabet sans I/O/0/1), valable 10 minutes. Clique sur le code pour le copier (hover « Clique pour copier »).",
              "2. Sur Discord (invite discord.gg/eDTfYWtuYp) : slash /link avec le code et ton pseudo Minecraft exact (majuscules).",
              "3. Succès : entrée dans discord_links, rôle Joueur Discord attribué, sync du rôle de faction si tu en as une.",
              "Si un code actif existe déjà, /link le réaffiche au lieu d'en créer un nouveau. Compte déjà lié : message d'erreur (changement via admin).",
            ],
            commands: [
              {
                syntax: "/link",
                description: "Génère ou réaffiche le code de liaison Discord (Minecraft).",
                note: "Tous les joueurs",
              },
              {
                syntax: "/link <code> <pseudo>",
                description: "Slash Discord : valide le code et le pseudo Minecraft.",
                note: "Bot Discord CANTALE",
              },
            ],
          },
          {
            id: "linkforce",
            title: "Liaison forcée (admin)",
            paragraphs: [
              "Pour corriger un compte sans passer par le code joueur.",
            ],
            commands: [
              {
                syntax: "/linkforce <Pseudo MC> <ID Discord>",
                description:
                  "Force la liaison Discord ↔ Minecraft (upsert discord_links, gère les conflits, invalide les codes en attente).",
                note: "Minecraft : cantale.admin · Discord slash : permission ADMINISTRATOR",
              },
            ],
          },
          {
            id: "compte-site",
            title: "Compte sur le site (cantale.world)",
            paragraphs: [
              "Le site Next.js se connecte via Discord OAuth (page /connexion), pas un mot de passe. Paliers : anonymous → discord (OAuth OK) → linked (présence dans discord_links) → leader (rôle leader Discord).",
            ],
            list: [
              "Visiteur : « Se connecter avec Discord » sur /connexion.",
              "Discord connecté mais pas de ligne discord_links : le site demande de faire /link en jeu puis /link sur Discord, puis de recharger la page.",
              "Compte lié : profil (skin, vies, stats, faction) et capacités selon les rôles Discord.",
            ],
          },
          {
            id: "web-link",
            title: "Ancienne commande /web link (obsolète)",
            paragraphs: [
              "L'ancien flux « code 6 chiffres sur le site → /web link en jeu » n'existe plus. Le site se connecte uniquement via Discord OAuth sur https://www.cantale.world/connexion. La commande /web (alias /website, /site) affiche encore ce lien en jeu. La liaison Discord ↔ Minecraft reste /link (Minecraft) puis /link (slash Discord).",
            ],
          },
          {
            id: "apres-liaison",
            title: "Après liaison Discord",
            commands: [
              {
                syntax: "/discord <message>",
                description: "Envoie un message sur le salon Discord chat depuis Minecraft.",
                note: "Tous les joueurs",
              },
              {
                syntax: "/discord mp <joueur> <message>",
                description:
                  "MP Discord au compte lié (pseudo MC ou nom Discord stocké).",
                note: "Tous les joueurs",
              },
              {
                syntax: "/daily",
                description:
                  "Aussi disponible en slash Discord une fois le compte lié (même quota journalier).",
                note: "Alias Discord : /journalier",
              },
            ],
            list: [
              "Tickets support et Ticket Légendaire : côté Discord.",
              "Rôle de faction Discord synchronisé quand tu rejoins / quittes une faction.",
            ],
          },
          {
            id: "salon-compteur",
            title: "Salon compteur",
            paragraphs: [
              "Un salon Discord dédié fait progresser un compteur partagé. Le bot vérifie le nombre et laisse le chat libre quand il n'y a aucun chiffre.",
            ],
            list: [
              "Avec un chiffre : le nombre du compteur doit être le précédent + 1 (souvent en début de message, ou seul nombre du message). Sinon le message est supprimé et un court avertissement s'affiche.",
              "Sans aucun chiffre : tu peux écrire librement ; le compteur n'avance pas.",
              "Le compteur est sauvegardé côté serveur (reprise après redémarrage du bot).",
            ],
          },
        ],
      },
      {
        slug: "profil-tags",
        title: "Profil, tags & bossbar",
        summary:
          "/profile : statistiques, tags cosmétiques et réglage de la bossbar d'infos.",
        related: ["discord-site", "commandes-joueur", "events-faction", "reactions-chat"],
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
              "Une barre personnelle tourne toutes les 5 secondes (réglable serveur) : Cantox → vies → faction (si tu en as une) → prime wanted (si > 0) → événement de faction (si actif) → réaction chat (si active) → tag de combat (si tagué). Tu peux la désactiver depuis /profile.",
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
          ...(section.tables ?? []).flatMap((table) => [
            table.caption ?? "",
            ...table.headers,
            ...table.rows.flat(),
          ]),
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
