# Cantale Backend

Backend Express/TypeScript pour le site Cantale.
Auth par liaison in-game, profils joueurs, leaderboards, factions, panier de boutique.

---

## Architecture

```
Internet → nginx (443/SSL) ─┬─► /        → site statique (HTML/CSS/JS)
                            └─► /api/    → Node Express (port 3000, reverse proxy)
                                          │
                                          └─► DB partagée (SQLite ou MySQL)
                                                  ↑
                                          plugin Cantale (Java) écrit aussi ici
```

**Source de vérité unique** : la base de données partagée avec le plugin Minecraft.
Le backend lit la majorité des données (`players`, `factions`, `claims`, etc.) et n'écrit
que dans ses tables propres (préfixées `web_*`).

---

## Stack

- **Node.js ≥ 20**, **TypeScript 5**
- **Express 4** (routing + middleware)
- **better-sqlite3** ou **mysql2/promise** (selon `DB_TYPE`)
- **cookie-parser** + **express-rate-limit** pour la sécurité
- Pas de framework lourd, pas d'ORM — SQL brut pour rester rapide

---

## Routes principales

| Méthode | Endpoint                          | Description                                        | Auth |
| ------- | --------------------------------- | -------------------------------------------------- | ---- |
| `GET`   | `/api/health`                     | Ping (env, shopEnabled)                            | —    |
| `POST`  | `/api/auth/request-link`          | Génère un code 6 chiffres à taper in-game          | —    |
| `GET`   | `/api/auth/check-link/:code`      | Poll : retourne `pending` ou `linked` + set cookie | —    |
| `GET`   | `/api/auth/me`                    | Renvoie l'utilisateur courant                      | ✓    |
| `POST`  | `/api/auth/logout`                | Invalide la session                                | ✓    |
| `GET`   | `/api/players/:idOrName`          | Profil public d'un joueur                          | —    |
| `GET`   | `/api/players/me/profile`         | Profil détaillé de l'utilisateur courant           | ✓    |
| `GET`   | `/api/factions`                   | Liste de toutes les factions visibles              | —    |
| `GET`   | `/api/factions/:idOrTag`          | Détails d'une faction (membres, claims)            | —    |
| `GET`   | `/api/leaderboards`               | Tous les classements (kills, balance, votes, …)    | —    |
| `GET`   | `/api/leaderboards/:type`         | Un classement spécifique                           | —    |
| `GET`   | `/api/shop/catalog`               | Catalogue + flag `enabled`                         | —    |
| `GET`   | `/api/shop/cart`                  | Panier du joueur connecté                          | ✓    |
| `POST`  | `/api/shop/cart`                  | Ajouter un item `{itemId, quantity?}`              | ✓    |
| `PATCH` | `/api/shop/cart/:itemId`          | Modifier la quantité                               | ✓    |
| `DELETE`| `/api/shop/cart/:itemId`          | Retirer un item                                    | ✓    |
| `POST`  | `/api/shop/cart/clear`            | Vider le panier                                    | ✓    |
| `POST`  | `/api/shop/checkout`              | 503 tant que `SHOP_ENABLED=false`                  | ✓    |

---

## Flux d'authentification

```
┌──────────┐         ┌─────────┐         ┌──────────┐         ┌─────────────┐
│ Frontend │         │ Backend │         │   DB     │         │  Plugin MC  │
└────┬─────┘         └────┬────┘         └────┬─────┘         └──────┬──────┘
     │  POST /request-link │                  │                      │
     │ ───────────────────▶│                  │                      │
     │                     │ INSERT code      │                      │
     │                     │ ────────────────▶│                      │
     │   { code: 123456 }  │                  │                      │
     │ ◀───────────────────│                  │                      │
     │                     │                  │                      │
     │  GET /check-link/123456 (toutes 2s)    │                      │
     │ ───────────────────▶│                  │                      │
     │                     │ SELECT code      │                      │
     │                     │ ────────────────▶│                      │
     │      pending        │                  │                      │
     │ ◀───────────────────│                  │                      │
     │                     │           Joueur tape /web link 123456  │
     │                     │                  │   UPDATE consumed    │
     │                     │                  │◀─────────────────────│
     │  GET /check-link/123456 (poll suivant) │                      │
     │ ───────────────────▶│                  │                      │
     │                     │ SELECT (consommé)│                      │
     │                     │ ────────────────▶│                      │
     │                     │ INSERT session   │                      │
     │                     │ ────────────────▶│                      │
     │  { linked, user }   │                  │                      │
     │  Set-Cookie: ...    │                  │                      │
     │ ◀───────────────────│                  │                      │
```

Sécurité :
- Le cookie de session est `HttpOnly`, `SameSite=Lax`, et `Secure` en production.
- Rate-limit : 5 requests/min/IP sur `/request-link`.
- Pas de mot de passe à gérer — la possession du compte Minecraft suffit.

---

## Installation

### Prérequis

- Node.js ≥ 20 (`node --version`)
- npm ou pnpm
- Le plugin Cantale doit tourner et avoir déjà initialisé sa DB (table `players` non vide)

### Setup

```bash
cd Site-Cantale/backend
cp .env.example .env       # ✏ éditer les valeurs
npm install
npm run build
npm start                   # ou : pm2 start dist/server.js --name cantale-api
```

### Variables d'environnement clés

| Variable          | Description                                          | Défaut             |
| ----------------- | ---------------------------------------------------- | ------------------ |
| `PORT`            | Port d'écoute Express                                | `3000`             |
| `NODE_ENV`        | `production` ou `development`                        | `development`      |
| `DB_TYPE`         | `sqlite` ou `mysql`                                  | `sqlite`           |
| `SQLITE_PATH`     | Chemin vers le fichier .db du plugin                 | —                  |
| `MYSQL_*`         | Credentials MySQL (si `DB_TYPE=mysql`)               | —                  |
| `SESSION_SECRET`  | Secret aléatoire 32+ chars                           | (dev only)         |
| `COOKIE_DOMAIN`   | Domaine du cookie (ex `.cantale.fr`)                 | vide               |
| `CORS_ORIGINS`    | Origines autorisées, séparées par `,`                | localhost only     |
| `LINK_CODE_TTL`   | Durée de vie d'un code de liaison (secondes)         | `300`              |
| `SESSION_TTL`     | Durée de session (secondes)                          | `604800` (7j)      |
| `SHOP_ENABLED`    | Si `false`, checkout renvoie 503 (panier OK quand même) | `false`         |

**SESSION_SECRET** : générer avec :
```bash
openssl rand -hex 32
```

---

## Déploiement VPS Linux (recommandé)

### 1. Cloner & build

```bash
cd /var/www
git clone <repo> cantale
cd cantale/Site-Cantale/backend
cp .env.example .env
nano .env                              # configurer DB et secrets
npm install --production=false
npm run build
```

### 2. PM2 (gestionnaire de process)

```bash
sudo npm install -g pm2
pm2 start dist/server.js --name cantale-api --max-memory-restart 256M
pm2 save
pm2 startup                            # suivre les instructions pour systemd
```

### 3. Nginx reverse proxy + statique

```nginx
# /etc/nginx/sites-available/cantale.fr
server {
  listen 80;
  server_name cantale.fr www.cantale.fr;
  return 301 https://cantale.fr$request_uri;
}

server {
  listen 443 ssl http2;
  server_name cantale.fr;

  ssl_certificate     /etc/letsencrypt/live/cantale.fr/fullchain.pem;
  ssl_certificate_key /etc/letsencrypt/live/cantale.fr/privkey.pem;
  include             /etc/letsencrypt/options-ssl-nginx.conf;

  # Site statique (HTML, CSS, JS)
  root /var/www/cantale/Site-Cantale;
  index index.html;

  # API → backend Node
  location /api/ {
    proxy_pass http://127.0.0.1:3000;
    proxy_http_version 1.1;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
  }

  # Fallback pour les routes HTML (clean URLs)
  location / {
    try_files $uri $uri.html $uri/ =404;
  }

  # Cache statique
  location ~* \.(css|js|png|jpg|svg|webp|woff2)$ {
    expires 7d;
    add_header Cache-Control "public";
  }
}
```

```bash
sudo ln -s /etc/nginx/sites-available/cantale.fr /etc/nginx/sites-enabled/
sudo certbot --nginx -d cantale.fr -d www.cantale.fr
sudo nginx -t && sudo systemctl reload nginx
```

### 4. Vérifier

```bash
curl https://cantale.fr/api/health
# → {"ok":true,"env":"production","shopEnabled":false}
```

---

## Côté plugin Minecraft

Le plugin écrit dans la **même DB** (SQLite ou MySQL) et expose la commande `/web link <code>` (voir `@/Users/Noe/Cantale/src/main/java/fr/cantale/plugin/commands/WebCommand.java`).

Pour que ça fonctionne :
- Si `DB_TYPE=sqlite` : le backend et le plugin doivent tourner sur **la même machine** (chemin fichier partagé).
- Si `DB_TYPE=mysql` : le plugin et le backend pointent sur **la même base MySQL** (recommandé en production).

**Le plugin n'a pas besoin d'API externe** — il consomme directement les codes de liaison via SQL.

---

## Activation de la boutique le jour J

1. Intégrer Stripe (ou PayPal) dans `src/routes/shop.ts` → `/checkout`
2. Mettre `SHOP_ENABLED=true` dans `.env`
3. Redémarrer : `pm2 restart cantale-api`
4. Retirer la bannière dans `boutique.html` (lignes 296-302)

---

## Sécurité

- ✅ Cookies HttpOnly + Secure + SameSite=Lax
- ✅ Rate-limit sur `/request-link` (5/min/IP)
- ✅ Codes de liaison à usage unique, expirent en 5 min
- ✅ Sessions liées à l'UUID Mojang (donc à l'identité MC vérifiée)
- ✅ Le backend ne fait jamais confiance au `player_name` envoyé par le client
- ✅ CORS strict via whitelist
- ⚠️ **À configurer** : firewall (UFW) pour bloquer le port 3000 en externe ; nginx fait le proxy

---

## Maintenance

| Action                            | Commande                                    |
| --------------------------------- | ------------------------------------------- |
| Voir les logs                     | `pm2 logs cantale-api`                      |
| Redémarrer                        | `pm2 restart cantale-api`                   |
| Statut                            | `pm2 status`                                |
| Voir le nombre de sessions actives | `sqlite3 cantale.db "SELECT COUNT(*) FROM web_sessions WHERE expires_at > strftime('%s','now');"` |
| Purger codes expirés              | Automatique (cron interne toutes les 5 min) |

---

## Développement local

```bash
npm run dev                # tsx watch, rechargement à chaud
# Frontend : ouvrir Site-Cantale/index.html avec Live Server (port 5500)
# Dans index.html, en haut du <head> : <script>window.CANTALE_API_BASE='http://localhost:3000/api'</script>
```

---

## Roadmap

- [ ] Intégration Stripe (`/checkout`)
- [ ] Page admin (kick/ban via web, gérer les votes manuellement)
- [ ] Webhook Discord pour les achats
- [ ] Cache Redis pour les leaderboards (TPS si > 1000 joueurs)
- [ ] OAuth Microsoft en alternative (pour utilisateurs offline)
