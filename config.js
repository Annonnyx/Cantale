/**
 * Configuration globale du frontend Cantale.
 *
 * En prod   : nginx/Vercel proxyfie /api → backend:3001
 * En dev    : appel direct sur localhost:3001
 */
const isLocal = location.hostname === 'localhost' || location.hostname === '127.0.0.1';
window.CANTALE_API_BASE = window.CANTALE_API_BASE || (isLocal ? 'http://localhost:3001/api' : '/api');
