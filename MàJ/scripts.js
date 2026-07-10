/* ═══════════════════════════════════════════════════════════
   CANTALE — scripts.js
   DA "Conflit de processus" · paper/ink brutaliste
   ═══════════════════════════════════════════════════════════ */

/* ── LOGO INJECT ── */
(function injectLogo(){
  const tpl = document.getElementById('logo-tpl');
  if(!tpl) return;
  document.querySelectorAll('[id$="logoWrap"],[id="logoWrap"]').forEach(wrap => {
    if(!wrap.hasChildNodes()) wrap.appendChild(tpl.content.cloneNode(true));
  });
})();

/* ── MOBILE MENU ── */
(function mobileMenu(){
  const btn  = document.getElementById('mobBtn');
  const menu = document.getElementById('mobMenu');
  if(!btn || !menu) return;
  btn.addEventListener('click', () => {
    const open = menu.style.display !== 'none';
    menu.style.display = open ? 'none' : 'block';
    btn.setAttribute('aria-expanded', String(!open));
  });
  // Ferme au clic extérieur
  document.addEventListener('click', e => {
    if(!btn.contains(e.target) && !menu.contains(e.target)){
      menu.style.display = 'none';
      btn.setAttribute('aria-expanded', 'false');
    }
  });
})();

/* ── COPY IP ── */
function copyIP(el){
  navigator.clipboard?.writeText('play.cantale.world').catch(() => {});
  const target = el.tagName === 'BUTTON' ? el : el.querySelector('button') || el;
  const was = target.textContent;
  target.textContent = '✓ Copié';
  setTimeout(() => { target.textContent = was; }, 1800);
}

/* ── SCROLL REVEAL ── */
(function scrollReveal(){
  const els = document.querySelectorAll('[data-reveal],.s-reveal,.s-reveal-left');
  if(!els.length) return;
  const obs = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if(e.isIntersecting){
        e.target.classList.add('in');
        // Délai optionnel via data-delay ou classe delay-N
        const delay = e.target.dataset.delay;
        if(delay) e.target.style.transitionDelay = delay + 'ms';
      }
    });
  }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });
  els.forEach(el => obs.observe(el));
})();

/* ── SIDEBAR ACTIVE STATE (règles) ── */
(function sidebarActive(){
  const sections = document.querySelectorAll('.rule-section[id]');
  const links    = document.querySelectorAll('.slink');
  if(!sections.length || !links.length) return;
  const obs = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if(e.isIntersecting){
        links.forEach(l => {
          l.classList.toggle('active', l.getAttribute('href') === '#' + e.target.id);
        });
      }
    });
  }, { threshold: 0.25, rootMargin: '-66px 0px -33% 0px' });
  sections.forEach(s => obs.observe(s));
})();

/* ── TABS ── */
(function tabs(){
  document.querySelectorAll('[data-tab]').forEach(btn => {
    btn.addEventListener('click', () => {
      const group = btn.closest('[data-tabs-group]') || document;
      group.querySelectorAll('[data-tab]').forEach(b => b.classList.toggle('active', b === btn));
      document.querySelectorAll('.tab-content').forEach(c => {
        c.style.display = c.id === 'tab-' + btn.dataset.tab ? '' : 'none';
      });
    });
  });
})();

/* ── SORT BUTTONS (factions) ── */
(function sortBtns(){
  document.querySelectorAll('.sort-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const parent = btn.closest('.toolbar') || document;
      parent.querySelectorAll('.sort-btn').forEach(b => b.classList.toggle('active', b === btn));
    });
  });
})();

/* ── HEADER SCROLL SHADOW ── */
(function headerScroll(){
  const h = document.querySelector('header');
  if(!h) return;
  let ticking = false;
  window.addEventListener('scroll', () => {
    if(!ticking){
      requestAnimationFrame(() => {
        h.style.boxShadow = window.scrollY > 12
          ? '0 4px 0 rgba(10,10,10,.12)'
          : 'none';
        ticking = false;
      });
      ticking = true;
    }
  }, { passive: true });
})();

/* ── TICKER STRIP (index) ── */
(function ticker(){
  const track = document.querySelector('.bstrip-track');
  if(!track) return;
  // Duplique le contenu pour l'animation infinie
  if(!track.dataset.duped){
    track.innerHTML += track.innerHTML;
    track.dataset.duped = '1';
  }
})();

/* ── MAP GÉNÉRATION (index) ── */
(function mapGen(){
  const g = document.getElementById('mapG');
  if(!g || g.childElementCount > 0) return;
  const types = ['c','c','f','f','f','x'];
  for(let i = 0; i < 100; i++){
    const d = document.createElement('div');
    d.className = 'cell ' + types[Math.floor(Math.random() * types.length)];
    g.appendChild(d);
  }
})();

/* ── SMOOTH ANCHOR LINKS ── */
(function anchorLinks(){
  document.querySelectorAll('a[href^="#"]').forEach(a => {
    a.addEventListener('click', e => {
      const target = document.querySelector(a.getAttribute('href'));
      if(!target) return;
      e.preventDefault();
      const offset = 80;
      const top = target.getBoundingClientRect().top + window.scrollY - offset;
      window.scrollTo({ top, behavior: 'smooth' });
    });
  });
})();

/* ── TOAST GLOBAL ── */
function cantaleToast(msg, type = 'ok'){
  const el = document.createElement('div');
  el.textContent = msg;
  el.style.cssText = `
    position:fixed;bottom:32px;right:32px;z-index:10000;
    background:${type === 'ok' ? '#0A0A0A' : '#3a1010'};
    color:${type === 'ok' ? '#F5F4F0' : '#ff8888'};
    border-left:4px solid ${type === 'ok' ? '#F5F4F0' : '#cc4444'};
    padding:14px 20px;
    font-family:'JetBrains Mono',monospace;font-size:13px;font-weight:600;
    box-shadow:4px 4px 0 rgba(0,0,0,.25);
    pointer-events:none;
    transition:opacity .3s;
  `;
  document.body.appendChild(el);
  setTimeout(() => { el.style.opacity = '0'; }, 2600);
  setTimeout(() => { el.remove(); }, 2900);
}

/* ── EXPOSE GLOBALS ── */
window.copyIP        = copyIP;
window.cantaleToast  = cantaleToast;
