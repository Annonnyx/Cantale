# Guide de Déploiement — Site Cantale (SFTP)

## 🔴 Informations PixelHorizons (ton hébergeur)

| Info | Valeur |
|------|--------|
| Domaine web | `https://cantale.pixelhorizons.fr` |
| IP serveur | `82.66.173.236` |
| Port backend | `3001` (attribué par le provider) |
| Serveur MC | `play-cantale.pixelhorizons.fr` → `82.66.173.236:25580` |
| Accès | SFTP (+ probablement SSH/panel pour démarrer Node.js) |

**Ce que fait le provider :**
- Le reverse proxy sur `cantale.pixelhorizons.fr` est géré par eux.
- Ils attendent que ton backend écoute sur le port `3001`.
- Le frontend (fichiers HTML/CSS/JS) est à uploader via SFTP dans ton dossier web.

**Ce que tu dois faire :**
1. Compiler le backend en local
2. Uploader frontend + backend compilé via SFTP
3. Démarrer le backend sur le port 3001 (SSH ou panel)

---

## Architecture
- **Frontend** : HTML/CSS/JS statiques (pas de framework)
- **Backend** : Node.js + Express + TypeScript (API REST)
- **Port** : 3001
- **Hébergement** : PixelHorizons — accès SFTP + probablement panel SSH

---

## 1. Préparation locale (sur ta machine)

### A. Compiler le backend TypeScript

```bash
cd /Users/Noe/Cantale/Site-Cantale/backend
npm install
npm run build
```

Cela crée le dossier `dist/` avec le JS compilé.

### B. Vérifier les fichiers à transférer

**Frontend** (à la racine du site web) :
```
index.html
boutique.html
cart.html
login.html
profile.html
factions.html
faction.html
leaderboards.html
liste.html
palliers.html
recrutement.html
regles.html
style.css
scripts.js
config.js          ← config API base URL (pixelhorizons)
api-client.js
```

**Backend** (dans un dossier dédié sur le serveur, ex: `~/cantale-backend/`) :
```
backend/package.json
backend/dist/          (dossier généré par npm run build)
backend/.env           (à créer sur le serveur, voir §3)
```

> **Ne pas transférer** : `node_modules/`, `src/`, `tsconfig.json`, `.env.example`

### C. Config API — `config.js`

Le fichier `config.js` définit l'URL de l'API backend. Par défaut :

```js
window.CANTALE_API_BASE = '/api';
```

**Option 1 (la plus probable)** : Si le provider forward `/api` vers ton backend :
- Laisser `/api` — ça fonctionne automatiquement.

**Option 2** : Si le backend est accessible directement sur le port 3001 :
- Changer dans `config.js` :
```js
window.CANTALE_API_BASE = 'https://cantale.pixelhorizons.fr:3001/api';
```
- ⚠️ Vérifie que le provider autorise le HTTPS sur le port 3001, sinon utiliser `http://` (risque de mixed-content).

> **Test rapide** : après déploiement, ouvre `https://cantale.pixelhorizons.fr:3001/api/health` dans ton navigateur. Si tu vois `{"status":"ok"}`, l'Option 2 marche.

---

## 2. Transfert SFTP

### Méthode A — Ligne de commande (sftp)

```bash
# Se connecter
sftp -P 22 utilisateur@ton-serveur.com

# Transférer le frontend
put -r /Users/Noe/Cantale/Site-Cantale/*.html /www/
put -r /Users/Noe/Cantale/Site-Cantale/*.css /www/
put -r /Users/Noe/Cantale/Site-Cantale/*.js /www/

# Transférer le backend
mkdir /home/utilisateur/cantale-backend
put -r /Users/Noe/Cantale/Site-Cantale/backend/package.json /home/utilisateur/cantale-backend/
put -r /Users/Noe/Cantale/Site-Cantale/backend/dist /home/utilisateur/cantale-backend/
```

### Méthode B — GUI (FileZilla, Cyberduck)

1. Connexion : `sftp://utilisateur@ton-serveur.com:22`
2. Drag & drop les fichiers `.html`, `.css`, `.js` vers `/www/` ou `/public_html/`
3. Créer un dossier `/home/utilisateur/cantale-backend/` et y mettre `package.json` + `dist/`

---

## 3. Configuration serveur (SSH / Panel)

> **Si tu n'as que SFTP (pas de SSH shell)** : demande à PixelHorizons comment démarrer une app Node.js. Certains providers utilisent un panel (type Pterodactyl) où tu upload les fichiers et cliques "Start". Dans ce cas, compile en local, upload tout le dossier backend (avec `dist/` et `node_modules/` si possible), et démarre via le panel.

### A. Se connecter au serveur (si SSH disponible)

```bash
ssh utilisateur@82.66.173.236
```

### B. Installer Node.js (si pas déjà présent)

```bash
# Vérifier
node -v
npm -v

# Si absent, installer via NVM (recommandé)
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash
source ~/.bashrc
nvm install 20
nvm use 20
node -v  # doit afficher v20.x.x
```

### C. Installer les dépendances backend

```bash
cd ~/cantale-backend
npm install --production
```

### D. Créer le fichier `.env`

```bash
nano ~/cantale-backend/.env
```

Coller et adapter :

```env
NODE_ENV=production
PORT=3001

# Base de données (même que le plugin Minecraft)
DB_TYPE=sqlite
DB_PATH=./cantale.db
# OU MySQL :
# DB_TYPE=mysql
# DB_HOST=localhost
# DB_PORT=3306
# DB_USER=cantale_user
# DB_PASSWORD=ton_mot_de_passe
# DB_NAME=cantale

# Session
SESSION_SECRET=change_moi_par_une_chaine_longue_et_aleatoire_64_caracteres_min
SESSION_MAX_AGE_DAYS=7

# CORS — domaine PixelHorizons
CORS_ORIGIN=https://cantale.pixelhorizons.fr

# Shop
SHOP_ENABLED=false
```

> **Important** : `SESSION_SECRET` doit être une chaîne longue et aléatoire.

---

## 4. Lancer le backend avec PM2

PM2 assure que le processus redémarre automatiquement après un crash ou un reboot.

### Installer PM2

```bash
npm install -g pm2
```

### Démarrer l'application

```bash
cd ~/cantale-backend
pm2 start dist/server.js --name "cantale-backend" -- --port 3001
```

### Sauvegarder la config PM2 (pour redémarrage auto au boot)

```bash
pm2 save
pm2 startup systemd
# Copier la commande affichée et l'exécuter avec sudo
```

### Commandes utiles PM2

```bash
pm2 status                 # Voir l'état
pm2 logs cantale-backend   # Voir les logs
pm2 restart cantale-backend
pm2 stop cantale-backend
pm2 delete cantale-backend
```

---

## 5. Exposer le port 3001

### A. Vérifier que le port est ouvert

```bash
# Sur le serveur
sudo ss -tlnp | grep 3001
```

Si le port n'est pas ouvert, ajouter une règle firewall :

```bash
# UFW (Ubuntu/Debian)
sudo ufw allow 3001/tcp

# Firewalld (CentOS/RHEL)
sudo firewall-cmd --permanent --add-port=3001/tcp
sudo firewall-cmd --reload
```

### B. Option 1 — Backend direct (API sur :3001)

Le frontend appelle l'API sur `https://ton-site.com:3001`.

Dans `api-client.js`, changer la base URL :

```js
const BASE_URL = 'https://ton-site.com:3001';
```

> Inconvénient : le navigateur bloque parfois les requêtes cross-origin ou mixed-content (http vs https).

### B. Option 2 — Reverse Proxy Nginx (RECOMMANDÉ)

Créer une config Nginx pour que `/api/` pointe vers le backend local sur le port 3001.

```bash
sudo nano /etc/nginx/sites-available/cantale
```

```nginx
server {
    listen 80;
    server_name ton-site.com www.ton-site.com;

    root /var/www/cantale;
    index index.html;

    # Frontend statique
    location / {
        try_files $uri $uri/ =404;
    }

    # Backend API (proxy vers Node.js sur port 3001)
    location /api/ {
        proxy_pass http://127.0.0.1:3001/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Activer le site :

```bash
sudo ln -s /etc/nginx/sites-available/cantale /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

Dans `api-client.js`, utiliser un chemin relatif :

```js
const BASE_URL = '/api';
```

> Avantage : pas de CORS, pas de port exposé, tout passe par le port 80/443.

---

## 6. HTTPS (SSL) — Certbot (recommandé)

```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d ton-site.com -d www.ton-site.com
```

Certbot configure automatiquement Nginx pour HTTPS.

---

## 7. Vérification finale

| Étape | Commande / Test |
|-------|-----------------|
| Backend running | `pm2 status` → `cantale-backend` en vert (ou panel) |
| Port 3001 ouvert | `curl http://127.0.0.1:3001/api/players/me` depuis le serveur |
| API accessible | Depuis ton PC : `curl https://cantale.pixelhorizons.fr:3001/api/players/me` |
| Frontend OK | Ouvrir `https://cantale.pixelhorizons.fr` dans le navigateur |
| Logs en cas de pb | `pm2 logs cantale-backend` (ou panel du provider) |

---

## Récapitulatif des chemins sur le serveur

```
/var/www/cantale/          ← Frontend (HTML, CSS, JS)
/home/utilisateur/cantale-backend/  ← Backend (package.json, dist/, .env)
```

---

## Notes importantes

1. **Database** : Le backend et le plugin Minecraft doivent partager la même base de données (`cantale.db` ou MySQL). Copie ta DB locale sur le serveur si tu veux les mêmes données.

2. **CORS** : Si le frontend et le backend sont sur le même domaine (option Nginx), le CORS est géré automatiquement. Sinon, vérifie que `CORS_ORIGIN` correspond bien à ton domaine frontend.

3. **Sessions** : Les cookies de session sont `HttpOnly` et `Secure` en production. Assure-toi d'utiliser HTTPS.

4. **Shop** : `SHOP_ENABLED=false` par défaut. Change en `true` quand tu seras prêt à activer les paiements.
