#!/bin/bash
# build-for-deploy.sh — Prépare les fichiers pour le déploiement SFTP
# Usage: ./build-for-deploy.sh

set -e

PROJECT_ROOT="$(cd "$(dirname "$0")" && pwd)"
BACKEND_DIR="$PROJECT_ROOT/backend"
DEPLOY_DIR="$PROJECT_ROOT/deploy"

echo "========================================"
echo "  Cantale — Build pour déploiement"
echo "========================================"

# 1. Nettoyer et créer le dossier deploy
rm -rf "$DEPLOY_DIR"
mkdir -p "$DEPLOY_DIR/frontend"
mkdir -p "$DEPLOY_DIR/backend"

# 2. Compiler le backend
echo "[1/4] Compilation du backend TypeScript..."
cd "$BACKEND_DIR"
npm install >/dev/null 2>&1 || true
npm run build

# 3. Copier le backend compilé
echo "[2/4] Préparation du backend..."
cp "$BACKEND_DIR/package.json" "$DEPLOY_DIR/backend/"
cp -r "$BACKEND_DIR/dist" "$DEPLOY_DIR/backend/"
cp "$BACKEND_DIR/.env.production" "$DEPLOY_DIR/backend/.env.example"

# 4. Copier le frontend
echo "[3/4] Préparation du frontend..."
cp "$PROJECT_ROOT"/*.html "$DEPLOY_DIR/frontend/"
cp "$PROJECT_ROOT"/*.css "$DEPLOY_DIR/frontend/"
cp "$PROJECT_ROOT"/*.js "$DEPLOY_DIR/frontend/"

# 5. Récapitulatif
echo "[4/4] Terminé !"
echo ""
echo "Fichiers prêts dans : $DEPLOY_DIR"
echo ""
echo "Structure :"
find "$DEPLOY_DIR" -type f | sort

echo ""
echo "========================================"
echo "  Prochaines étapes :"
echo "========================================"
echo ""
echo "1. Adapter l'URL API dans :"
echo "   deploy/frontend/api-client.js"
echo "   (changer BASE_URL selon ton setup)"
echo ""
echo "2. Adapter le fichier .env :"
echo "   deploy/backend/.env (créer à partir de .env.example)"
echo ""
echo "3. Transférer via SFTP :"
echo "   - deploy/frontend/*  → /var/www/cantale/"
echo "   - deploy/backend/*   → ~/cantale-backend/"
echo ""
