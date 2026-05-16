/**
 * Configuration globale du frontend Cantale (Vercel + Supabase).
 *
 * Remplace l'ancien backend local par Supabase REST API.
 * Les données proviennent du bot Discord/plugin Minecraft.
 *
 * 1. Crée un projet sur https://supabase.com
 * 2. Exécute SUPABASE_SCHEMA.sql dans l'éditeur SQL
 * 3. Va dans Settings → API pour récupérer l'URL et la clé anon
 * 4. Remplace les valeurs ci-dessous
 */
window.SUPABASE_URL = "https://xxxxxxxxxxxxxxxx.supabase.co";
window.SUPABASE_ANON_KEY = "eyJ...";

// Gardé pour compatibilité (non utilisé avec Supabase)
window.CANTALE_API_BASE = window.CANTALE_API_BASE || '/api';
