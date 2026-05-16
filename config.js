/**
 * Configuration globale du frontend Cantale.
 *
 * Le backend Node.js est hébergé sur PixelHorizons (port 3001).
 * Le site web est sur Vercel.
 *
 * Options selon ton setup :
 *   1. Si PixelHorizons gère un reverse proxy (cantale.pixelhorizons.fr/api → backend:3001) :
 *      window.CANTALE_API_BASE = '/api';
 *   2. Si le backend est accessible directement sur le port 3001 :
 *      window.CANTALE_API_BASE = 'https://cantale.pixelhorizons.fr:3001/api';
 *   3. Pour tester en local avant déploiement :
 *      window.CANTALE_API_BASE = 'http://82.66.173.236:3001/api';
 */
window.CANTALE_API_BASE = window.CANTALE_API_BASE || 'http://82.66.173.236:3001/api';
