/**
 * Client Supabase pour le site web Cantale (Vercel).
 * Remplace api-client.js — lit directement depuis Supabase REST API.
 *
 * Configuration dans config.js :
 *   window.SUPABASE_URL = "https://xxxxx.supabase.co"
 *   window.SUPABASE_ANON_KEY = "eyJ..."
 */
(function (global) {
  const SUPABASE_URL = global.SUPABASE_URL || '';
  const SUPABASE_KEY = global.SUPABASE_ANON_KEY || '';

  if (!SUPABASE_URL || !SUPABASE_KEY) {
    console.warn("[Cantale] SUPABASE_URL ou SUPABASE_ANON_KEY non configuré.");
  }

  const headers = {
    "apikey": SUPABASE_KEY,
    "Authorization": "Bearer " + SUPABASE_KEY,
    "Content-Type": "application/json"
  };

  async function supabaseFetch(table, queryParams = "") {
    const url = `${SUPABASE_URL}/rest/v1/${table}${queryParams}`;
    const res = await fetch(url, { headers });
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Supabase ${res.status}: ${text}`);
    }
    return res.json();
  }

  const CantaleAPI = {
    // ─── Health / Status ───
    async getServerStatus() {
      const rows = await supabaseFetch("server_status", "?server_name=eq.cantale&limit=1");
      return rows[0] || { status: "offline", online_players: 0, max_players: 0, tps: 0 };
    },

    // ─── Players ───
    async getPlayer(identifier) {
      // Par UUID ou nom
      const isUuid = /^[0-9a-f]{8}-?[0-9a-f]{4}-?[0-9a-f]{4}-?[0-9a-f]{4}-?[0-9a-f]{12}$/i.test(identifier);
      const col = isUuid ? "uuid" : "username";
      const rows = await supabaseFetch("players", `?${col}=eq.${encodeURIComponent(identifier)}&limit=1`);
      if (!rows[0]) return null;
      return _enrichPlayer(rows[0]);
    },

    async getMe() {
      // Récupère le joueur lié à la session web
      // TODO: implémenter auth in-game + sessions
      return null;
    },

    // ─── Factions ───
    async listFactions() {
      const rows = await supabaseFetch("factions", "?order=power.desc");
      return { factions: rows, count: rows.length };
    },

    async getFaction(idOrTag) {
      const isId = /^\d+$/.test(idOrTag);
      const col = isId ? "id" : "tag";
      const rows = await supabaseFetch("factions", `?${col}=eq.${encodeURIComponent(idOrTag)}&limit=1`);
      if (!rows[0]) return null;

      const faction = rows[0];
      // Récupérer les membres
      const members = await supabaseFetch("faction_members", `?faction_id=eq.${faction.id}`);
      faction.members = members;
      return faction;
    },

    // ─── Leaderboards ───
    async getLeaderboard(category = "kills", limit = 50) {
      const rows = await supabaseFetch(
        "leaderboards",
        `?category=eq.${category}&order=rank.asc&limit=${limit}`
      );
      return { entries: rows, category };
    },

    // ─── Auth (placeholder) ───
    async getLinkCode() {
      // TODO: appeler un edge function ou backend Vercel pour générer un code
      return { code: "XXXXXX" };
    },

    async verifyLinkCode(code) {
      // TODO: vérifier le code et créer une session
      return { success: false };
    },

    async logout() {
      document.cookie = "cantale_session=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
      return { success: true };
    },

    async getSession() {
      // TODO: lire le cookie session et vérifier avec Supabase
      return null;
    }
  };

  async function _enrichPlayer(base) {
    // Enrichir avec faction si possible
    try {
      const memberships = await supabaseFetch(
        "faction_members",
        `?player_uuid=eq.${base.uuid}&limit=1`
      );
      if (memberships[0]) {
        const factions = await supabaseFetch(
          "factions",
          `?id=eq.${memberships[0].faction_id}&limit=1`
        );
        if (factions[0]) {
          base.faction = {
            id: factions[0].id,
            name: factions[0].name,
            tag: factions[0].tag,
            memberRank: memberships[0].rank
          };
        }
      }
    } catch (e) {
      // ignore
    }
    return base;
  }

  global.CantaleAPI = CantaleAPI;
})(window);
