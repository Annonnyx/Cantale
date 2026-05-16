/**
 * Configuration globale du frontend Cantale.
 * Définir window.CANTALE_API_BASE avant le chargement de api-client.js.
 *
 * Déploiement PixelHorizons :
 *   - Le provider gère le reverse proxy sur https://cantale.pixelhorizons.fr
 *   - Le backend écoute sur le port 3001 (assigné par le provider)
 *
 * Options :
 *   1. Si le reverse proxy du provider forward /api → port 3001 :
 *      window.CANTALE_API_BASE = '/api';
 *   2. Si le backend est accessible directement sur le port 3001 :
 *      window.CANTALE_API_BASE = 'https://cantale.pixelhorizons.fr:3001/api';
 *      ⚠️ Risque de mixed-content si le backend n'est pas en HTTPS.
 *
 * Par défaut on utilise '/api' (Option 1), car c'est le setup le plus
 * courant avec un reverse proxy.
 */
window.CANTALE_API_BASE = window.CANTALE_API_BASE || '/api';
