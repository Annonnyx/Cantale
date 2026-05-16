#!/bin/bash
# ╔════════════════════════════════════════════════════════════╗
# ║  build-backend-for-deploy.sh                              ║
# ║  Prépare le backend Node.js pour upload sur Pterodactyl   ║
# ╚════════════════════════════════════════════════════════════╝

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_DIR="$SCRIPT_DIR/backend"
BUILD_DIR="$SCRIPT_DIR/deploy-backend"
OUTPUT_ZIP="$SCRIPT_DIR/cantale-backend-deploy.zip"

echo "========================================"
echo "  Build Backend Cantale pour Deploy"
echo "========================================"

# 1. Nettoyer
rm -rf "$BUILD_DIR" "$OUTPUT_ZIP"
mkdir -p "$BUILD_DIR"

# 2. Compiler TypeScript
echo "[1/4] Compilation TypeScript..."
cd "$BACKEND_DIR"
npm install
npm run build

# 3. Copier les fichiers nécessaires
echo "[2/4] Copie des fichiers de déploiement..."
cp "$BACKEND_DIR/index.js" "$BUILD_DIR/"
cp "$BACKEND_DIR/package.json" "$BUILD_DIR/"
cp "$BACKEND_DIR/.env" "$BUILD_DIR/"
cp -r "$BACKEND_DIR/dist" "$BUILD_DIR/"

# 4. Supprimer les devDependencies du package.json pour alléger l'install
echo "[3/4] Allègement du package.json (prod only)..."
cd "$BUILD_DIR"
node -e "
const fs = require('fs');
const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
delete pkg.devDependencies;
delete pkg.scripts.dev;
if (!pkg.scripts.start) pkg.scripts.start = 'node dist/server.js';
fs.writeFileSync('package.json', JSON.stringify(pkg, null, 2));
console.log('package.json allégé');
"

# 5. Créer le zip
echo "[4/4] Création du zip..."
cd "$SCRIPT_DIR"
zip -r "$OUTPUT_ZIP" deploy-backend/

# 6. Vérification
echo ""
echo "========================================"
echo "  ✅ BUILD TERMINÉ"
echo "========================================"
echo "Fichier zip : $OUTPUT_ZIP"
echo ""
echo "Contenu du zip :"
unzip -l "$OUTPUT_ZIP" | tail -n +4 | head -n -2
echo ""
echo "Instructions :"
echo "  1. Connecte-toi en SFTP au panel Node.js"
echo "  2. Supprime TOUT dans /home/container/"
echo "  3. Extraire $OUTPUT_ZIP dans /home/container/"
echo "  4. Mettre 'index.js' comme Main File"
echo "  5. Démarrer le serveur"
