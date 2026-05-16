/**
 * Cantale API client — utilitaire fetch léger pour le frontend.
 *
 * Toutes les requêtes incluent credentials: 'include' pour envoyer/recevoir le cookie
 * de session (cantale_session) géré par le backend Express.
 *
 * Configuration : window.CANTALE_API_BASE (défaut '/api') doit pointer sur le backend.
 *   En prod : nginx proxy_pass /api → backend:3000
 *   En dev  : window.CANTALE_API_BASE = 'http://localhost:3000/api'
 */

(function (global) {
  const API_BASE = global.CANTALE_API_BASE || '/api';

  async function request(path, options = {}) {
    const url = API_BASE + path;
    const opts = {
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        ...(options.headers || {}),
      },
      ...options,
    };
    if (opts.body && typeof opts.body !== 'string') {
      opts.body = JSON.stringify(opts.body);
    }
    const res = await fetch(url, opts);
    const ct = res.headers.get('content-type') || '';
    const data = ct.includes('application/json') ? await res.json() : await res.text();
    if (!res.ok) {
      const err = new Error((data && data.error) || `HTTP ${res.status}`);
      err.status = res.status;
      err.data = data;
      throw err;
    }
    return data;
  }

  const api = {
    // ───── Auth ─────
    requestLink: () => request('/auth/request-link', { method: 'POST' }),
    checkLink: (code) => request('/auth/check-link/' + encodeURIComponent(code)),
    me: () => request('/auth/me'),
    logout: () => request('/auth/logout', { method: 'POST' }),

    // ───── Joueurs ─────
    getPlayer: (idOrName) => request('/players/' + encodeURIComponent(idOrName)),
    myProfile: () => request('/players/me/profile'),

    // ───── Factions ─────
    listFactions: () => request('/factions'),
    getFaction: (idOrTag) => request('/factions/' + encodeURIComponent(idOrTag)),

    // ───── Leaderboards ─────
    allLeaderboards: () => request('/leaderboards'),
    getLeaderboard: (type, limit = 10) => request(`/leaderboards/${type}?limit=${limit}`),

    // ───── Shop ─────
    catalog: () => request('/shop/catalog'),
    getCart: () => request('/shop/cart'),
    addToCart: (itemId, quantity = 1) => request('/shop/cart', { method: 'POST', body: { itemId, quantity } }),
    updateCart: (itemId, quantity) => request('/shop/cart/' + encodeURIComponent(itemId), { method: 'PATCH', body: { quantity } }),
    removeFromCart: (itemId) => request('/shop/cart/' + encodeURIComponent(itemId), { method: 'DELETE' }),
    clearCart: () => request('/shop/cart/clear', { method: 'POST' }),
    checkout: () => request('/shop/checkout', { method: 'POST' }),

    health: () => request('/health'),
  };

  global.CantaleAPI = api;
})(window);

/**
 * Helper UI : affiche un état "connecté / non connecté" dans un élément.
 * Utilisation : <span data-cantale-user></span> sera rempli à l'auto-init.
 */
window.addEventListener('DOMContentLoaded', async () => {
  const userBadges = document.querySelectorAll('[data-cantale-user]');
  if (userBadges.length === 0) return;
  try {
    const me = await window.CantaleAPI.me();
    userBadges.forEach((el) => {
      el.innerHTML = `<a href="profile.html" style="color:inherit">👤 ${me.name}</a>`;
    });
  } catch {
    userBadges.forEach((el) => {
      el.innerHTML = '<a href="login.html" style="color:inherit">🔓 Se connecter</a>';
    });
  }
});
