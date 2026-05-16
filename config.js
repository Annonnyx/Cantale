/**
 * Configuration globale du frontend Cantale.
 *
 * Le backend est proxifié par Vercel (/api → PixelHorizons:3001).
 * Pas de CORS, pas de Mixed Content — tout passe par Vercel.
 */
window.CANTALE_API_BASE = window.CANTALE_API_BASE || '/api';
